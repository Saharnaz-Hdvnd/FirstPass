# FirstPass: a research-grounded rubric for listing trustworthiness

Working revision November 10, 2026. Original research November 9, 2026. Scope assumption: used passenger vehicles advertised in the United States. Canadian and other markets need local title, licensing, disclosure and VIN rules. This is a proposed research instrument, not a validated fraud detector.

## 1. What the project should measure

**Agreed definition of trustworthiness:** The extent to which available evidence supports a listing’s identity, material claims, disclosures, and proposed transaction.

Assess this construct at a recorded point in time. Preserve the exact definition for the later presentation and paper.

Keep three outputs separate:

1. **Listing evidence score (0–100):** points earned through supported checks.
2. **Unresolved information (0–100):** checklist weight that cannot yet be adjudicated.
3. **Alerts and known vehicle issues:** contradictions, possible transaction fraud, and disclosed condition problems, with evidence and next steps.

A high evidence score does not establish that a vehicle is mechanically sound. A damaged vehicle can have an accurate, transparent listing. A mechanically excellent vehicle can have an impersonated or misleading advertisement. The score is neither market value nor a probability that the seller is honest. Intent cannot generally be inferred from an advertisement.

The supplied six-slide presentation describes evidence-based screening, buyer-confirmed criteria, VIN tracking and a shortlist. Its scores are explicitly illustrative screening priorities. The proposed system preserves that distinction. The attached launcher changes to its own directory and runs main.py. That program was not attached and was not present in Downloads when inspected, so the application’s actual response schema, implementation and saved fields remain unverified. The launcher was read, not executed.

## 2. Research findings and their implications

### Vehicle identity needs more than a valid VIN

