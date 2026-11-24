"""Free, conservative live evidence scoring. No keys, paid history or seller contact.
Only A1 can currently earn points. All other checks remain explicitly unknown.
"""
import copy
import json
import re
import threading
import time
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path
import requests
from .aggregation import aggregate

RUBRIC = json.loads(Path(__file__).with_name('rubric.json').read_text())
ENDPOINT = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVINValuesBatch/'
VIN_RE = re.compile(r'^[A-HJ-NPR-Z0-9]{17}$')
SCHEMA = 'firstpass.live_evidence.v1'


def norm(value):
    return re.sub(r'[^a-z0-9]', '', str(value or '').lower())


def model_name(value):
    value = norm(value)
    return {'q4etron': 'q4', 'mx5miata': 'mx5', 'mx5miatarf': 'mx5'}.get(value, value)


def identity_review(item, decoded):
    """Compatibility is not physical VIN authentication; ambiguous differences stay unknown."""
    vin = str(item.get('vin') or '').strip().upper()
    build = item.get('build') if isinstance(item.get('build'), dict) else {}
    if not VIN_RE.fullmatch(vin):
        return False, 'A complete, valid-format VIN was not supplied.', []
    if not decoded:
        return False, 'Official VIN verification is unavailable; no identity points were awarded.', []
    if str(decoded.get('VIN', '')).upper() != vin or str(decoded.get('ErrorCode')) != '0':
        return False, 'The official decoder returned an error or ambiguity; the VIN needs review.', []
    comparisons = [('year', str(build.get('year') or ''), str(decoded.get('ModelYear') or '')),
                   ('make', norm(build.get('make')), norm(decoded.get('Make'))),
                   ('model', model_name(build.get('model')), model_name(decoded.get('Model')))]
    if any(not a or not b for _, a, b in comparisons):
        return False, 'Original year, make or model evidence is incomplete; display defaults were not scored.', []
    mismatches = [name for name, a, b in comparisons if a != b]
    # Only compare core powertrain elements actually supplied by both sources.
    raw_ev = norm(build.get('ev_type'))
    official_ev = str(decoded.get('ElectrificationLevel') or '')
    if raw_ev in {'bev','phev','hev'} and official_ev:
        if raw_ev not in norm(official_ev): mismatches.append('electrification')
    drive = norm(build.get('drivetrain'))
    official_drive = norm(decoded.get('DriveType'))
    groups = {'awd':'all', '4wd':'all', '4x4':'all', 'fwd':'front', 'rwd':'rear'}
    expected = groups.get(drive)
    actual = ('all' if any(x in official_drive for x in ('awd','4wd','4wheel','4x4')) else
              'front' if 'front' in official_drive or 'fwd' in official_drive else
              'rear' if 'rear' in official_drive or 'rwd' in official_drive else None)
    if expected and actual and expected != actual: mismatches.append('drivetrain')
    fuel = norm(build.get('fuel_type'))
    fuel = {'unleaded':'gasoline','premiumunleaded':'gasoline','gas':'gasoline'}.get(fuel, fuel)
    decoded_fuels = norm(str(decoded.get('FuelTypePrimary') or '') + str(decoded.get('FuelTypeSecondary') or ''))
    if fuel in {'electric','diesel','gasoline'} and decoded_fuels and fuel not in decoded_fuels:
        mismatches.append('fuel type')
    if mismatches:
        return False, 'Official VIN details need reconciliation for: ' + ', '.join(mismatches) + '. No deception conclusion was made.', mismatches
    return True, 'The official VIN decode is compatible with the supplied year, make, model and comparable core powertrain details. It does not verify physical VIN, trim/options, title or condition.', []


