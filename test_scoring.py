import copy
import json
import unittest
from firstpass_scoring.aggregation import aggregate
from firstpass_scoring.live import LiveScorer, attach_scores, RUBRIC

VIN='3CZRZ2H51RM731100'
RAW={'vin':VIN,'build':{'year':2024,'make':'Honda','model':'HR-V','drivetrain':'AWD','fuel_type':'Gasoline'},'vdp_url':'https://dealer.example/car'}
DECODE={'VIN':VIN,'ErrorCode':'0','ModelYear':'2024','Make':'HONDA','Model':'HR-V','DriveType':'4WD/4-Wheel Drive/4x4','FuelTypePrimary':'Gasoline'}
class Response:
    def raise_for_status(self): pass
    def json(self): return {'Results':[copy.deepcopy(DECODE)]}
class Tests(unittest.TestCase):
    def checks(self): return [{'id':r['id'],'weight':r['weight'],'state':'unknown'}for r in RUBRIC['rules']]
    def test_unknown_not_zero_trust(self):
        s=aggregate(self.checks());self.assertIsNone(s['score']);self.assertIsNone(s['conditional_score']);self.assertEqual(s['coverage'],0)
    def test_vin_only_not_100_display(self):
        c=self.checks();c[0]['state']='supported';s=aggregate(c)
        self.assertEqual(s['conditional_score'],100);self.assertEqual(s['coverage'],6);self.assertIsNone(s['score'])
    def test_unknown_excluded_formula(self):
        c=self.checks()
        for x in c:
            if x['id'][0]in'ABC':x['state']='supported'
        c[0]['state']='contradicted';s=aggregate(c)
        self.assertEqual(s['coverage'],65);self.assertAlmostEqual(s['score'],90.8)
        self.assertEqual(s['unknown'],35)
    def test_breadth_gate(self):
        c=self.checks()
        for x in c:
            if x['id'][0]in'AB':x['state']='supported'
        self.assertIsNone(aggregate(c,minimum_coverage=40)['score'])
    def test_cache_one_batch_no_key(self):
        calls=[]
        def post(url,**kw):calls.append((url,kw));return Response()
        scorer=LiveScorer(post=post);card={'vin':VIN,'price':20000,'mileage':10000,'listing_url':RAW['vdp_url']}
        for _ in range(2):
            result={'exact':[dict(card)],'near':[]};attach_scores(result,{'listings':[RAW]},scorer)
            a=result['exact'][0]['trustworthiness'];self.assertIsNone(a['score']);self.assertEqual(a['coverage'],6)
        self.assertEqual(len(calls),1);self.assertNotIn('api_key',str(calls))
    def test_failure_keeps_results_and_unknown(self):
        import requests
        def fail(*a,**k):raise requests.Timeout('sensitive provider text')
        scorer=LiveScorer(post=fail);r={'exact':[{'vin':VIN,'listing_url':RAW['vdp_url']}],'near':[]}
        attach_scores(r,{'listings':[RAW]},scorer);a=r['exact'][0]['trustworthiness']
        self.assertEqual(a['coverage'],0);self.assertNotIn('sensitive',json.dumps(a));self.assertEqual(len(r['exact']),1)
    def test_no_display_defaults_as_evidence(self):
        row=copy.deepcopy(RAW);del row['build']['make'];r={'exact':[{'vin':VIN,'name':'Honda HR-V','listing_url':RAW['vdp_url']}],'near':[]}
        attach_scores(r,{'listings':[row]},LiveScorer(post=lambda *a,**k:Response()))
        self.assertEqual(r['exact'][0]['trustworthiness']['coverage'],0)
    def test_mismatch_not_fraud(self):
        row=copy.deepcopy(RAW);row['build']['model']='Civic';r={'exact':[{'vin':VIN,'listing_url':RAW['vdp_url']}],'near':[]}
        attach_scores(r,{'listings':[row]},LiveScorer(post=lambda *a,**k:Response()));a=r['exact'][0]['trustworthiness']
        self.assertEqual(a['contradicted'],0);self.assertEqual(a['coverage'],0);self.assertTrue(a['alerts'])
    def test_empty_no_request(self):
        def fail(*a,**k):raise AssertionError('No call expected')
        r={'exact':[],'near':[]};attach_scores(r,{'listings':[]},LiveScorer(post=fail))
    def test_duplicate_vin_ambiguous_stays_unknown(self):
        r={'exact':[{'vin':VIN,'listing_url':'https://other.example'}],'near':[]}
        attach_scores(r,{'listings':[RAW,RAW]},LiveScorer(post=lambda *a,**k:Response()))
        self.assertEqual(r['exact'][0]['trustworthiness']['coverage'],0)
    def test_unknown_excluded_from_denominator(self):
        c=[{'id':'A1','weight':30,'state':'supported'},{'id':'B1','weight':30,'state':'supported'},{'id':'C1','weight':20,'state':'contradicted'},{'id':'D1','weight':20,'state':'unknown'}]
        result=aggregate(c)
        self.assertEqual(result['score'],75)
        self.assertEqual(result['coverage'],80)
        self.assertEqual(result['unknown'],20)
    def test_low_coverage_does_not_display_100(self):
        c=self.checks();c[0]['state']='supported';result=aggregate(c)
        self.assertEqual(result['conditional_score'],100)
        self.assertEqual(result['coverage'],6)
        self.assertIsNone(result['score'])
    def test_invalid_weights(self):
        c=self.checks();c[0]['weight']=float('nan')
        with self.assertRaises(ValueError):aggregate(c)

if __name__=='__main__':unittest.main()
