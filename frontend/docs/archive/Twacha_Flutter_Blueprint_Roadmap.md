# Twacha — Flutter Blueprint & Roadmap

## 1. Revised Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Mobile app | **Flutter** | Cross-platform (Android/iOS) — replaces the earlier Next.js web plan |
| State management | **Riverpod** (or Provider if the team is more comfortable with it) | Small team, small app — avoid heavier options like Bloc unless you're already fluent in it |
| Backend | Django + Django REST Framework | Unchanged — Flutter talks to it over plain HTTP/JSON, framework choice on the client doesn't affect this |
| Database | PostgreSQL (Supabase/Neon free tier) for deployment, SQLite fine for local dev | Unchanged |
| Image handling | `camera` or `image_picker` package for capture, `http`/`dio` for upload | — |
| Charts | `fl_chart` | For the 7-day trend view |

**Why this split still works:** Flutter is a client framework, so nothing about the backend, CV pipeline, or recommender changes — only the frontend layer swaps. The API contract below is what keeps the two sides in sync regardless of what the frontend is built in.

## 2. API Contract (frontend/backend agreement)

Design Flutter screens against this shape from day one so both people can build in parallel without waiting on each other:

**`POST /api/scan/`** — multipart image upload → returns:
```json
{
  "scan": {
    "id": 1,
    "created_at": "...",
    "acne_score": 4.2,
    "redness_score": 3.1,
    "dryness_score": 2.0
  },
  "recommendations": [
    { "title": "...", "body": "...", "evidence_tier": "clinical", "source_note": "..." }
  ]
}
```

**`GET /api/history/`** — returns an array of past scans, same shape as `scan` above, for the trend chart and timeline. Note: `image` is intentionally never included here — see §5, images are not retained past processing.

**Trend layer addition** — each recommendation also carries a `trend` field once a rolling window exists:
```json
{ "title": "...", "body": "...", "evidence_tier": "clinical", "trend": "improving" }
```
`trend` is one of `improving` / `flat` / `worsening`, computed server-side from the rolling window described in §6 — not a new model, just rate-of-change math layered on top of the existing KNN match.

**Environmental context addition** — the scan response also carries local pollution context, fetched server-side at the time of the scan:
```json
{ "local_aqi": 187, "pm25": 92.4, "dominant_pollutant": "pm25", "aqi_band": "unhealthy" }
```
This is looked up by city (not precise GPS — see §7), not derived from the image.

## 3. Flutter App — Screen Map

| Screen | Purpose | Data it needs |
|---|---|---|
| **Home / Dashboard** | Today's three gauge scores + recommendation cards + local AQI badge (color-coded, standard AQI bands), "New Scan" entry point | Latest scan + recommendations from `POST /scan/` |
| **Capture** | Camera overlay for consistent framing (face alignment guide) | Device camera |
| **Result** | Shows scores just returned + matched recommendations, tagged by evidence tier (clinical / mixed / traditional — keep this distinction visible in the UI, it's core to the project's credibility) | Response from `POST /scan/` |
| **Trend / History** | Line chart of the three scores over time, scrollable timeline of past scans, "Day X of 30" program progress with milestone markers at Day 7/14/30 | `GET /history/` |
| **Recommendation detail** (optional, Phase 2 polish) | Full explanation + source note per recommendation | From the recommendations list |

Keep the visual language consistent with the earlier dashboard concept if useful as a reference: gauge-style score display rather than plain progress bars, evidence-tier color coding on every recommendation card, a disclaimer line ("not a medical diagnosis") always visible near scores.

## 4. Roadmap — 4 Phases, Mapped to Flutter

**Phase 1 — Schema & Contract (Week 1–2, do this together)**
- Lock the JSON shape above between both of you before either starts building
- Django: `SkinScan` + `RecommendationRule` models (schema only, matches earlier design)
- Flutter: scaffold the 4 screens above with placeholder/mock data — don't wait for the real backend

**Phase 2 — Recommender (parallel with Phase 3)**
- Backend: KNN/Decision Tree matcher over an evidence-tagged rule set (10–15 rules, cap it here)
- Literature review: glycemic index (clinical), dairy (mixed), zinc (mixed), traditional pairings — each rule needs a real citation
- Cross-reference food suggestions against the Indian Nutrient Databank (INDB)
- Add the environmental context layer (§7): fetch local AQI on scan, correlate rolling AQI average with redness/acne trend, surface pollution-specific recommendations when correlated — this is additive to the existing KNN matcher, not a separate model

