import React from 'react';
import LegalPage from './LegalPage';
import { DISCLAIMER } from '../config';

export default function TermsConditions({ onBack }) {
  return (
    <LegalPage
      title="Terms of Use"
      updated="October 2026"
      onBack={onBack}
      sections={[
        {
          heading: 'Not medical advice',
          paragraphs: [
            DISCLAIMER,
            'Twacha is not a medical device. It does not diagnose, treat, cure or prevent any condition, and nothing it shows is a substitute for a doctor. If you have painful, spreading, bleeding or persistent skin problems, please see a qualified doctor.'
          ]
        },
        {
          heading: 'Accuracy',
          bullets: [
            'The acne score comes from a small machine-learning model tested on only 56 images, and it makes mistakes. It has not been validated across skin tones.',
            'Redness and dryness are rough colour and texture estimates and are not calibrated.',
            'Food suggestions are ideas to try. They use weights chosen by the student team, and research on diet and acne is mixed.',
            'Lighting, camera and filters change results.'
          ]
        },
        {
          heading: 'Using the app',
          bullets: [
            'Use it only for photos of your own face, and only if you are 18 or older.',
            'Do not upload other people\'s photos.',
            'Keep your password private. You are responsible for what happens in your account.',
            'The service is provided as it is, may be slow or offline, and may be removed at any time.'
          ]
        },
        {
          heading: 'No warranty',
          paragraphs: [
            'This is a student class project. We give no warranty of any kind, and we are not responsible for decisions you make based on its output.'
          ]
        }
      ]}
    />
  );
}
