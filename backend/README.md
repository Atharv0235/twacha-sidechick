# Twacha backend (v0.5)

FastAPI + SQLAlchemy + ONNX acne model. Photos are processed in memory and never stored. Users have accounts; every row is owned by one user.

## Run

Linux / macOS:

    pip install -r requirements.txt
    export JWT_SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')"
    uvicorn app.main:app --reload --host 0.0.0.0

Windows PowerShell:

    pip install -r requirements.txt
    $env:JWT_SECRET_KEY = python -c "import secrets; print(secrets.token_urlsafe(48))"
    uvicorn app.main:app --reload --host 0.0.0.0

Then open http://localhost:8000/docs. In the docs page, call `/api/auth/register`, copy the `access_token`, click **Authorize** and paste it to try the other endpoints.

If you do not set `JWT_SECRET_KEY` the server makes a random one at start-up (and logs a warning), so everyone is logged out whenever it restarts. Set it on the host.

Render start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Endpoints

Everything except `/health`, `/api/foods/` and the two auth calls needs `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| POST | /api/auth/register | `{email, password, name, city?, accepted_terms: true}`; password 8 to 72 characters; returns `{access_token, user}` |
| POST | /api/auth/login | `{email, password}`; 8 wrong passwords per email in 15 minutes locks it for the rest of that window |
| GET / PUT | /api/me | your profile (name, city) |
| POST | /api/auth/change-password | `{current_password, new_password}`; returns a new token and logs out every other device |
| POST | /api/me/delete | `{password}`; deletes the account and everything it owns |
| POST | /api/scan/ | multipart: `image` (required), `city` (optional). Returns scores, AQI, recommendations, `quality_notes` |
| GET  | /api/history/?limit=30 | past scans + program day (limit 1-200) |
| POST | /api/log/ | `{"foods_eaten": [...], "log_date": "YYYY-MM-DD"?}` saves that day (replaces the day's list) |
| GET  | /api/log/?limit=7 | recent food logs |
| GET  | /api/foods/ | canonical food names (public) |
| GET  | /api/plan/summary?today=YYYY-MM-DD | plan items with `days_eaten` of the last 7, `met`, `eaten_today`, `last_7`; plus `goals_met`, `logging_streak`, `scan_change` |
| POST | /api/plan/ | `{food, kind: "try"\|"limit", target_days?}`; food must be a canonical name; max 12 items; defaults 4 (try) and 2 (limit) |
| PUT / DELETE | /api/plan/{id} | change the weekly goal (try 1 to 7, limit 0 to 6) / remove |
| POST | /api/plan/check | `{food, done, log_date?}` tick or untick a food on one of the last 7 days (edits that day's food log) |
| GET  | /api/summary/week?today=YYYY-MM-DD&tz_offset=330 | "Your week": scans and food logged on each of the last 7 days, average acne/redness/dryness this week vs last week (`direction` is `lower`, `higher` or `same`, with a 0.5 noise band), poor-air days, plan goals met, plain-language `highlights`. `tz_offset` is minutes east of UTC so days follow the user's calendar. Describes only; never says what caused a change |
| DELETE | /api/data/ | deletes your scans, logs, plan and program; keeps the account |
| GET  | /health | liveness + whether the acne model is loaded |
| POST | /demo/seed, /demo/reset | only when `ENABLE_DEMO=1`. SYNTHETIC history for the class demo, for the logged-in user only |

Errors: 401 not logged in (or wrong password on password-checked actions), 409 email already registered, 422 with a readable `detail`, 429 too many wrong passwords, 413 if larger than 10 MB.

## How the plan works

A plan item is a food with a kind and a weekly goal: **try** means eat it on at least N of the last 7 days, **limit** means at most N. Progress is counted from the food log, so ticking "ate today" simply edits today's log, and logging foods in the Food log screen also counts. The `logging_streak` is the number of days in a row with anything logged. `scan_change` compares your first and latest acne score in the last 14 days (needs 2 scans at least 3 days apart) and always comes with a note that this does not show the plan caused the change. The app sends the user's own local date (`today`, `log_date`), allowed to differ from the server's by one day for time zones.

## Accounts and security

* Passwords: bcrypt hashes only. Tokens: signed JWT (HS256), 7 days by default, carry a version number so changing the password logs out every other device.
* Unknown email and wrong password give the same message and take about the same time.
* Not built (needs an email service): email verification and "forgot password". A user who forgets the password registers again.
* The login throttle is kept in memory (one server process). It resets when the server restarts.
* Rows from before accounts (the old `device_id` columns) have no owner and are not reachable through the API.

## Database

* `DATABASE_URL` default `sqlite:///./twacha.db` (development only). `postgres://` and `postgresql://` URLs work and use the `psycopg2` driver.
* Hosting: use Postgres. Render's free web disk is wiped on redeploy, which would delete every account. Check the provider's current free terms (checked 15 Oct 2026: Render Postgres free expires after 30 days; Neon free is permanent, 1 GB, sleeps after 5 idle minutes; Supabase free pauses after 1 week inactive).
* Tables are created at start-up and `ensure_columns()` adds missing columns to databases made by older versions. Alembic (`alembic upgrade head`) gives the same result and is safe on an empty database, an old one, or one the app already created.
* `seed_rules.py` and the `nutrient_evidence_rules` table are not used by the app (evidence text comes from `app/evidence.py`). Do not run `seed_rules.py`: it labels evidence "clinical" and cites sources that were not verified.

## Environment variables

| Var | Meaning |
|---|---|
| JWT_SECRET_KEY | at least 32 random characters. Required in production |
| ACCESS_TOKEN_EXPIRE_MINUTES | default 10080 (7 days) |
| DATABASE_URL | see above |
| WAQI_TOKEN | free token from aqicn.org. Without it the API reports `environment.source = "unavailable"` |
| DEFAULT_CITY | city when the app sends none (default bhopal) |
| DEMO_AQI | e.g. 215. Used only if live AQI fails; response is labelled `source: "demo"` |
| ENABLE_DEMO | `1` to enable /demo/* endpoints |
| CORS_ORIGINS | comma list, default `*` |
| BCRYPT_ROUNDS / LOGIN_MAX_FAILURES | defaults 12 / 8 (tests use 4 rounds) |
| USE_REAL_ACNE / REQUIRE_FACE / USE_CLASSICAL_CV | feature switches (defaults: on / on / on) |

See `.env.example`.

## Tests

    pip install -r requirements-dev.txt
    pytest -q
    TWACHA_PHOTOS=/folder/with/face/photos pytest -q                           # also runs real photos
    TWACHA_TEST_DATABASE_URL=postgresql://user:pw@localhost/emptydb pytest -q   # same tests on Postgres (use an EMPTY database)

## What is and is not reliable (be honest with the professor)
* Acne score: ACNE04 MobileNetV2, macro-F1 0.60 on 56 test images. Weak on beards, darker skin, frontal selfies.
  Beard detected -> forehead and cheeks only (a heuristic).
* Redness / dryness / skin tone (ITA): simple colour/texture estimates, NOT calibrated against any reference.
* Nutrient weights in recommender.py are team-chosen placeholders. Source notes in app/evidence.py were read and
  summarised honestly; none is rated "clinical".
* Accounts are basic: no email verification, no password reset.
* Not a medical device or diagnosis.
