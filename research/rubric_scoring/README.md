# FirstPass scoring development pilot

This directory is separate from the vehicle-search notebook. Figma Make version 9 shows cached v0.1 pilot assessments; automatic ongoing verification is not connected to the search backend.

- `rubric_v0_1.json`: 22 checks, six categories, proposed weights totaling 100.
- `pilot_ten_listings.json`: ten unique VINs with frozen snapshot provenance and first desk-review assessments. Original unknown-state intake is preserved separately.
- `score.py`: deterministic annotation validator and score calculator. It does not fetch records, inspect images, or establish whether an annotation is true.

Run from the project directory:

```sh
python3 rubric_scoring/score.py rubric_scoring/pilot_ten_listings.json
```

For a supported or contradicted check, supply a reviewer, dated evidence references, an assessment timestamp, reason, and distinct primary event IDs. Use one primary rule per event to avoid double counting. Unknown remains unknown until enough evidence exists. The current implementation keeps all 22 checks applicable; do not silently omit checks or normalize missing data away.

Read `outputs/FirstPass-scoring-pilot.html` for the review sequence and validation plan. Current results are not meaningful rankings. No API requests or paid services are used by the scorer.

## First desk review (November 23, 2026, Denver)

The intake is preserved in `pilot_ten_listings.intake_v0_1.json`. Current `pilot_ten_listings.json` contains one AI-assisted desk review of all 220 checks, with sources, unknown reasons, next actions, alerts and applicability/timing limits. The rubric itself was not changed. Read `outputs/FirstPass-ten-car-evidence-review.html` for findings. `outputs/FirstPass-ui-pilot-data.json` is the public-only payload used by Figma Make version 9. Cached scores require exact VIN, price and mileage matching; other listings remain unassessed. No automated source verification is connected to the live backend.

## Rubric v0.2 (development)

Read `outputs/FirstPass-rubric-v0.2.html` for operational definitions, proposed freshness windows, mileage reconciliation, applicability, and migration limits. `v0_2/rubric_v0_2.json` keeps the 22 base weights unchanged. `v0_2/reassessment_queue.json` preserves evidence references but does not carry v0.1 labels forward automatically. Pending assessments produce null scores. Figma's v0.1 values are not relabeled as v0.2.

```sh
python3 rubric_scoring/v0_2/score.py rubric_scoring/v0_2/reassessment_queue.json
python3 -m unittest discover -s rubric_scoring/v0_2 -p 'test_*.py'
```

The v0.2 scorer validates annotation structure, dated evidence references, profiles, event uniqueness and declared freshness. A reviewer must still check source authenticity, upstream independence, evidence scope, event attribution and the truth of the annotations. The scorer cannot establish these from a boolean declaration.

The 7-/30-day freshness windows and visual checklist are proposed operational choices, not official standards or empirically validated thresholds. The ten development cases must be reassessed before their v0.2 numbers are computed or displayed. Independent human review and later feasibility/sensitivity work remain separate steps.