class LiveScorer:
    def __init__(self, post=None, clock=time.monotonic, timeout=5, ttl=86400, capacity=512):
        self.post = post or requests.post
        self.clock = clock
        self.timeout = timeout
        self.ttl = ttl
        self.capacity = capacity
        self.cache = OrderedDict()
        self.lock = threading.Lock()
        self.cooldown_until = 0

    def decode(self, items):
        requested = {}
        for item in items:
            vin = str(item.get('vin') or '').strip().upper()
            build = item.get('build') or {}
            year = str(build.get('year') or '') if isinstance(build, dict) else ''
            if VIN_RE.fullmatch(vin) and re.fullmatch(r'\d{4}', year):
                requested[(vin,year)] = None
        result = {}
        # One lock coalesces simultaneous searches and prevents unbounded duplicate calls.
        with self.lock:
            now = self.clock()
            for key in requested:
                cached = self.cache.get(key)
                if cached and cached[0] > now:
                    result[key[0]] = copy.deepcopy(cached[1])
                    self.cache.move_to_end(key)
            missing = [key for key in requested if key[0] not in result][:50]
            if not missing or now < self.cooldown_until:
                return result
            try:
                response = self.post(ENDPOINT, data={'format':'json','data':';'.join(v+','+y for v,y in missing)}, timeout=self.timeout)
                response.raise_for_status()
                payload = response.json()
                rows = payload.get('Results') if isinstance(payload, dict) else None
                if not isinstance(rows, list): raise ValueError('Invalid decoder response')
                for row in rows:
                    if not isinstance(row, dict): continue
                    vin = str(row.get('VIN') or '').upper()
                    matches = [key for key in missing if key[0] == vin]
                    if len(matches) != 1: continue
                    key = matches[0]
                    row = dict(row)
                    row['_firstpass_captured_at_utc'] = datetime.now(timezone.utc).isoformat()
                    result[vin] = copy.deepcopy(row)
                    self.cache[key] = (now + self.ttl, copy.deepcopy(row))
                while len(self.cache) > self.capacity: self.cache.popitem(last=False)
            except (requests.RequestException, ValueError, TypeError, KeyError):
                self.cooldown_until = now + 60
                # Never leak provider exceptions, URLs, headers or credential strings.
            return result

    def assess(self, item, decoded, card, assessed_at):
        supported, reason, mismatch = identity_review(item, decoded)
        vin = str(item.get('vin') or '').strip().upper()
        evidence = []
        if decoded:
            evidence.append({'id':'official-vin','kind':'official_vin_decode',
                'url':f'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{vin}?format=json',
                'captured_at_utc':decoded.get('_firstpass_captured_at_utc', assessed_at),'scope':'Claimed VIN/specification compatibility only; not title, recalls or physical identity.'})
        checks = []
        for rule in RUBRIC['rules']:
            is_identity = rule['id'] == 'A1'
            checks.append({'id':rule['id'],'weight':rule['weight'],
                'state':'supported' if is_identity and supported else 'unknown',
                'reason':reason if is_identity else 'Not automatically verified by this release.',
                'next_action':rule['next_action'],
                'evidence_ids':['official-vin'] if is_identity and decoded else []})
        totals = aggregate(checks)
        return {'schema_version':SCHEMA,'rubric_version':RUBRIC['version'],
            'automation_version':'free-vin-only-1.0','profile':'full_100',
            'vin':vin,'price':card.get('price'),'mileage':card.get('mileage'),
            'assessed_at_utc':assessed_at, **totals,
            'aggregation_version':'conditional-unknown-excluded-1.0',
            'verification_status':'completed' if decoded else 'unavailable',
            'summary':'Only VIN/specification compatibility is automated. Other checks remain unknown.',
            'reasons':[{'text':reason,'points':0 if supported else 6},
                       {'text':'Seller identity, ownership and current possession are unverified.','points':14},
                       {'text':'Title, damage and previous-use records are unverified.','points':25},
                       {'text':'Mileage, equipment and availability need corroboration.','points':20},
                       {'text':'Condition, maintenance, recalls and specialized checks are unverified.','points':15},
                       {'text':'Photo attribution and relevant views have not been inspected.','points':10},
                       {'text':'Full price terms and transaction arrangements are unverified.','points':10}],
            'alerts':[{'severity':'review','text':reason}] if mismatch else [],
            'checks':checks,'evidence':evidence,
            'limitations':['Evidence support, not honesty/safety/fraud probability.','Proposed unvalidated weights.','No dealer contact, paid history, image inspection or battery test performed.']}


_DEFAULT = LiveScorer()


def attach_scores(result, provider_response, scorer=None):
    """Decorate displayed cards using raw evidence; never use mapper defaults as proof."""
    scorer = scorer or _DEFAULT
    raw = provider_response.get('listings', []) if isinstance(provider_response, dict) else []
    by_vin = {}
    for item in raw:
        if isinstance(item, dict): by_vin.setdefault(str(item.get('vin') or '').strip().upper(), []).append(item)
    cards = result.get('exact', []) + result.get('near', [])
    items = []
    for card in cards:
        candidates = by_vin.get(str(card.get('vin') or '').strip().upper(), [])
        # Duplicated VIN advertisements need unambiguous provider URL attribution.
        matches = [x for x in candidates if x.get('vdp_url') == card.get('listing_url')]
        item = matches[0] if len(matches)==1 else candidates[0] if len(candidates)==1 else {}
        items.append(item)
    decodes = scorer.decode(items)
    at = datetime.now(timezone.utc).isoformat()
    for card, item in zip(cards, items):
        vin = str(item.get('vin') or '').strip().upper()
        card['trustworthiness'] = scorer.assess(item, decodes.get(vin), card, at)
        if not item: card['trustworthiness']['vin'] = str(card.get('vin') or '').strip().upper()
    return result
