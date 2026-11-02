# Twacha: handoff brief for the coding agent (round 3: accounts and plan)

Read this whole file first. The code in this repository (`backend/`, `frontend/web/`, `docs/`) is connected end to end and now has **user accounts** and a **My plan** feature. This brief says what exists, what is left, and the rules you must keep. It replaces the earlier round-2 brief (which described anonymous device IDs; that design is gone).

## 1. Project

Twacha is a skin and diet wellness tracker, a class project by two students (about 5 to 10 hours a week each). A logged-in user takes a face photo; the backend estimates acne severity and rough skin measures, adds local air quality, and suggests Indian foods to try with an honest evidence note. The user can add foods to **My plan**, tick them off daily, and see weekly goals and a logging streak. **Demo for the professor is about three weeks after 12 Oct 2026.** Favour a small, reliable, honest app.

## 2. What exists (verified on 15 Oct 2026)

- **Accounts (backend):** `POST /api/auth/register`, `/api/auth/login`, `GET/PUT /api/me`, `POST /api/auth/change-password`, `POST /api/me/delete`. bcrypt hashes, JWT (HS256, 7 days) with a version number so a password change logs out other devices, login throttle (8 wrong tries per email per 15 min), same message and timing for unknown email and wrong password. All data endpoints need the token and filter by `user_id`. No email verification, no password reset (needs an email service).
- **Per-user data:** `user_id` on programs, scans and food logs; `plan_items` table. Old `device_id` columns remain but are unused. Old rows have no owner and are unreachable.
- **My plan:** `GET /api/plan/summary`, `POST /api/plan/`, `PUT/DELETE /api/plan/{id}`, `POST /api/plan/check`. Items are foods from the canonical list with kind `try` (at least N of the last 7 days) or `limit` (at most N). Progress is counted from the food log. `scan_change` compares first and latest acne score in the last 14 days and always carries the "does not show the plan caused it" note.
- **App:** sign up / log in screen, Home with today's plan, **+ Plan** buttons in scan results, **My plan** tab (weekly goals, seven-day dots, goal stepper, remove), food log that pre-selects foods already ticked, About screen with account, change password, log out, delete scans and logs, delete account. Per-account local storage for the latest result and photo previews. A new login always starts on Home.
- **Database:** SQLite for development, Postgres for hosting (`postgres://` and `postgresql://` URLs are accepted and use `psycopg2`). Alembic migrations were rewritten: they build an empty database, upgrade an old one, and match the models exactly.
- **Honesty fixes kept:** no invented doctors, statistics, citations or partners; no "clinical", "prescribe", "heal" or "Fitzpatrick calibrated" wording except in limitations; privacy policy and terms describe the real behaviour (email, bcrypt hash, scores, plan and food log stored; photo never stored).
- **Tests:** `pytest -q` in `backend` = 39 passed, 1 skipped (real-photo tests run when `TWACHA_PHOTOS` is set). The same 39 pass on PostgreSQL 16 with `TWACHA_TEST_DATABASE_URL`. A headless-browser journey (sign up, scan, plan, tick, log out/in, second user sees nothing of the first, change password, delete account) passed 27 of 27 checks. **Not tested:** a real Android phone, Render, Netlify, Neon, a real WAQI token.

## 3. Non-negotiable rules (keep them)

1. **Honesty over polish.** Prototype, not a medical product. Keep "Experimental estimate for a class project. Not a medical diagnosis." on result screens and in the footer.
2. **Never invent data, people, citations, statistics, partners or testimonials.** If the API fails, show an error, not fake numbers.
3. **Photos are never stored on the server.** Do not add image storage. Thumbnails stay on the phone only.
4. **Air quality:** show the WAQI credit next to it; hide the card when `environment.source == "unavailable"`; tag `demo`.
5. **Do not change `backend/app/recommender.py` weights or `backend/app/evidence.py` text** without asking the team. Do not label any evidence "clinical". Do not run `backend/seed_rules.py` (it labels evidence "clinical" and cites unverified sources; the app does not use it).
6. **No new health claims** ("treats", "cures", "heals", percentages of improvement). The plan must never say it caused a change in the skin.
7. **Security basics stay:** never log or return passwords or hashes; never put `JWT_SECRET_KEY` or any key in the repo; every query on user data filters by the logged-in user; keep error messages free of internals.
8. Ask before adding paid services, analytics, trackers or an email provider. One task per commit.

## 4. API contract (backend v0.5)