**Phase 3 — Vision Model (parallel with Phase 2, this is Person A's track)**
- Fine-tune MobileNetV2/YOLOv8-Nano on ACNE04 for acne severity/detection
- Implement redness (color-space) and dryness (texture) analysis in OpenCV — no training needed, cheap early win, ship this first for a demoable milestone
- Validate on a labeled subset of DermaCon-IN
- **Fallback:** if training time runs short, ship classical-CV features only and use a simple rule-based lesion count as the acne stand-in

**Phase 4 — Integration (Person B's track, starts in Week 1 with mock data)**
- Flutter app calls the real `/api/scan/` and `/api/history/` endpoints once Phase 1's contract is stable
- Swap mock scores for real model output as Phase 3 lands — screens shouldn't need to change, only the data source behind them
- Add consent screen + disclaimer text before first camera use

## 5. Privacy & Image Lifecycle

Core principle: **the image only exists for as long as it takes to extract the score vector.** After that, the numbers are the record — the photo is not.

**Lifecycle:**
1. Image captured/uploaded
2. CV pipeline runs immediately (acne/redness/dryness/ITA extraction)
3. Image is deleted in the same processing cycle — not queued for later cleanup
4. Only the derived record persists: `{date, acne_score, redness_score, dryness_score, ita_value}`, no image reference

**Two ways to enforce this, in order of preference:**
- **Immediate delete-on-process (default):** delete the moment the score vector is extracted. No cleanup job needed, strongest privacy posture — no photo ever sits around waiting to be purged.
- **Scheduled daily purge (fallback, only if you want same-day photo reference):** a daily job deletes any image where `date < today`. Only use this if there's a real UX reason to briefly keep today's photo.

**User-facing controls:**
- "Delete this photo now" button on every scan result, regardless of the auto-policy
- Settings toggle: "Keep my scan photos for personal reference" — **off by default.** Default-on retention of biometric/health-adjacent images is the wrong default; make retention opt-in, not opt-out
- Consent screen states plainly: "Your photo is analyzed and then deleted — we only keep your scores, not the image."

**Why this doubles as a storage optimization:** a compressed selfie runs roughly 1–5MB; a score record is under 1KB — over a year of daily scans that's the difference between 1GB+ and under 500KB. This directly extends how long the app can run on free-tier hosting (Supabase/Neon/Cloudinary), not just a privacy nicety.

**Note:** not legal advice, but this "process and discard rather than retain" pattern aligns with data-minimization principles under India's Digital Personal Data Protection Act — worth building toward this default regardless of whether it's a strict requirement for a class project.

## 6. 30-Day Adaptive Program

Because §5 keeps only lightweight score records (not images), a 30-day trend feature costs almost nothing extra to store — this is where that design choice pays off.

**Structuring the program around elapsed time, not scan count** — real users will miss days, and the intended cadence is every 2–3 days anyway:
- `program_start_date` set on the first scan
- Progress shown as "Day X of 30" regardless of actual scan frequency
- On days without a fresh scan, the last known scores carry forward for trend purposes — gaps aren't missing data, just "no new signal yet"

**Two recommendation layers instead of one:**
1. **State layer** (already built) — KNN match against today's scores, same logic as the backend scaffold
2. **Trend layer** (new) — compares today's score to a rolling window (e.g., 7 days back, smoothed as a 3-scan average to avoid single-bad-lighting-photo whiplash) and classifies each metric as `improving` / `flat` / `worsening`. This changes how a recommendation is *framed*, not which model runs:
   - Improving → reinforce ("Acne score down 30% this week — keep the current approach")
   - Flat 10+ days → escalate/diversify to a different rule than the one already tried
   - Worsening → flag directly, consider a "this may need more than diet — consider a dermatologist" note

Still classical, interpretable math — no deep learning needed for the trend layer either.

**Milestone check-ins**, instead of an identical daily feed:
- **Day 1** — baseline scores, first recommendations
- **Day 7 / 14** — short progress summary: which metric moved most, current trend classification
- **Day 30** — full before/after comparison (first scan vs. latest), natural point to renew or suggest a routine change if progress stalled

This also strengthens the evaluation section (§7 of the earlier full blueprint) — "did scores measurably improve over 30 days" is a stronger result to report than isolated single-scan accuracy.

## 7. Pollution-Adjusted Skin Insights (New USP)

This is a stronger differentiator than it might first sound — the evidence base for pollution-skin effects is genuinely more robust than for several of the diet-acne claims already in the knowledge base, so it's fair to tag this tier as clinical, not speculative.

**Why this is defensible, not just marketing:**
- A 2025 study found a significant positive association between PM2.5 exposure and measured skin redness area, across both younger and older adult groups, using imaging-based assessment rather than self-report.
- A 2019 dermatology review board found that elevated PM2.5, PM10, and NO2 levels were associated with increased acne-related dermatology outpatient visits, and pollutants are recognized as part of the established "acne exposome."
- A 2025 systematic review of environmental pollution and acne confirms consistent associations across PM2.5, PM10, NO2, and traffic-related emissions in the literature.
- PM2.5 exposure has also been linked to oxidative stress in melanocytes and pigmentation changes, giving a mechanistic pathway beyond just correlation.

This means a "your local air quality may be contributing to today's redness" message is scientifically grounded, not a gimmick — genuinely rare for a semester project's core USP to rest on this much peer-reviewed support.

**Data source:** WAQI (aqicn.org) — a free, open API covering 1000+ cities including India, providing real-time PM2.5, PM10, NO2, SO2, CO, and O3 readings plus a composite city-level AQI. Register a free token at aqicn.org/api. OpenWeatherMap's Air Pollution API is a viable fallback with similar city-level coverage if WAQI rate limits become a problem.

**How it plugs into the existing architecture — a third recommendation layer, not a new model:**
1. **State layer** — today's scores (existing)
2. **Trend layer** — score direction over time (§6)
3. **Environmental context layer (new)** — rolling average local AQI (e.g., 3–7 day) compared against the trend layer's redness/acne trajectory. When both are elevated together, surface a pollution-tagged recommendation (antioxidant-rich foods — vitamin C/E sources, double-cleansing reminder, barrier-repair guidance) instead of, or alongside, the usual dietary one.

This is still classical, rule-based logic layered on existing structure — no new model type needed, consistent with keeping the recommender interpretable.

**Privacy note, consistent with §5's stance:** only request city-level location (or let the user manually select their city), never precise GPS. AQI is a city/station-level metric anyway, so there's no accuracy benefit to fine-grained location, only unnecessary privacy exposure.

**One honest caveat to build in:** don't let a single day's AQI spike drive a recommendation change — use the same rolling-average smoothing as the trend layer, for the same reason (noise vs. signal). A one-day pollution reading correlating with a one-day redness reading is exactly the kind of spurious link a careful evaluator will probe.

## 8. Datasets & Data Sources Required (recap)

| Source | Use |
|---|---|
| ACNE04 | Acne severity/detection training |
| DermaCon-IN | Indian-skin validation set (CC BY-NC-SA, non-commercial) |
| INDB | Food/nutrient data for recommendations |
| PubMed/MEDLINE reviews | Source for the recommendation rule set itself — manual curation, not a download |
| WAQI (aqicn.org) API | Live city-level AQI/pollutant data for the environmental context layer — external API, not a downloadable dataset |
| — (no dataset) | Redness/dryness — classical OpenCV, computed directly |

## 9. Do / Don't (recap)

**Do:** lock the API contract in week 1 · build Flutter screens against mock data immediately · cap the rule set at 10–15 evidence-tagged entries · ship classical-CV redness/dryness early as a visible milestone · keep the "not a diagnosis" disclaimer visible near every score · delete images immediately after processing, keep only the score record · default photo retention to off · smooth the trend calculation over multiple scans, not single points · smooth the AQI correlation over a rolling window, not single-day spikes · use city-level location only for AQI lookup.

**Don't:** wait for the trained model before starting Flutter work · treat DermaCon-IN labels as severity scores · blend evidence tiers without labeling them · scope-creep the literature review past ~15 rules · skip the consent screen before any real photo capture · retain raw images by default · whiplash recommendations based on one noisy scan · request precise GPS when city-level location is all AQI data supports · claim a pollution-skin link from a single day's reading.
