import React from 'react';
import LegalPage from './LegalPage';
import { CONTACT_EMAIL, WAQI_CREDIT } from '../config';

const contact = CONTACT_EMAIL
  ? `Questions about your data: ${CONTACT_EMAIL}.`
  : 'Questions about your data: ask the project team through your course instructor.';

export default function PrivacyPolicy({ onBack }) {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 2026"
      onBack={onBack}
      sections={[
        {
          heading: 'What happens to your photo',
          paragraphs: [
            'When you scan, your photo is sent over the internet to the Twacha server. The server looks for a face, measures a few visible skin features and returns the results. The photo is held in the server\'s memory only while it is analysed. The server code does not write it to disk or a database, and it is not shared with anyone.',
            'We cannot promise what the hosting provider\'s infrastructure does with network traffic in general, so please do not upload photos you are not comfortable sending to a small student-run service.'
          ]
        },
        {
          heading: 'What we store on the server',
          bullets: [
            'Your account: email address, first name, city (optional), when you accepted this policy, and a scrambled (bcrypt) version of your password. We never store the password itself and cannot read it.',
            'Your scan scores (acne, redness, dryness, a skin-tone value), the date, and the air-quality reading for your city at that time.',
            'The foods you log, and the foods you add to your plan with your weekly goals.',
            'Your week summary is worked out on the server from the scores and food logs above. It adds nothing new to what we store.',
            'We do not ask for your phone number, address or date of birth.'
          ]
        },
        {
          heading: 'What stays on your phone',
          bullets: [
            'A login token, so you do not have to type your password every time. Logging out removes it.',
            'Your latest full result, so the app can show it without asking the server again.',
            'Small preview thumbnails of your photos for your timeline, if you chose to keep them. You can delete them from the Progress screen. They are kept per account on this phone.',
            'Your scan rhythm (every 3 or 4 days) and which reminders you have already read. The reminders (the bell) are worked out on your phone from your own scans, plan and log, and they show only inside the app. Twacha does not send push notifications, emails or texts.',
            'The photo check (light and sharpness) and the Ask Twacha quick answers run on your phone. What you type into Ask Twacha is not sent anywhere and is forgotten when you close it.'
          ]
        },
        {
          heading: 'Third parties',
          paragraphs: [
            `Your city name is sent to the World Air Quality Index Project (aqicn.org) to look up air quality. ${WAQI_CREDIT}. The app loads fonts from Google Fonts. We do not use advertising or analytics trackers, and we do not sell data.`
          ]
        },
        {
          heading: 'Deleting your data',
          paragraphs: [
            'Open About, then "Delete my account" (it asks for your password). This removes your account, scores, food log and plan from the server and clears everything stored on your phone. "Delete scans and logs" clears the same data but keeps your account.',
            'There is no "forgot password" yet. If you forget your password and ask us to remove your data, we will need a way to confirm it is you.'
          ]
        },
        {
          heading: 'Security',
          paragraphs: [
            'Data travels over HTTPS and passwords are stored only as bcrypt hashes. Repeated wrong passwords are slowed down. We do not verify email addresses, and this is a student project that has not been security-audited, so please do not reuse a password from an important account.'
          ]
        },
        {
          heading: 'Limits of this project',
          paragraphs: [
            'This is a prototype built for a class. It has not been audited and does not claim to meet any specific data-protection law. Do not rely on it for sensitive or medical purposes.',
            contact
          ]
        }
      ]}
    />
  );
}