Base URL = `VITE_API_BASE_URL`. `Authorization: Bearer <token>` on everything except `/health`, `/api/foods/`, `/api/auth/register` and `/api/auth/login`. The full table is in the root `README.md`. Scores are 0 to 10, **lower is healthier**. `ita_value` is never shown or used. Errors: `401` (not logged in; wrong password on password-checked actions), `409` email taken, `422 {"detail": "..."}` (or a list of `{msg}` for field errors), `429` login throttle, `413` over 10 MB, `500` generic. The app sends its own local date (`today`, `log_date`); the server accepts a difference of one day for time zones.

## 5. What is left, in order

1. **Deploy the backend with a real database (most important now).** Create a Postgres database. Neon free is permanent (1 GB, sleeps after 5 idle minutes); Render's free Postgres expires 30 days after creation, so create it close to the demo or avoid it; Supabase free pauses after 1 week of inactivity (terms checked 15 Oct 2026, re-check). On Render set `DATABASE_URL`, `JWT_SECRET_KEY` (32+ random characters), `WAQI_TOKEN`, `DEFAULT_CITY`, `CORS_ORIGINS` (the Netlify URL; Capacitor's origin is `https://localhost`, so list both or keep `*`), `ENABLE_DEMO=1` only for the demo. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Open `/health` and `/docs`, register, call the endpoints.
2. **Deploy the web app to Netlify** with `VITE_API_BASE_URL` set to the Render URL (no trailing slash). `netlify.toml` already has base `frontend/web`. Open it on a phone over mobile data.
3. **Real Android phone test.** Build the debug APK (see README) and test over mobile data: sign up, log in, camera via "Take a photo" and "Live camera", scan, add to plan, tick, rotate, offline error, log out, reinstall (a reinstall keeps the account on the server: log in again). Check that Capacitor's origin is accepted by CORS.
4. **Check city names against WAQI** for each onboarding city (Delhi, Mumbai, Bengaluru, Pune, Kolkata, Chennai, Hyderabad, Bhopal, Jaipur, Lucknow) and fix any that return no live reading.
5. **Fill in `frontend/web/src/config.js`:** `TEAM` (real names and roles) and `CONTACT_EMAIL`. Ask the team; do not invent them.
6. **Test the 30-day story with a demo account.** Register a demo account, call `/demo/seed?days=14` with its token, check Home, Progress and the "Demo data" banner. Keep the demo account's password written down: there is no password reset.
7. **QA checklist** (write it to `docs/TEST_CHECKLIST.md`): sign up, log in, wrong password, expired session, good photo, dark photo, no-face photo, beard photo, offline, slow server, plan add/tick/untick/remove, food log keeps ticked foods, history chart with 3+ scans, change password logs out another device, delete scans and logs, delete account, APK install.
8. **Polish only if time allows:** the 4 oxlint warnings, self-host the two Google Fonts or keep them (disclosed in the privacy policy), app icons and splash for Capacitor.

## 6. Known weaknesses (shown in the app's About screen; do not hide or silently "fix")

- Acne model: macro-F1 0.60, accuracy 61% on 56 test images (about 0.07 noise). Trained on clinic photos, mostly East Asian. Frontal selfies, darker skin, beards and moles can score wrongly.
- Redness, dryness and skin tone are uncalibrated colour measures.
- Nutrient weights are team-chosen placeholders; diet and acne evidence is mixed.
- Lighting changes scores. Cold starts make the first request slow (free hosting).
- Accounts: no email verification and no password reset; the login token is in local storage; the login throttle is in memory and resets on restart.

## 7. Out of scope until after the demo

Email verification and password reset (needs an email provider), social login, retraining the model, Fitzpatrick-balanced data, push notifications and reminders, payments, iOS build, any claim of clinical accuracy.

## 8. Definition of done

- [ ] Fresh APK on a real phone, mobile data: create an account, scan a real photo and see a result from the deployed backend; two different photos give two different results.
- [ ] A second account on the same phone sees none of the first account's data.
- [ ] Bad photo shows a readable message and offers Retake.
- [ ] Plan: add a food from a result, tick it on Home, see it counted on My plan; logging the same food in the Food log counts too.
- [ ] Data survives a server restart (it is on Postgres, not on the free web disk).
- [ ] Disclaimer and WAQI credit visible; no invented people, statistics or citations anywhere (`grep -rniE "dr\.|97%|RCT|fitzpatrick|clinical care" frontend/web/src` is clean).
- [ ] `pytest -q` (backend), `npm run lint` and `npm run build` (frontend/web) pass.
- [ ] `TEAM` and `CONTACT_EMAIL` filled with real values; README matches reality.

## 9. Questions to ask the team before starting

1. Real names and roles for the "Built by" block, and a contact email.
2. Exact demo date (sets the feature-freeze day, one week before).
3. Do they already have a WAQI token, a Render service, and a Postgres database (which provider)?
4. Real photos for the demo: who will be scanned, and has each person agreed?
