import json,os,re,tempfile,unittest,datetime
from dataclasses import dataclass,field,asdict
from enum import Enum
from pathlib import Path
from typing import Any,Dict,List,Optional
from unittest.mock import patch
from types import SimpleNamespace
import requests
from fastapi.testclient import TestClient
from firstpass_scoring import live

ROOT=Path(__file__).parent
class Integration(unittest.TestCase):
 def test_authenticated_session_search_and_export_contain_assessment(self):
  nb=json.loads((ROOT/'FirstPass_Search_and_Scoring.ipynb').read_text())
  source=next(''.join(c['source'])for c in nb['cells']if ''.join(c['source']).startswith('#@title 4.'))
  ns=dict(dataclass=dataclass,field=field,asdict=asdict,Enum=Enum,os=os,json=json,re=re,datetime=datetime,Any=Any,Dict=Dict,List=List,Optional=Optional,requests=requests,__name__='fixture_backend')
  exec(compile(source,'shared_notebook_step4','exec'),ns)
  vin='3CZRZ2H51RM731100'
  raw={'listings':[{'id':'fixture-1','vin':vin,'heading':'2024 Honda HR-V Sport','price':25000,'miles':30000,'dist':5,'build':{'year':2024,'make':'Honda','model':'HR-V'},'dealer':{'name':'Fixture Dealer'},'vdp_url':'https://dealer.example/car','media':{'photo_links':[]}}]}
  decoded={'Results':[{'VIN':vin,'ErrorCode':'0','ModelYear':'2024','Make':'Honda','Model':'HR-V'}]}
  response=lambda payload:SimpleNamespace(status_code=200,raise_for_status=lambda:None,json=lambda:payload)
  with tempfile.TemporaryDirectory()as tmp,patch.dict(os.environ,{'FIRSTPASS_EXPORT_DIR':tmp,'MARKETCHECK_API_KEY':'fixture-not-a-key'}),patch.object(requests,'get',return_value=response(raw)),patch.object(live._DEFAULT,'post',return_value=response(decoded)):
   live._DEFAULT.cache.clear();live._DEFAULT.cooldown_until=0
   app=ns['make_conversation_api'](authenticate=lambda request:'fixture-owner',provider=object(),allowed_origins=['https://fixture.example'])
   with TestClient(app)as c:
    sess=c.post('/sessions').json()
    result=c.post('/sessions/'+sess['session_id']+'/search',headers={'X-Conversation-Token':sess['session_token']},json={'search_description':'','zip_code':'80303','radius':50,'price_min':0,'price_max':50000,'year_min':2020,'year_max':2026,'mileage_min':0,'mileage_max':50000,'max_owners':None})
    self.assertEqual(result.status_code,200,result.text)
    body=result.json();a=body['exact'][0]['trustworthiness']
    self.assertEqual(a['coverage'],6);self.assertIsNone(a['score']);self.assertEqual(a['status'],'insufficient_evidence')
    exports=list(Path(tmp).glob('*.json'));self.assertEqual(len(exports),1)
    saved=json.loads(exports[0].read_text());self.assertEqual(saved['displayed_results']['exact'][0]['trustworthiness']['coverage'],6)
    self.assertNotIn('fixture-not-a-key',exports[0].read_text())

if __name__=='__main__':unittest.main()
