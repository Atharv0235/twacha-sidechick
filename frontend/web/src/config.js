// Central settings. Edit this file before the demo.

// Backend base URL. Set VITE_API_BASE_URL in Netlify / .env; falls back to local dev.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// Real team members shown in the "Built by" block. Add names here, e.g.
//   { name: 'Your Name', role: 'Backend and model' }
export const TEAM = [];

// Contact email shown in the privacy policy and About screen (leave '' to hide).
export const CONTACT_EMAIL = '';

// Shared strings live in texts.js (so they can be used without the browser build); re-exported here for the screens.
export { DISCLAIMER, WAQI_CREDIT } from './texts.js';
