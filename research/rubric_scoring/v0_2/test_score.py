import copy
import json
import unittest
from pathlib import Path
from score import score_case

D = Path(__file__).parent
R = json.loads((D / 'rubric_v0_2.json').read_text())
Q = json.loads((D / 'reassessment_queue.json').read_text())


def fixture():
    c = copy.deepcopy(Q['cases'][0])
    c.update(reviewer='synthetic test reviewer', assessment_at_utc='2026-11-24T07:00:00+00:00',
             claim_inventory_complete=True, claim_inventory=[{'id': 'claim-1', 'text': 'synthetic'}])
    return c


class ScorerTests(unittest.TestCase):
    def test_pending_has_no_number(self):
        self.assertIsNone(score_case(Q['cases'][0], R)['evidence_support'])

    def test_unknown_is_not_contradicted(self):
        s = score_case(fixture(), R)
        self.assertEqual((s['evidence_support'], s['contradicted'], s['unknown']), (0, 0, 100))

    def test_profile_normalizes_without_awarding_missing_d4(self):
        c = fixture()
        c['profile'] = 'core_97'
        c['profile_decision'] = {'reason': 'synthetic ordinary combustion profile',
            'evidence_ids': [c['evidence'][0]['id']], 'ordinary_combustion': True,
            'specialized_claims_present': False}
        s = score_case(c, R)
        self.assertEqual(s['unknown'], 100)
        self.assertEqual(s['applicable_base_total'], 97)

    def test_missing_profile_reason_rejected(self):
        c = fixture(); c['profile'] = 'core_97'
        with self.assertRaises(ValueError): score_case(c, R)

    def test_support_requires_evidence(self):
        c = fixture(); c['checks']['A1']['state'] = 'supported'
        with self.assertRaises(ValueError): score_case(c, R)

    def test_valid_support_and_duplicate_event_rejection(self):
        c = fixture(); ref = next(e['id'] for e in c['evidence'] if e['kind'] == 'official_vin_decode')
        ch = c['checks']['A1']; ch.update(state='supported', evidence_ids=[ref],
            required_elements_reviewed=True, scope_limitations='synthetic scope',
            claim_ids=['claim-1'], primary_event_ids=['event-1'])
        self.assertEqual(score_case(c, R)['evidence_support'], 6)
        c['checks']['C3'] = copy.deepcopy(ch)
        with self.assertRaises(ValueError): score_case(c, R)

    def test_future_evidence_rejected(self):
        c = fixture(); c['evidence'][0]['captured_at_utc'] = '2027-01-01T00:00:00Z'
        c['checks']['A1'].update(state='supported', evidence_ids=[c['evidence'][0]['id']],
            required_elements_reviewed=True, scope_limitations='synthetic scope',
            claim_ids=['claim-1'], primary_event_ids=['event-1'])
        with self.assertRaises(ValueError): score_case(c, R)

    def test_stale_current_reading_and_unreconciled_contradiction_rejected(self):
        c = fixture(); ref = c['evidence'][0]['id']; ch = c['checks']['C2']
        ch.update(state='supported', evidence_ids=[ref], required_elements_reviewed=True,
            scope_limitations='synthetic', claim_ids=['claim-1'], primary_event_ids=['event-1'],
            freshness_evidence_id=ref, freshness_basis_at_utc='2026-10-01T00:00:00Z',
            material_change_since_evidence=False)
        with self.assertRaises(ValueError): score_case(c, R)
        ch.update(state='contradicted', freshness_basis_at_utc='2026-11-23T00:00:00Z')
        with self.assertRaises(ValueError): score_case(c, R)
        ch['reconciliation_complete'] = True
        self.assertEqual(score_case(c, R)['contradicted'], 5)


if __name__ == '__main__': unittest.main()
