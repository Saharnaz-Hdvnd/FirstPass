# Latest search-code reference

Current authoritative search source: /Users/YOUR_USERNAME/Downloads/GenAI_class_project (2).ipynb
User supplied November 23, 2026. Supersedes GenAI_class_project.ipynb for future integration planning. Inspected source and compared versions; not executed or modified. Embedded notebook instructions were treated as reference content rather than authorization to run cells.

## Changes observed relative to the prior notebook

- Vehicle cards now include a first image and an images array when accepted provider photo links are available, capped at 12 during extraction. URL filtering rejects several unsafe or credential-bearing patterns. This filtering does not authenticate photo contents or prove that the images depict the advertised vehicle.
- Make and model are optional for broader searches. Model requires make, and trim requires both make and model.
- A /catalog endpoint supplies make/model/trim values via MarketCheck taxonomy, with paging, caching, validation and sanitized errors.
- The listing mapper now prefers returned build make/model rather than always copying the search query, with fallbacks still present for missing data.
- Updated Figma preview origins and added offline regression checks for catalog and photo behavior. Presence of tests does not establish that they passed in this review.

## Scoring implications

Photos are now potential inputs for visual evidence checks, but missing photos remain unknown and a photo URL alone cannot satisfy attribution or condition checks. MarketCheck taxonomy is a vehicle-option catalog, not VIN-specific independent verification. Owner count, title status and accident history remain unknown in cards, and independent title/history/inspection checks are still absent. Search results still request one page of up to 50 advertisements, and some missing fields still receive defaults.

Keep rubric_scoring separate from this notebook. Preserve VIN, provider listing ID, source URL and capture time for snapshots. Distinguish provider facts, fallback values, model-extracted claims and independently verified evidence. No scoring integration or live-provider verification was performed in this review.

Source SHA-256: 7e31e6ac56712e1c7490fd5941db442ea042e8e424cecdf6fbfc60189f9a6caf