VIN decoding can establish compatibility with a make, model and year. It cannot establish ownership or prove that the physical car has that identity. NICB documents cloning in which legitimate VINs and counterfeit documents conceal stolen vehicles. Use decoding for a consistency check, and reserve physical VIN/title matching and authority to sell for later verification. [NHTSA vPIC](https://vpic.nhtsa.dot.gov/api/), [NICB vehicle cloning and flood guidance](https://www.nicb.org/prevent-fraud-theft/buying-vehicle).

### Official records have distinct scopes

NMVTIS provides title and brand history and related indicators such as odometer, total-loss and salvage information. States differ in branding practices. Obtain reports through approved consumer providers. A current clean title alone does not settle all previous damage questions. [DOJ consumer guidance](https://vehiclehistory.bja.ojp.gov/nmvtis_consumers).

NICB VINCheck covers participating insurers’ reported theft and salvage records and explicitly warns that a clean result is not a guarantee. Its public lookup has usage limits. Treat a negative result as a bounded search result, and do not assume a bulk integration is available. [NICB VINCheck](https://www.nicb.org/vincheck).

### Mileage is a timeline, not one number

NHTSA recommends comparing odometer readings with titles and maintenance/inspection records. An apparent decrease is a reason to investigate. First normalize miles versus kilometres and check dates, stale advertisements, transcription errors and documented instrument replacement. [NHTSA odometer guidance](https://www.nhtsa.gov/vehicle-safety/odometer-fraud).

### Reports and photos cannot establish full condition

The FTC recommends independent inspection and says a history report does not replace it. Use photos to identify visible discrepancies and missing views. They cannot establish absence of flood damage, structural problems or mechanical defects. [FTC used-car guidance](https://consumer.ftc.gov/features/feature-0040-used-cars).

NAAA’s 2026 position statement explains that EV battery assessment requires specialized capabilities and is outside a standard auction condition report’s scope. This is industry auction guidance, not a general consumer law. An advertised range or dashboard charge percentage is insufficient evidence for a battery-health claim. [NAAA EV/hybrid statement](https://naaa.com/wp-content/uploads/2026/05/EV_Hybrid_POS_June_1_2026_UPDATED.pdf).

### Transaction behavior matters

The FBI documents online vehicle scams using plausible photographs, urgent stories and requests for payment through purported third parties. Specific conduct and independently checked transaction details are more useful than the seller’s writing style. [FBI/IC3 vehicle-sale alert](https://www.ic3.gov/PSA/2018/PSA180117).

### Price transparency is relevant even when valuation is excluded

A low price is not proof of deception. However, an advertised purchase price that turns out to be a down payment, or undisclosed financing conditions or mandatory charges, directly concerns the accuracy of the listing. The FTC’s pricing guidance addresses these practices. Score disclosure consistency, not whether the asking price is a bargain. [FTC automobile pricing FAQs](https://search.ftc.gov/business-guidance/resources/automobile-industry-pricing-transparency-faqs).

### Reviews and recall checks have limits

Reviews can be manipulated. Use matched business identity and documented complaint patterns as contextual leads, not raw star ratings as proof. [FTC review guidance](https://www.ftc.gov/business-guidance/resources/featuring-online-customer-reviews-guide-platforms).

NHTSA distinguishes VIN-specific open-recall information from general model-level information and explains lookup exclusions. A model-level recall is not proof that this VIN has an unrepaired recall. Store lookup time and scope. [NHTSA recall lookup](https://www.nhtsa.gov/recalls).

### Weights need validation

Composite indicators depend on choices about variables, missingness, weighting and aggregation. OECD/JRC guidance recommends examining robustness and sensitivity. The sources justify including checks; they do not establish the numerical weights proposed below. [OECD/JRC methodological handbook](https://www.oecd.org/content/dam/oecd/en/publications/reports/2005/08/handbook-on-constructing-composite-indicators_g17a16e3/533411815016.pdf).

## 3. Candidate determinants: the full research inventory

These are candidate checks and research hypotheses. Consumer guidance establishes reasons to investigate many of them; it does not establish a predictive effect size for every feature.

| Area | Candidate determinants | How to interpret them |
|---|---|---|
| Vehicle identity | VIN presence and syntax; decoder results; listing/VIN make, year and body agreement; physical VIN labels; title VIN; stock number | Decoder agreement supports specifications only. Decoder gaps and imported/classic vehicles need appropriate exceptions. |
| Seller identity | Independently matched business name, address and contact; applicable dealer license; legitimate agency/consignment authority; private seller ownership | A website, phone number or dealer identifier alone does not verify authority to sell. |
| Ownership and transfer | Seller/title relationship; lien and release documentation; duplicate or replacement title explanations; coherent transfer process | A legitimate lien or replacement title is not automatically suspicious. Verify the documented process. |
| Theft and cloning | Authoritative theft indicator; incompatible location/identity evidence; physical/document VIN mismatch | Verify identity and source freshness before escalating. A stolen-looking record may concern the wrong VIN or a recovered vehicle. |
| Title/history disclosure | Salvage, rebuilt, junk/nonrepairable, flood, fire, total loss, manufacturer buyback; relevant state history | A disclosed brand is a condition/eligibility issue. A contradictory clean-title claim is a listing credibility issue. |
| Damage disclosure | Accident severity; structural/frame damage; airbag deployment/replacement; repair invoices; dated auction evidence | Attribute findings to the right VIN and date. A past event and current repaired state can both be true. |
| Previous use | Rental, fleet, taxi/rideshare, commercial or police use; owner-count claims | Prior use alone does not imply fraud. Evaluate claims and missing material context. |
| Mileage | Current structured value; description; dashboard photo; dated history; units; odometer exemptions or replacement | Normalize first. Do not equate any decrease with intentional rollback. |
| Specifications | Trim, drivetrain, engine, fuel type, transmission, options and feature claims | Decode precision varies. An option not returned by a decoder is not necessarily absent. |
| Mechanical disclosure | Known engine/transmission faults, leaks, rust, warning lights, emissions issues, diagnostic findings, recent major work | Presence of a disclosed fault should not itself lower listing credibility. Inspection remains separate. |
| Maintenance claims | VIN-linked dated service documents; continuity; specific recent-service claims | Sparse records increase uncertainty; they do not prove neglect or concealment. |
| EV/hybrid claims | Battery health report method/date/VIN; remaining transferable warranty; charging faults; replacement history; software/feature entitlement | Do not equate state of charge or predicted range with measured health. |
| Visual evidence | Actual-car versus stock images; exterior/interior coverage; dashboard and odometer; visible damage; mixed cars; copied images; reused backgrounds | Syndicated images are common. Missing metadata, polished photos or background changes alone are weak signals. |
| Listing lifecycle | Source URL; capture and update dates; availability; contradictory simultaneous offers; relisting; seller/location changes | New listing IDs, price drops, long time on market and dealer transfers are not evidence of deception on their own. |
| Terms | Purchase price versus installment/down payment; conditional rebates; financing/trade requirements; compulsory charges; written total; warranty/as-is terms; certification scope | Compare claims with documents. Separate taxes and jurisdiction-specific fees from unsupported allegations. |
| Seller interaction | Answers to specific questions; VIN/records access; independent inspection access; live proof of possession; consistent location | Not contacted is unknown. Explicit refusal or conflicting answers are observations requiring context. |
| Payment process | Payee relationship; independent escrow verification; pressure to pay before viewing/verification; purported shipping/platform guarantees | Wire transfer alone is not proof of fraud. The combination, counterparty verification and transaction stage matter. |
| Reputation | Matched identity, substantiated enforcement/complaint patterns, recency and relevance | Claims, reviews and verified findings must remain distinguishable. Avoid automatic guilt by association. |
| Data integrity | Missing API field versus missing seller disclosure; duplicate syndication; stale scrape; parsing failure; time alignment | Keep pipeline failures separate from seller conduct. Copied claims are one evidentiary origin. |

Exclude race, gender, nationality, name, accent, grammar, neighbourhood income, language fluency and inferred personality. Do not use an AI-text detector as a deception detector. Model reliability, old age, high mileage and low asking price belong in separate condition/value/preference analyses unless they reveal a specific claim inconsistency.

## 4. Version 0.1 weighted rubric

**All weights are proposed design choices.** They sum to 100. Evaluate at the listing level, timestamp the result, and keep seller-specific findings separate from vehicle-specific findings.

| ID | Check | Weight | Evidence needed to award full support |
|---|---|---:|---|
| A1 | VIN/specification identity | 6 | Applicable VIN validation and compatible independently decoded core specifications; decoder limitations respected. |
| A2 | Seller identity | 6 | Independently matched contact/business identity, including applicable license check for a dealer. |
| A3 | Authority to sell | 5 | Title-owner or documented authorized dealer/agent relationship, evaluated through an appropriate secure verification process. |
| A4 | Possession/location | 3 | Current vehicle-specific evidence that connects this seller to the car and stated location. |
| B1 | Title/brand disclosure | 8 | Relevant independent title/brand record agrees with an explicit disclosure, including any adverse brand. |
| B2 | Theft/total-loss/salvage disclosure | 6 | Applicable checked records agree with disclosure, with query scope and date recorded. |
| B3 | Accident/structural/repair claims | 7 | Available relevant history and inspection/repair evidence support material claims; a record with no event is not enough to prove “never damaged.” |
| B4 | Ownership/prior-use claims | 4 | Evidence supports specific owner-count or prior-use claims and material disclosures. |
| C1 | Mileage timeline | 8 | Current reading agrees with a sufficiently informative dated history after unit and timing reconciliation. |
| C2 | Current mileage agreement | 5 | Structured field, description and a current odometer observation agree. |
| C3 | Equipment/specification claims | 4 | Material trim/drivetrain/options claims agree with suitable evidence. |
| C4 | Cross-source/current-listing consistency | 3 | Material current claims and availability agree across appropriately dated sources; duplicated origin identified. |
| D1 | Condition disclosure | 5 | Relevant inspection/diagnostic evidence agrees with stated defects, repairs and present-condition claims. |
| D2 | Maintenance/repair claims | 4 | Specific maintenance or repair claims have dated vehicle-linked supporting records. |
| D3 | Safety/recall disclosure | 3 | Applicable current VIN-level checks and relevant repair evidence agree with safety-related claims. |
| D4 | Specialized condition claims | 3 | Appropriate evidence supports EV battery, modification, certification or another applicable specialized claim. |
| E1 | Vehicle-specific media | 4 | Media can be attributed to this vehicle and no unresolved mixed-vehicle or copied-identity discrepancy remains. |
| E2 | Relevant visual coverage | 3 | A predeclared set of views covers the actual claims being assessed, including mileage and disclosed visible defects where relevant. |
| E3 | Media/description agreement | 3 | Visible material details agree with the description; limitations of visual assessment recorded. |
| F1 | Price/terms transparency | 4 | Written terms clarify actual purchase price, material conditions and required charges consistently with the advertisement. |
| F2 | Verification cooperation | 3 | Observed response supports reasonable records/independent-inspection access or a credible documented alternative. |
| F3 | Transaction legitimacy | 3 | Proposed payee, authority, payment/escrow and transfer process are independently verifiable and consistent. |

A: 20, B: 25, C: 20, D: 15, E: 10, F: 10.

**Applicability:** Use a stable profile for comparable listings. An unsupported or absent claim is not automatically “not applicable.” A deliberately broad assurance such as “excellent condition” still requires scrutiny. D4 can be genuinely inapplicable to an ordinary unmodified combustion car with no certification or specialized claims. Remove only documented genuine inapplicability and normalize remaining weights back to 100. Show the profile and applicable total so unlike profiles are not silently compared.

**Avoid double counting:** A mileage-photo disagreement primarily belongs to C2; do not also deduct it from E3. A VIN/body mismatch primarily belongs to A1; retain the linked evidence elsewhere without multiplying its penalty. Define unique event IDs and a primary rule assignment. Multiple independent failures can affect multiple rules, but repeated manifestations of one event should not earn repeated penalties or repeated support.

## 5. Scoring function

Start with a fixed set of applicable, normalized weights w_i, summing to 100. For every check allocate:

- p_i: supported fraction;
- f_i: fraction with an adequately established failure or material contradiction;
- u_i: unresolved fraction;
- p_i + f_i + u_i = 1.

For the first implementation use whole-check states: supported = (1,0,0), contradicted/failed = (0,1,0), unknown = (0,0,1). If a check needs partial credit, define its subchecks and their weights in advance; calculate fractions from those subchecks. Do not let an LLM invent a confidence fraction.

**Supported evidence score T = sum(w_i × p_i)**

**Contradicted/failed weight D = sum(w_i × f_i)**

**Unresolved weight U = sum(w_i × u_i)**

**Assessed coverage C = 100 − U = T + D**

Thus T + D + U = 100. Every earned point has evidence. Unresolved points are explicitly recoverable; failure points need a resolution or correction before being recomputed.

A seller saying “clean title” without supporting records does not fully satisfy B1. Several websites copying that claim do not satisfy it independently. Conversely, a confirmed and accurately disclosed rebuilt title can support B1 while generating a separate vehicle-condition alert.

T is best described as an **evidence-support index**. Unknown and contradicted checks both earn zero supported points, but they have different displayed status, follow-up and escalation. That difference is essential to interpretation.

If useful, show [T, T+U] as the range of checklist scores achievable by resolving currently unknown checks, holding established findings fixed. It is a completion range, not a probability or statistical confidence interval. Do not normalize only over observed checks: one passed check and nineteen unknown checks must not produce 100.

### Fictional worked example

| Listing | Supported T | Failed D | Unknown U | Assessed C | Interpretation |
|---|---:|---:|---:|---:|---|
| A | 75 | 0 | 25 | 75 | Much is supported; important questions remain. |
| B | 28 | 0 | 72 | 28 | Sparse evidence. No established contradiction does not imply authenticity. |
| C | 60 | 15 | 25 | 75 | Some evidence supports the listing, but material contradictions need resolution. |

For C, the failed 15 points could be an 8-point mileage-timeline failure and a 7-point accident-claim failure. These scores are invented arithmetic examples, not observations or fitted thresholds.

### Alerts that take precedence over the score

Show “Verify before proceeding” prominently when there is credible evidence of VIN/document identity conflict, theft status, material title/damage contradiction, unexplained major mileage conflict, impersonation, or a payment-before-verification scam pattern. Label suspected and confirmed findings separately. A scraped inconsistency alone does not establish fraud.

Do not bury an alert inside a weighted average. Avoid arbitrary numeric caps in the first version: keep the arithmetic auditable and give the alert precedence in display and ranking. The absence of a triggered alert means only that no alert was established from available inputs.

No validated green/yellow/red cutoffs currently exist for this proposed instrument. For a pilot, show continuous scores and descriptive evidence status. Test any coverage threshold used to suppress a headline number before adopting it as a product rule.

## 6. Data availability and MarketCheck integration

MarketCheck listing details document VIN, mileage, media, dealer and build information. VIN history contains observed advertisement events, including mileage, dates, price and seller/location. **Advertisement history is not a title, accident, service or ownership registry.** Field availability and API-plan access need testing against your actual responses. [Listing details](https://docs.marketcheck.com/docs/api/cars/vehicle-listing/car-listing), [VIN history guide](https://developers.marketcheck.com/use-cases/vin-listing-history).

| Stage | Feasible checks | Main limits |
|---|---|---|
| MarketCheck search/details | Basic identity, available specification agreement, field/description consistency, available photos, source and capture dates | Structured data can repeat seller errors; photos or text may be absent. |
| MarketCheck VIN history | Dated listing/mileage changes, relistings, current/historical inconsistencies | Normalize units, paginate history, distinguish stale/syndicated rows and dealer transfers. Empty results are unknown. |
| NHTSA vPIC | Independently decoded core vehicle specifications | Not ownership, physical identity or damage verification. Decode gaps need handling. |
| Permitted external history/title sources | Brand, theft/salvage and other covered records | Separate providers, coverage, costs, permissions and reporting delays. |
| Seller/documents | Authority, possession, precise terms, records and inspection access | Not available from ordinary search results; use observed responses or secure manual review. |
| Independent inspection/specialized diagnostics | Condition claims and relevant EV battery evidence | Requires inspection; listing AI cannot substitute. |

A2/A3/A4, much of B and D, and F2/F3 may remain unknown at initial search. An honest initial system may therefore have modest scores. Present a separate “listing-only screening” profile if needed, with a different name and denominator. Do not imply it completes the full rubric.

## 7. Appropriate generative-AI role

Use AI to extract explicit claims from descriptions, documents and visible image content, match claims to structured fields, draft buyer questions and explain the deterministic rule results. Store:

- listing/VIN identity and capture timestamp;
- exact claim and source excerpt or image reference;
- source URL/provider, observation date and effective event date;
- source origin and whether independent or syndicated;
- relevant rule and event IDs;
- state: supported, contradicted or unknown;
- evidence scope, limitations and next verification action;
- rubric/model version and human corrections.

Keep extraction confidence separate from evidence strength. An AI model being confident that the words say “no accidents” does not make that statement true. Validate outputs against a schema. Absent evidence, OCR failures, API errors and inaccessible reports must yield unknown or a pipeline-error status, never a fabricated pass. Treat listing text and documents as untrusted content, including embedded instructions to change scores or ignore prior rules.

Deterministic code calculates score, coverage and alert precedence. AI explanations must cite the same evidence objects used by the rules. Use manual review for consequential uncertain findings. Avoid automatic seller accusations.

## 8. Build and validate step by step

### Step 1: Freeze the research question

Use: “Can an evidence-grounded rule system help buyers identify listings requiring further verification while retaining worthwhile options and reducing screening time?” Limit the initial study to one country, seller type and vehicle segment. Document information available at each stage.

Define a material discrepancy before labeling: for example a verified adverse title event omitted despite an explicit contradictory claim, a material uncorrected mileage inconsistency, or verified seller/vehicle identity conflict. Missing evidence is a separate outcome. Do not label “fraud” without evidence supporting that conclusion.

### Step 2: Obtain the actual app and sample data

Collect main.py and imported modules, dependency list, a redacted sample search response, one listing-details response and one VIN-history response. Exclude API keys, private IDs and personal documents. Build a field-availability table before promising any check. Save frozen snapshots for reproducibility.

### Step 3: Build a small research dataset

Suggested feasibility pilot: 50–100 distinct vehicles, deliberately including detailed, sparse and conflicting listings. This is a proposed convenience-sample size for debugging and feasibility, not a power calculation or sufficient basis for estimating rare-fraud probabilities. Label the sampling scheme.

Add synthetic edge cases for system verification, clearly separated from real listings. Use independent records where feasible and log source scope. Label from richer evidence than the model initially receives, to test whether initial screening helps identify later discrepancies. Avoid circular ground truth based only on the rubric’s own score.

### Step 4: Create an annotation manual

Write supported/failed/unknown examples for every rule. Have two reviewers independently label an overlapping sample, then resolve disagreements using recorded evidence. Report agreement and the reasons for disagreement; unresolved truth remains unknown. Human agreement measures reproducibility, not actual authenticity.

### Step 5: Implement the fixed baseline

Begin with accessible checks: VIN/decoded-spec consistency, material field/description conflicts, normalized mileage history, media attribution/coverage, freshness and any explicit price-condition inconsistency. Keep unavailable full-rubric checks unknown. Add external-history and interaction stages progressively.

Use a versioned rule configuration with IDs, weights, applicable profiles, required evidence, thresholds and alert logic. Preserve intermediate evidence so each score is reproducible. Create meaningful checks for missingness, units, syndication, contradictory records and alert precedence.

### Step 6: Test the AI contribution

Compare structured data plus rules against the same rules with AI-extracted text/photo/document claims. Measure extraction precision and recall against human annotations, unsupported assertions, correct unknown handling and explanation traceability. This shows whether generative AI adds useful evidence rather than merely fluent wording.

### Step 7: Evaluate screening and usability

Use the presentation’s proposed 6–10 participants as an exploratory usability study. Compare manual browsing, a fixed evidence rubric and personalized FirstPass. Rotate condition order and use comparable but different listing sets to reduce practice effects. Keep task budget/shortlist size consistent.

Measure screening time, independently judged worthwhile listings retained, material-discrepancy cases incorrectly presented as well supported, useful cases wrongly discarded, question quality and users’ understanding of unknown information. Report paired results and uncertainty; do not claim population-level efficacy from this small pilot.

For listing-level predictive evaluation, use separate development/test sets grouped by VIN, seller and time where feasible. Keep syndicated copies and repeated snapshots out of both sides. Assess performance by dealer/private seller, information density and vehicle segment. Small subgroup counts are exploratory.

### Step 8: Personalize preferences separately

Use the proposed 3–5 examples to elicit buyer priorities and draft criteria, then ask the buyer to confirm them. This number can support preference elicitation; it cannot establish an individualized deception model. Keep the core evidence rubric and identity/payment alerts fixed. Let buyers express preferences such as avoiding rebuilt titles or prioritizing maintenance documentation in a separate suitability ranking.

### Step 9: Test robustness

Vary proposed category weights by a predeclared amount, such as ±20%, renormalize and inspect shortlist stability. Compare equal weights with the proposed weighting. Remove one evidence source at a time, test stale data and inspect correlated checks. If small changes reverse many rankings, report instability rather than presenting the index as precise.

### Step 10: Consider probability modeling only with adequate outcomes

A later supervised model could estimate P(material undisclosed discrepancy | evidence available at listing time), for a defined disclosure category and follow-up window. Use a transparent logistic model as a candidate baseline, with source-aware missingness indicators and appropriately separated data. Learn coefficients from adjudicated outcomes rather than choosing them by intuition.

If probabilities are displayed, assess calibration using reliability plots and a proper scoring rule such as Brier score, as well as discrimination and false-reassurance errors. Selection and verification bias matter: inspected cars are not a random sample of all advertisements. Correct for this in study design or state the limitation. Sparse confirmed fraud labels may never support a trustworthy “fraud probability.” [Calibration research](https://proceedings.mlr.press/v70/guo17a).

## 9. Recommended immediate action

First obtain the real application files and redacted JSON examples. Then manually score ten real listings with the rubric before writing a scoring integration. This will reveal which evidence is obtainable, where rules overlap and whether the proposed score actually distinguishes support, contradiction and uncertainty. Revise the rubric, freeze version 0.1, and implement the fixed baseline before personalizing it.


## 10. Agreed project decisions and source-access rationale

### Exact wording reserved for the later slide and paper

> The extent to which available evidence supports a listing’s identity, material claims, disclosures, and proposed transaction.

### Project motivation: fragmented evidence

Evaluating one listing can require visiting multiple services, matching records to the correct VIN, checking dates and interpreting each source’s coverage. Repeating this for many cars creates a substantial verification burden. FirstPass is designed to collect and reconcile accessible evidence, identify contradictions and missing information, and guide the buyer toward the next useful verification step. Reduced effort is a design hypothesis to evaluate through measured screening time and source-checking effort, not an established result.

The app should perform as many relevant checks as its available evidence and permitted integrations support. It should disclose completed checks, unavailable checks, source scope and remaining actions. It must not imply that a search API alone verifies every record or that every source offers a public bulk API. Human seller interaction, documents and inspections remain separate evidence stages.

### What counts as an official record, and what is guidance?

| Source | Type | Evidence or contribution | Important boundary |
|---|---|---|---|
| NMVTIS / DOJ, through approved consumer providers | Government-backed vehicle-record system accessed through approved providers | Title/brand history and covered odometer, total-loss and salvage indicators | State differences, reporting coverage and dates matter. It is not a complete mechanical history. |
| State motor-vehicle and dealer-licensing authorities | Government records | Applicable title, transfer and dealer-license verification | Availability and requirements vary by jurisdiction; a license does not establish ownership of a particular car. |
| NICB VINCheck | Insurance-industry database lookup; not a government registry | Participating insurers’ covered theft and salvage information | Negative results are not guarantees; public lookup limits apply. |
| NHTSA vPIC | Government vehicle-specification service | VIN decoding and specification comparison | Does not verify possession, ownership, accident history or physical VIN authenticity. |
| NHTSA VIN recall lookup / manufacturer systems | Government-provided lookup using manufacturer recall data | Applicable VIN-specific open-recall information | Observe exclusions and lookup scope; model-level information is different. |
| Titles and dated maintenance/inspection records | Vehicle-specific documentary evidence from different issuers | Mileage chronology, repair or maintenance claims, ownership/transfer checks as applicable | Verify issuer, VIN, dates and authenticity; a seller-uploaded document is not independently verified merely because it looks official. |
| FTC | Government consumer-protection guidance | Inspection advice and advertising/price-disclosure principles | Guidance is not a vehicle-specific inspection or history record. |
| FBI/IC3 | Government scam-pattern guidance | Transaction warning patterns and investigative leads | A pattern match is not a finding that this seller committed fraud. |
| NAAA | Industry auction guidance | Limits of ordinary condition reports and specialized EV battery assessment | Not a government record system or general consumer law. |
| OECD/JRC | Composite-indicator methodology | Design, missingness, weighting and sensitivity analysis | Does not supply car-specific records or validate our numerical weights. |
| MarketCheck | Commercial advertisement-data provider | Listing fields and observed advertisement history | Advertisement history is not an official title, ownership, accident or service registry. |

The citations in Section 2 support the corresponding source descriptions. Preserve the distinctions above when writing the paper.

### Coverage of all requested determinant areas

| Requested area | Primary rubric location | Treatment |
|---|---|---|
| Vehicle identity | A1 | Weighted check |
| Seller identity | A2, A4 | Weighted identity/possession checks |
| Ownership and transfer | A3, F3 | Authority and transfer evidence |
| Title/history disclosure | B1, B2 | Disclosure agreement with covered records |
| Damage disclosure | B3, D1 | Historical versus present-condition claims |
| Previous use | B4 | Claims and material disclosure |
| Mileage | C1, C2 | Chronological and current-reading agreement |
| Specifications | A1, C3 | Core identity versus equipment claims |
| Mechanical disclosure | D1 | Evidence about present condition |
| Maintenance claims | D2 | Vehicle-linked supporting documents |
| EV/hybrid claims | D4 | Appropriate specialized evidence |
| Visual evidence | E1–E3 | Attribution, coverage and visible consistency |
| Listing lifecycle | C4 | Date-aware consistency; relisting alone is not a failure |
| Terms | F1 | Disclosure consistency |
| Seller interaction | F2 | Observed cooperation; uncontacted is unknown |
| Payment process | F3 | Counterparty and transfer verification |
| Reputation | Context attached to A2 and alerts | Matched, substantiated relevant findings only; no extra points or penalties for raw stars or unverified complaints |
| Data integrity | Cross-cutting prerequisite to every check; C4 | Record errors, duplicates, scope and timestamps; technical errors cannot become seller failures |

These are determinants under six categories, not 18 extra weighted categories. Keep total weight at 100. If the pilot shows a need for a dedicated reputation check, revise and rebalance the rubric explicitly rather than silently adding points. Data integrity primarily controls whether evidence can be used at all.

### Code separation and proposed system design

Keep the car-search program and its main.py unchanged. Develop scoring as a separate module/project under rubric_scoring/. No scoring implementation is asserted to exist yet. The initial handoff can be a saved, redacted listing JSON file, which scoring reads without modifying the search program.

Proposed flow:

Search output → immutable listing snapshot → normalization and source attribution → evidence retrieval where permitted → AI claim extraction → deterministic three-state rules → score/unknown/alerts → explanation with citations → human review and next questions.

Store source availability and technical errors separately from rule states. Store initial-screening evidence separately from later external verification. Use a unique event ID and primary-rule assignment to prevent double counting. If a later adapter is needed, build it as a separate entry point rather than adding scoring logic to the existing main.py.

### Paper structure and evidence to preserve

1. Introduction: fragmented verification, user burden and project objective.
2. Construct: exact trustworthiness definition and distinction from condition/value.
3. Sources: official records versus commercial evidence and guidance; access limits.
4. Rubric: 22 checks, six categories, proposed weights and three states.
5. Mathematics: T, U, D, coverage, applicability and alert precedence from Section 5.
6. System design: ingestion, normalization, retrieval, extraction, rules and explanation.
7. Study design: ten-listing rubric development; separate 50–100-vehicle feasibility sample; independent review; structured-only versus AI-assisted comparison; exploratory user study; sensitivity analysis.
8. Metrics: state agreement, extraction precision/recall, unsupported-explanation rate, retained worthwhile listings, false reassurance, screening time and shortlist stability. Define denominators before collection.
9. Results: leave blank until measured; distinguish observed findings from hypotheses.
10. Limitations: missing and stale records, uneven verification, sampling bias, correlated sources, small study sizes and unvalidated weights.

Use the first ten listings for developing the annotation manual. They cannot simultaneously serve as an untouched final evaluation set. Do not tune rules after seeing held-out evaluation outcomes without reporting that change.


## Corrected search implementation supplied by the user

The corrected search reference is GenAI_class_project.ipynb in Downloads, inspected without execution or changes. Earlier statements that the search implementation was unavailable describe the prior attachment only and are superseded. The notebook provides MarketCheck search plus a FastAPI/Figma-oriented connection and Gemini conversations. Current cards leave history, ownership and images unknown and do not fetch independent verification records. Keep scoring in a separate component. See Corrected-search-code-and-scoring-boundary.md for the observed data contract and limitations.


## November 23, 2026: newest search-code reference

The user supplied GenAI_class_project (2).ipynb as the newest implementation, superseding the earlier notebook for future integration. Source inspection shows listing-photo arrays, optional make/model filters, a paginated/cached taxonomy catalog endpoint and provider-returned make/model preference. Photos are potential visual-evidence inputs, not verified condition evidence. Owner count and title/accident status remain unknown; taxonomy does not independently verify a specific VIN. Earlier descriptions of images as always absent describe the previous version only. The notebook was not executed or modified, and scoring remains separate. The PDF exported earlier on November 23 predates this update.
