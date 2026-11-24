"""Score completed v0.2 annotations; pending assessments have no numeric result.

This validates structure and provenance, not whether a reviewer's interpretation is true.
No network requests are made.
"""
import argparse
import json
from datetime import datetime
from fractions import Fraction
from pathlib import Path

HERE = Path(__file__).resolve().parent


def instant(value):
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('Timestamps must include a timezone')
    return result


def score_case(case, rubric):
    if rubric['version'] != '0.2-development':
        raise ValueError('Expected v0.2 rubric')
    rules = {r['id']: r for r in rubric['rules']}
    if set(case['checks']) != set(rules):
        raise ValueError('Exactly 22 configured check entries required')
    for ch in case['checks'].values():
        if ch['state'] not in rubric['states']:
            raise ValueError('Invalid check state')
    if not case.get('reviewer') or not case.get('assessment_at_utc'):
        return {'case_id': case['case_id'], 'rubric_version': rubric['version'],
                'status': 'reassessment_pending', 'evidence_support': None,
                'contradicted': None, 'unknown': None, 'coverage': None}
    at = instant(case['assessment_at_utc'])
    if not case.get('claim_inventory_complete') or not case.get('claim_inventory'):
        raise ValueError('Completed material claim inventory required')
    claim_ids = [x['id'] for x in case['claim_inventory']]
    if len(claim_ids) != len(set(claim_ids)):
        raise ValueError('Duplicate claim IDs')
    profile = rubric['policy']['applicability']['allowed_profiles'].get(case['profile'])
    if profile is None:
        raise ValueError('Unknown applicability profile')
    evidence = {e['id']: e for e in case['evidence']}
    if len(evidence) != len(case['evidence']):
        raise ValueError('Duplicate evidence IDs')
    excluded = set(profile['excluded'])
    if excluded:
        decision = case.get('profile_decision') or {}
        if not decision.get('reason') or not decision.get('evidence_ids') or any(x not in evidence for x in decision['evidence_ids']):
            raise ValueError('D4 exclusion needs a reason and valid evidence')
        if decision.get('specialized_claims_present') is not False or decision.get('ordinary_combustion') is not True:
            raise ValueError('D4 exclusion requires documented ordinary combustion and no applicable specialized claims')
    base_total = sum(r['weight'] for rid, r in rules.items() if rid not in excluded)
    totals = {s: Fraction(0) for s in rubric['states']}
    used_events = set()
    for rid, ch in case['checks'].items():
        refs = ch.get('evidence_ids', [])
        if any(x not in evidence for x in refs):
            raise ValueError(f'{rid}: unknown evidence ID')
        if not ch.get('reason') or not ch.get('next_action'):
            raise ValueError(f'{rid}: reason and next action required')
        if rid in excluded:
            if ch['state'] != 'unknown':
                raise ValueError('Excluded D4 cannot earn points or carry a contradiction')
            continue
        if ch['state'] != 'unknown':
            if not refs or not ch.get('required_elements_reviewed') or not ch.get('scope_limitations'):
                raise ValueError(f'{rid}: evidence, element review and scope limitations required')
            if not ch.get('claim_ids') or any(x not in claim_ids for x in ch['claim_ids']):
                raise ValueError(f'{rid}: valid material claim references required')
            if ch['state'] == 'contradicted' and ch.get('reconciliation_complete') is not True:
                raise ValueError(f'{rid}: contradiction needs completed reconciliation')
            events = ch.get('primary_event_ids', [])
            if not events or len(events) != len(set(events)) or used_events.intersection(events):
                raise ValueError(f'{rid}: distinct primary events required')
            used_events.update(events)
            dates = [instant(evidence[x]['captured_at_utc']) for x in refs]
            if any(dt > at for dt in dates):
                raise ValueError(f'{rid}: future evidence cannot support an assessment')
            policy_key = rules[rid]['freshness_policy']
            window = rubric['policy']['freshness'].get(policy_key)
            if isinstance(window, int):
                basis = ch.get('freshness_evidence_id')
                if basis not in refs or not ch.get('freshness_basis_at_utc'):
                    raise ValueError(f'{rid}: explicit relevant freshness basis required')
                dt = instant(ch['freshness_basis_at_utc'])
                if not 0 <= (at - dt).total_seconds() <= window * 86400:
                    raise ValueError(f'{rid}: stale or future freshness basis; reassess as unknown')
                if ch.get('material_change_since_evidence') is not False:
                    raise ValueError(f'{rid}: confirm no intervening material change')
        totals[ch['state']] += Fraction(rules[rid]['weight'] * 100, base_total)
    assert sum(totals.values()) == 100
    return {'case_id': case['case_id'], 'rubric_version': rubric['version'],
            'status': 'provisional_development_assessment', 'profile': case['profile'],
            'applicable_base_total': base_total,
            'evidence_support': float(totals['supported']),
            'contradicted': float(totals['contradicted']), 'unknown': float(totals['unknown']),
            'coverage': float(totals['supported'] + totals['contradicted']),
            'ranking_allowed': False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('assessment', type=Path)
    args = parser.parse_args()
    rubric = json.loads((HERE / 'rubric_v0_2.json').read_text())
    dataset = json.loads(args.assessment.read_text())
    if dataset['rubric_version'] != rubric['version']:
        raise ValueError('Assessment/rubric version mismatch')
    print(json.dumps([score_case(c, rubric) for c in dataset['cases']], indent=2))
