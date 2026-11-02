# Twacha web and Android app

React 19 + Vite 8 + Capacitor 8. One codebase gives:

- a short website (landing page, privacy policy, terms), and
- the app view (`?mode=app`, or automatically on phones and inside the Android app).

## Run

```bash
npm install
cp .env.example .env      # set VITE_API_BASE_URL to your backend
npm run dev               # http://localhost:5173/   (add ?mode=app for the app view)
npm run lint && npm run build
npm run check:assistant   # tests the Ask Twacha quick-answer logic (plain Node, no browser)
npm run check:journey     # tests the 30-day journey, 3/4-day rhythm, scan comparison and reminders (plain Node)
```

`VITE_API_BASE_URL` is read at build time (set it in Netlify's environment variables as well).

## Settings to edit before the demo

`src/config.js`: `TEAM` (real names), `CONTACT_EMAIL`, and the API base URL fallback.

## Android

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

The manifest asks for camera permission. The scan screen uses a file input with `capture="user"` (the most reliable path in the Android WebView); "Live camera" is an extra that needs the permission. Test on a real phone over mobile data.

## Structure

```text
src/
  api/client.js         fetch wrapper, login token, readable error messages, wake-up call, local-date helper
  api/image.js          resize and re-encode photos (drops EXIF), small on-phone thumbnails
  state/AppData.jsx     login session, latest result, history, food log, plan (localStorage + API)
  config.js             API URL, team names, contact email, disclaimer text
  components/
    PhoneSimulator.jsx  app shell: splash, sign up / log in, tabs
    app/AuthScreen.jsx  sign up and log in
    app/HomeTab.jsx     day X of 30, latest scan, today's plan, air quality
    app/ScanTab.jsx, ScanCapture.jsx, ScanResult.jsx   take a photo, see scores and foods, "+ Plan"
    app/Plan.jsx        today's checklist, plan manager, "+ Plan" button
    app/TimelineTab.jsx, LineChart.jsx                 history and acne chart
    app/DietTab.jsx     My plan, ideas, food log, skin-care habits
    app/AboutTab.jsx    account, change password, limitations, delete options
    Landing.jsx, Navbar.jsx, Footer.jsx, ScanStudioModal.jsx, PrivacyPolicy.jsx, TermsConditions.jsx   the website
```

## Accounts on the phone

The login token is saved in local storage (`twacha.token`). What stays on the phone (latest result, photo previews) is stored per account, so two people sharing a phone never see each other's. If the server rejects the token (expired, password changed elsewhere, account deleted) the app logs out and says why.
