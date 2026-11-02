# Twacha (त्वचा)

A skin and diet wellness tracker prototype. Log in, take a face photo, and the app estimates acne severity and a few rough skin measures, adds local air quality, and suggests Indian foods to try, with an honest evidence note for each one. You can add foods to **My plan**, tick them off each day, and see how your week is going next to your scan trend.

> **Prototype for a university project. Not a medical device and not a diagnosis.** Results are experimental estimates.

---

## What it does

| Feature | Status |
| --- | --- |
| Accounts: sign up and log in with email and password, one private set of data per user | Working. No email verification and no "forgot password" yet |
| Acne score (0 to 10) from a face photo (MobileNetV2 trained on ACNE04, run with ONNX) | Working, limited accuracy (see Limitations) |
| Photo checks: face found, enough light, not blurry; clear error messages | Working |
| Beard handling: scores forehead and cheeks only and tells the user | Working (heuristic) |
| Redness, dryness, skin tone (ITA) from simple colour measures | Working, uncalibrated, labelled experimental |
| Air quality by city from WAQI, labelled `live`, `demo` or `unavailable`; never invented | Working with a WAQI token |
| Nutrient suggestions scored from the skin values, boosted for antioxidants when air is poor | Working, placeholder weights |
| Indian food suggestions (add / reduce) with INDB nutrient values where available | Working |
| Evidence tier and source note on every suggestion (none labelled "clinical") | Working |
| Food log that personalises suggestions (foods logged in the last 3 days are not offered as new) | Working |
| **My plan**: add foods from a result ("try" or "eat less"), weekly goals, tick "ate today", logging streak, weekly summary | Working |
| **Your week** on Home: seven-day dots for scans and food logs, this week's average score next to last week's, plan goals met, poor-air days. It only describes; it never says what caused a change | Working |
| **Photo check on the phone** before upload: warns about a dark, blurry, washed-out, unevenly lit or small photo, and offers Retake or Use anyway (the server still decides) | Working; thresholds tried on only a handful of photos |
| **Ask Twacha**: quick answers (week, why a score changed, foods, plan, air, scan tips, privacy, deleting data) worked out from the user's own data. A fixed-topic helper, **not an AI model**; nothing typed is sent anywhere | Working |
| Scan history, program day (day X of 30) and acne trend | Working |
| **30-day journey** (Progress): one dot per day, filled where you scanned, with a suggested **scan every 3 or 4 days** (your choice, kept on the phone). The Home card shows "next scan" (due, late, or a date). A suggestion only: nothing is enforced | Working; tested with a faked clock |
| **Bell**: in-app reminders worked out on the phone (scan due or late, foods not ticked today, logging streak, 30 days up). They show only inside the app | Working. **Not push notifications** |
| **Scan comparison**: a new result shows the scan next to your last scan or your first (three scores, "about the same" under 0.5, previews as Then / Now). It describes changes in photo-based estimates and never says why | Working |
| Soft hand-drawn plant and food doodles on cards and empty screens. Decoration only, hidden from screen readers | Working |
| Photos processed in memory and never stored | Working |
| Delete scans and logs, or delete the whole account | Working |
| Web app and Android app (React + Capacitor) wired to the API | Working in tests with a headless browser; **not yet tested on a real Android phone** |
| Push reminders, email verification, password reset, iOS build | Not built |

## App screens

The React + Capacitor app (also shown on the website at `?mode=app`) talks to the backend:

- **Splash:** animated start screen. Its progress bar follows the real server wake-up (free hosting sleeps).
- **Sign up / log in:** email, password, first name, optional city, consent. The login is kept on the phone until you log out.
- **Top bar (every screen):** the Twacha name, an **Ask Twacha** button and the **bell** (unread count; opens the reminders list).
- **Home:** one card with day X of 30, the latest scan and **next scan** (due, late or a date), then **today's plan** (tick foods you ate), **Your week**, an **Ask Twacha** card, air-quality card (hidden when unavailable, tagged when it is a demo value).
- **Scan:** take or choose a photo, or use the live camera. The photo is resized on the phone and sent to `POST /api/scan/`. Shows scores, quality notes, a **comparison with your last or first scan**, foods to try with an evidence note and a **+ Plan** button. Before upload the phone checks light and sharpness and suggests a retake if needed; the live camera shows a face oval. Bad photos show a readable message.
- **Progress:** the **30-day journey** (dots, next scan, 3 or 4 day rhythm), acne-score chart and a list of scans. Small photo previews are kept on the phone only and can be deleted.
- **Diet and plan:** **My plan** (weekly goals, seven-day dots, goal stepper), food ideas, a food log, and general skin-care habits.
- **About:** your account, change password, log out, limitations, credits, and delete options.

