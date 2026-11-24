FIRSTPASS — SEARCH + EVIDENCE SCORING
Share this entire folder, not the notebook alone.

WHAT CHANGED
Unknown checks are excluded from the score calculation.
Score = 100 × supported weight / (supported weight + contradicted weight).
Coverage = supported weight + contradicted weight (rubric weights total 100).
Example: supported 60, contradicted 20, unknown 20 => score 75, coverage 80%.
Unknown information is neither a contradiction nor a reason to subtract points.

The initial display policy requires 50% coverage across at least three evidence
categories before displaying a numeric score. Otherwise the button says
“Insufficient evidence”. These thresholds are proposed, unvalidated research
choices, not official standards. The frontend checks the same policy.

CURRENT AUTOMATION — PLEASE READ
This release automatically checks VIN/core-specification compatibility using
NHTSA's public vPIC decoder. That check has weight 6. Other checks remain unknown
unless additional evidence collection is implemented. Therefore normal live
results from this release show “Insufficient evidence”, not a numeric score.
This is a working integration and scoring foundation, not a completed verifier
of seller identity, title, damage, mileage history, condition or payment safety.
A decoder mismatch stays unknown with a review alert; it is not proof of fraud.
Sample cards retain illustrative scores; live cards never borrow sample scores.
Click the score/status button to see the short explanation. Explanations are
not expanded on the listing card by default.

SETUP FOR YOUR CLASSMATE — VS CODE
1. Unzip the package and open FirstPass-share as a folder in VS Code.
2. Open FirstPass_Search_and_Scoring.ipynb; select a Python notebook kernel.
   Use Python 3.11 or newer. Keep firstpass_scoring beside the notebook.
3. Run Steps 1, 2, 3 and 4 in order. Enter your own credentials at hidden prompts.
   Step 3 asks you to create a temporary backend password (24+ characters).
   Do not paste credentials into source code, Figma code or messages.
4. Step 5 is optional mocked testing and uses no provider calls.
5. Run Step 6. Supply the exact HTTPS origin of YOUR Figma app preview
   (scheme + host only). The Figma editor's www.figma.com URL is not this origin.
6. Run Step 7 with your own ngrok authtoken. Copy the printed backend HTTPS URL.
7. Run Step 8 to check connectivity. Keep the notebook/runtime and tunnel running.
8. Update the frontend as described below, then enter the backend password in
   the app's connection/login interface.
If you rerun Step 4, rerun Step 6. A restarted tunnel may require a new frontend
URL; a new preview origin requires updating Step 6.

FRONTEND — INCLUDED SOURCE
The frontend folder contains the complete React/Vite app source.
For local development: install Node 22+; in frontend run npm ci, copy
.env.example to .env.local, put your backend URL in VITE_API_BASE_URL, then
run npm run dev. Allow that exact frontend origin in your backend configuration;
the notebook's default origin prompt expects an HTTPS Figma preview origin.

For an existing Figma Make project, back up its source first. Copy these files
from frontend into the same paths in that project:
  src/App.tsx
  src/evidence/EvidenceReview.tsx
  src/evidence/liveAssessment.ts
  src/evidence/rubric.ts
Keep the other referenced components from the included frontend tree available.
Set the project's VITE_API_BASE_URL environment variable if supported. Otherwise
edit src/services/api.ts so configuredUrl reads your public backend HTTPS URL
as a fallback. The backend URL is public; API keys and passwords are not.
The packaged api.ts deliberately contains no personal backend URL.
A shared Figma project has one configured backend at a time. Use separate
frontend copies for separate backends, or coordinate the shared backend URL.
These are delivery files: downloading them does not update an already-running
notebook or an existing Figma project automatically.

FREE SERVICES / USAGE
The added verifier uses public NHTSA vPIC without an API key. It batches and
caches requests and makes no history-report purchases. No seller contact,
paid report, image-analysis provider or additional Gemini request is added.
Existing searches still call MarketCheck; chat still calls Gemini. Use only
your free allowance/accounts. This package does not guarantee those providers'
plans or enforce a universal zero-cost quota; do not enable paid billing.
No live MarketCheck or Gemini requests were needed to test this package.

EXPORTS
Each completed search is exported by the notebook to ~/FirstPass/search_exports
unless FIRSTPASS_EXPORT_DIR is set. Exports preserve filters, capture time,
original provider response including missing fields, listing details and the
attached assessment. This is local storage on the backend computer, not Google
Docs or shared cloud storage. Treat exported location/search data as private.

VALIDATION AND RESEARCH
Definition: The extent to which available evidence supports a listing's
identity, material claims, disclosures, and proposed transaction.
The rubric has 22 checks in six categories, weights totaling 100. Supported,
contradicted and unknown are the only check states. Unknown does not imply safe
or unsafe. A conditional score is not a probability that a listing is genuine.
Human review and the ten-listing pilot remain necessary before calling scores
validated. Preserve dated evidence, reviewer, reasons and distinct event IDs;
do not award multiple checks for the same event without justified separate
claims. Study agreement, coverage, ranking sensitivity, screening time and
misleading reassurance before selecting final weights/display thresholds.

CHECKS YOU CAN REPEAT
From package root:
  python -m unittest discover -s . -p 'test_*.py'
From frontend:
  npm run test:mocked
  npx tsc --noEmit
  npm run build
All included tests use mocked provider data. Run backend tests after installing
requirements. UI fixtures test numerical aggregation and low-coverage handling;
they do not establish real-world accuracy or validate the rubric weights.
