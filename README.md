# FirstPass

Used-car search with a research-grounded rubric for listing trustworthiness.

> The extent to which available evidence supports a listing’s identity, material claims, disclosures, and proposed transaction.

## Start here

Read [setup instructions](README.txt), then open `FirstPass_Search_and_Scoring.ipynb` from this folder. Keep `firstpass_scoring` beside the notebook. The React/Figma Make source is in [frontend](frontend). Use your own free-tier credentials, backend password and ngrok URL; none are included.

## Current scoring

Unknown checks are excluded: **score = 100 × supported weight / (supported + contradicted weight)**. Evidence coverage is tracked separately. The provisional display policy requires 50% coverage across three categories; otherwise the UI shows **Insufficient evidence**. Neither this policy nor the weights are validated.

**Current automatic collection checks only VIN/core specifications through public NHTSA vPIC (6% of the rubric). Most live listings therefore receive no numeric score yet.** The remaining checks need additional traceable evidence collection and human review. Sample-card numbers are illustrative and never substituted for live scores. Click a score/status button for the short explanation.

## Contents

- Notebook: search, authenticated API, automatic local JSON exports and scoring integration.
- `firstpass_scoring/`: rule configuration, free VIN verification and conditional aggregation.
- `frontend/`: complete interface source, clickable explanations and response validation.
- `research/`: rubric versions, PDF/HTML reports, ten-listing pilot, evidence records and paper notes. These preserve historical methods; see the archive README.
- Tests: mocked backend integration and frontend behavior. No live paid provider requests were made for validation.

The added verifier purchases no reports. Existing MarketCheck searches and Gemini chat still use those services’ allowances; configure free accounts and avoid enabling paid billing. Saved search exports belong on the backend computer, not in this public repository.

## Checks

```sh
python -m pip install -r requirements.txt
python -m unittest discover -s . -p 'test_*.py'
cd frontend
npm ci
npm run test:mocked
npx tsc --noEmit
npm run build
```

This is a class research prototype, not a validated fraud probability or a mechanical inspection.