## How it works

```text
App (React + Capacitor)  --HTTPS + login token-->  FastAPI backend  -->  Photo checks -> ONNX acne model + colour estimates
                                                        |                              -> Recommender (nutrients, foods, evidence)
                                                        |--> WAQI (air quality)
                                                        '--> Database (SQLite for development, Postgres for hosting)
```

The app is a thin client. All scoring runs on the server. Every data endpoint needs a login, and every query is filtered by the logged-in user.

## Tech stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite or Postgres, Alembic migrations, bcrypt + JWT for accounts
- **Computer vision:** OpenCV (face detection, colour measures), ONNX Runtime, MobileNetV2 fine-tuned on ACNE04 (trained in Colab; notebooks in `notebooks/`)
- **Data:** WAQI air-quality API, Indian Nutrient Databank (INDB) values, ACNE04 for training
- **App:** React 19, Vite 8, Capacitor 8 (Android), custom CSS design system

## Repository structure

```text
├── backend/                  # FastAPI service
│   ├── app/
│   │   ├── main.py           # app, CORS, /health, demo endpoints
│   │   ├── auth.py           # password hashing, tokens, login throttle
│   │   ├── routers/accounts.py  # register, login, profile, change password, delete account
│   │   ├── routers/scans.py     # /api/scan, /api/history, /api/log, /api/foods, /api/data
│   │   ├── routers/plan.py      # /api/plan (my plan, daily ticks, weekly summary)
│   │   ├── cv_pipeline.py    # photo checks, face crop, ONNX acne model
│   │   ├── classical_cv.py   # redness, dryness, skin tone estimates
│   │   ├── recommender.py    # nutrient scoring (placeholder weights)
│   │   ├── nutrient_lookup.py# Indian food table and matching
│   │   ├── evidence.py       # evidence tiers and source notes
│   │   └── aqi_client.py     # WAQI client with honest fallbacks
│   ├── alembic/              # database migrations
│   ├── ml/twacha_acne_model.onnx
│   ├── tests/
│   └── requirements.txt
├── frontend/web/             # React + Vite + Capacitor app (android/ inside)
├── notebooks/                # model training notebooks
├── docs/                     # planning documents (some are out of date)
├── netlify.toml
└── README.md
```

## Getting started

### Backend

```bash
cd backend
pip install -r requirements.txt
export JWT_SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')"   # Windows PowerShell: see backend/README.md
uvicorn app.main:app --reload --host 0.0.0.0
# open http://localhost:8000/docs
```

Tests:

```bash
pip install -r requirements-dev.txt
pytest -q
TWACHA_PHOTOS=/folder/with/face/photos pytest -q                         # also runs real photos
TWACHA_TEST_DATABASE_URL=postgresql://user:pw@localhost/emptydb pytest -q  # same tests on Postgres
```

### App

```bash
cd frontend/web
npm install
cp .env.example .env     # VITE_API_BASE_URL=http://localhost:8000
npm run dev              # http://localhost:5173/  (add ?mode=app for the phone view)
```

Android build:

