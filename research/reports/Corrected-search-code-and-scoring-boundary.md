# Corrected search-code reference

The user designated `/Users/YOUR_USERNAME/Downloads/GenAI_class_project.ipynb` as the corrected finding/search code. It supersedes the earlier launcher/main.py reference for future integration planning. Inspected as source only; not executed or modified.

## Observed implementation

- Colab notebook with MarketCheck active-inventory search, FastAPI endpoints, Gemini text/voice conversation, and a password-protected ngrok connection intended for a Figma interface.
- Search requests include location/radius, make/model/trim, year, mileage, price, owner preference, and near-miss tolerances.
- The inventory request asks for 50 rows with no pagination loop. Code caps radius at 100 miles. These are observed implementation choices, not independently verified provider-plan limits.
- One-owner preference sends carfax_1_owner=true. Maximum two/three-owner preferences produce a warning and are not enforced.
- Result payload: exact, near, warnings; session-search also includes session_id and context_version.
- Vehicle cards carry id, vin, year, name, trim, price, mileage, dealer, distance, listing_url and miss explanations.
- Image, owners and title/accident history are explicitly unknown; features is an empty list. This is not evidence of no accidents or absent features.
- CarListing has carfax_url, carfax_facts, price_history and other fields, but current card serialization omits these and the search fetcher does not retrieve VIN history or external verification records.
- The mapper fills some absent source values with defaults (including numeric zero and generic dealer text) and assigns make/model from query filters. A scorer must not treat those defaults or query values as independent source evidence.
- Sessions are in memory with a one-hour absolute lifetime by default. Capture assessment snapshots separately for reproducible manual work.

## Separate scoring boundary

Keep this notebook unchanged. Future rubric_scoring code should read a saved, redacted search-result snapshot through a separate adapter/entry point. Preserve raw provider data and provenance separately when available, because the presentation cards omit useful evidence and contain fallbacks. Use VIN plus source listing identity/capture time; card IDs are search-local rather than durable vehicle identifiers. Never carry passwords, provider keys or session tokens into research snapshots.

The next task remains manual assessment of ten listings. This source inspection does not establish successful runtime operation or complete any listing assessments.

Source SHA-256: 6b4744d8f2fcb1b1afcad945e01fa5e866b958233c53cdff9904181ebdcb329f
