"""Deterministic development scorer; no provider calls or search-code imports."""
import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def score_case(case, rubric):
    rules = {r['id']: r for r in rubric['rules']}
    if set(case['checks']) != set(rules):
        raise ValueError('Assessment must include exactly the configured checks')
    evidence = {e['id']: e for e in case['evidence']}
    totals = dict(supported=0, contradicted=0, unknown=0)
    used_events = set()
    for check_id, check in case['checks'].items():
        state = check['state']
        if state not in totals:
            raise ValueError(f'{check_id}: invalid state')
        refs = check.get('evidence_ids', [])
        if any(ref not in evidence for ref in refs):
            raise ValueError(f'{check_id}: unknown evidence reference')
        if state != 'unknown':
            if not refs or not check.get('reason') or not case.get('reviewer') or not check.get('assessed_at_utc'):
                raise ValueError(f'{check_id}: evidence, reason, reviewer and assessment time required')
            if any(not evidence[ref].get('captured_at_utc') for ref in refs):
                raise ValueError(f'{check_id}: dated evidence required')
            events = check.get('primary_event_ids', [])
            if not events or len(events) != len(set(events)) or used_events.intersection(events):
                raise ValueError(f'{check_id}: distinct primary event IDs required; avoid double counting')
            used_events.update(events)
        totals[state] += rules[check_id]['weight']
    alerts = case.get('alerts', [])
    for alert in alerts:
        if alert.get('severity') not in ('critical', 'review') or not alert.get('reason') or not alert.get('evidence_ids') or any(x not in evidence for x in alert['evidence_ids']):
            raise ValueError('Alerts require severity, reason and valid evidence references')
    return {'case_id': case['case_id'], 'vin': case['vin'], 'rubric_version': rubric['version'],
            'evidence_support': totals['supported'], 'contradicted': totals['contradicted'],
            'unknown': totals['unknown'], 'coverage': 100 - totals['unknown'],
            'review_required': any(a['severity'] == 'critical' for a in alerts),
            'status': 'not yet verified' if totals['unknown'] == 100 else 'development assessment; unvalidated weights',
            'alerts': alerts}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('assessment', type=Path)
    args = parser.parse_args()
    rubric = json.loads((HERE / 'rubric_v0_1.json').read_text())
    pilot = json.loads(args.assessment.read_text())
    if pilot['rubric_version'] != rubric['version']:
        raise ValueError('Rubric version mismatch')
    print(json.dumps([score_case(c, rubric) for c in pilot['cases']], indent=2))


if __name__ == '__main__':
    main()