```bash
cd frontend/web
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug        # Windows: gradlew.bat assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Requires Node 22 or newer (the Capacitor CLI needs it). For the APK you also need Android Studio (SDK 36) and Java 21.

## API

Send `Authorization: Bearer <token>` on everything except `/health`, `/api/foods/` and the two auth calls.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | `{email, password (8 to 72 chars), name, city?, accepted_terms: true}` returns a token and the user |
| POST | `/api/auth/login` | `{email, password}` returns a token and the user |
| GET / PUT | `/api/me` | read or change your name and city |
| POST | `/api/auth/change-password` | `{current_password, new_password}`; logs out other devices |
| POST | `/api/me/delete` | `{password}`; deletes the account and all its data |
| POST | `/api/scan/` | multipart: `image` (required), `city` (optional). Returns scores, air quality, recommendations, `quality_notes` |
| GET | `/api/history/?limit=30` | past scans and program day |
| POST / GET | `/api/log/` | save one day's foods (replaces that day) / list recent days |
| GET | `/api/foods/` | food names for the log picker |
| GET | `/api/plan/summary?today=YYYY-MM-DD` | plan items with weekly progress, goals met, logging streak, scan change |
| POST | `/api/plan/` | `{food, kind: "try"\|"limit", target_days?}` add a food (max 12) |
| PUT / DELETE | `/api/plan/{id}` | change the weekly goal / remove |
| POST | `/api/plan/check` | `{food, done, log_date?}` tick or untick a food for a day (edits the food log) |
| GET | `/api/summary/week?today=YYYY-MM-DD&tz_offset=330` | last 7 days vs the 7 before: scans, food days, average scores and direction, poor-air days, plan goals, plain-language `highlights` |
| DELETE | `/api/data/` | deletes your scans, logs and plan; keeps the account |
| GET | `/health` | liveness and whether the acne model is loaded |
| POST | `/demo/seed`, `/demo/reset` | only when `ENABLE_DEMO=1`; synthetic history for the logged-in user |

Errors: `401` not logged in or wrong password; `409` email already registered; `422` with a readable `detail`; `429` too many wrong passwords (15 minute wait); `413` above 10 MB.

### Environment variables

| Variable | Meaning |
| --- | --- |
| `JWT_SECRET_KEY` | **required in production**, at least 32 random characters. Without it a random key is made at start-up and everyone is logged out on each restart |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | login lifetime, default `10080` (7 days) |
| `DATABASE_URL` | default `sqlite:///./twacha.db`. For hosting use Postgres (see below) |
| `WAQI_TOKEN` | free token from aqicn.org; without it air quality is `unavailable` |
| `DEFAULT_CITY` | city when the app sends none (default `bhopal`) |
| `DEMO_AQI` | fixed AQI used only when live data fails; response is labelled `demo` |
| `ENABLE_DEMO` | `1` to enable `/demo/*` |
| `CORS_ORIGINS` | comma-separated origins (default `*`) |
| `BCRYPT_ROUNDS`, `LOGIN_MAX_FAILURES` | tuning (defaults 12 and 8) |

Render start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Database

- **Development:** SQLite file (`twacha.db`). Fine on your own computer.
- **Hosting:** use Postgres, because accounts are stored in the database. Render's free web service has a disk that is wiped on every redeploy and restart, which would delete every account.
- Set `DATABASE_URL` to the provider's connection string. `postgres://` and `postgresql://` both work; the app picks the `psycopg2` driver.
- Tables are created at start-up. `alembic upgrade head` is also safe on an empty database, on one an older version created, or on one the app already created (all three were tested on SQLite and Postgres).
- Free-tier terms checked on 15 Oct 2026 (re-check before you rely on them): Render Postgres free expires 30 days after creation (1 GB); Neon free is permanent, 1 GB, and sleeps after 5 idle minutes; Supabase free pauses after 1 week of inactivity (500 MB).

## Limitations (read before trusting any number)

- **Acne model:** macro-F1 0.60 and 61% accuracy on only 56 test images (about 0.07 noise); 96% of predictions are within one grade. It was trained on clinic photos, mostly East Asian, so frontal selfies, darker skin tones, beards and moles can give wrong scores. It has not been validated across Fitzpatrick skin types.
- **Redness, dryness, skin tone:** simple colour and texture measures, not calibrated against any reference. Skin tone is stored but not used for any advice.
- **Nutrient weights** are placeholders chosen by the team, not taken from the cited papers. Evidence for diet and acne is mixed; suggestions are things to try, not treatment.
- **My plan only counts what you tick or log.** Change in score between scans can come from lighting and photo quality, so the app never claims the plan caused it.
- **Accounts:** no email verification, so an email address is not proven to belong to the person. No "forgot password": a user who forgets it must register again. The login token is kept in the phone's local storage.
- **Ask Twacha** answers a fixed set of topics from the app's own data. It is not an AI model, cannot answer other questions, and says so. The photo check cannot tell whether a face is in the picture (the server does that).
- **Lighting and camera** change scores. Use daylight and a neutral face.
- **Free hosting** sleeps after inactivity; the first request can take about a minute.
- **Demo history** from `/demo/seed` is synthetic.

## Privacy

Photos are sent to the server over HTTPS, analysed in memory and discarded. The server stores: email, first name, optional city, a bcrypt hash of the password, scan scores, food logs and plan. Optional small photo previews and the login token stay on the phone. Users can delete their scans and logs, or the whole account, from the About screen. Photo collection for model improvement uses a consent form, adults only, coded IDs, private storage, a deletion date and a 7-day withdrawal window.

## Data and attribution

- Air quality data: World Air Quality Index Project, aqicn.org (attribution must be shown wherever AQI is displayed).
- ACNE04 dataset for training; INDB for nutrient values. Check each dataset's licence before redistributing.

## License

MIT License.
