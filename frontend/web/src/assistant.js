// "Ask Twacha": fixed quick answers worked out from the user's own data on the phone.
// This is NOT an AI model. It matches a question to one of a fixed set of topics and fills in the answer from data
// the app already holds (week summary, plan, latest scan). Nothing is sent anywhere, and it never invents facts or
// gives medical advice. Pure functions only, so it can be tested without a browser (see scripts/check-assistant.mjs).
import { DISCLAIMER, WAQI_CREDIT } from './texts.js';

export const INTENTS = [
  { id: 'week', label: 'How is my week going?',
    words: ['week', 'summary', 'how am i doing', 'this week', 'last 7 days'] },
  { id: 'change', label: 'Why did my score change?',
    words: ['score', 'scores', 'changed', 'change', 'worse', 'better', 'improve', 'improved', 'improving', 'went up', 'went down', 'higher', 'lower', 'why did'] },
  { id: 'eat', label: 'What should I eat?',
    words: ['eat', 'food', 'foods', 'diet', 'nutrient', 'nutrients', 'meal', 'recommend', 'suggest', 'what should i'] },
  { id: 'plan', label: 'How is my plan going?',
    words: ['plan', 'goal', 'goals', 'streak', 'tick', 'target'] },
  { id: 'air', label: 'Is the air a problem today?',
    words: ['air', 'aqi', 'pollution', 'polluted', 'smog', 'pm2.5', 'pm25'] },
  { id: 'scan', label: 'How do I take a good scan?',
    words: ['take a scan', 'good scan', 'good photo', 'take a photo', 'take a good', 'how do i scan', 'how to scan', 'lighting', 'light', 'blurry', 'blur', 'camera', 'selfie', 'retake'] },
  { id: 'medical', label: 'Is this a diagnosis?',
    words: ['diagnosis', 'diagnose', 'diagnosed', 'doctor', 'dermatologist', 'medical', 'disease', 'cure', 'treat', 'treatment', 'prescribe',
      'medicine', 'medication', 'tablet', 'tablets', 'cream', 'dose', 'antibiotic', 'isotretinoin', 'cancer', 'serious', 'infection', 'allergy'] },
  { id: 'photos', label: 'What happens to my photos?',
    words: ['photo', 'photos', 'picture', 'pictures', 'image', 'images', 'stored', 'store', 'saved', 'privacy', 'private', 'server', 'my face'] },
  { id: 'delete', label: 'How do I delete my data?',
    words: ['delete', 'erase', 'remove my', 'wipe', 'account', 'close my account'] },
];

// A few single words are strong signals on their own ("my photo is blurry" is about scanning, not about privacy).
const WEIGHT = { blurry: 2, blur: 2, lighting: 2, camera: 2, selfie: 2, retake: 2 };

const CRISIS = /(suicid|kill myself|end my life|want to die|self[- ]?harm|hurt myself)/i;

/** Picks the topic with the most matching words (longer phrases count for more). Returns an id, or null. */
export function matchIntent(text) {
  const q = ` ${String(text || '').toLowerCase().replace(/[^a-z0-9.\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  let best = null, bestScore = 0, tie = false;
  for (const it of INTENTS) {
    let score = 0;
    for (const w of it.words) {
      if (q.includes(` ${w} `)) score += WEIGHT[w] || w.split(' ').length;
    }
    if (score > bestScore) { best = it.id; bestScore = score; tie = false; } else if (score === bestScore && score > 0) { tie = true; }
  }
  return bestScore > 0 && !tie ? best : null;
}

export const isCrisis = (text) => CRISIS.test(String(text || ''));

const BAND_TEXT = { good: 'good', satisfactory: 'satisfactory', moderate: 'moderate', poor: 'poor', very_poor: 'very poor', severe: 'severe' };
const fmtDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};
const list = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const NO_COMPARE = 'one change between two scans cannot tell you why it happened.';

const ANSWERS = {
  week({ week }) {
    if (!week) return { text: ['I could not load your week yet. Check your connection and try again in a moment.'] };
    return { text: week.highlights, small: week.note, actions: [{ label: 'Scan now', tab: 'scan' }] };
  },

  change({ history, week }) {
    const scans = history?.scans || [];
    if (scans.length < 2) {
      return {
        text: [`I need at least two scans to compare, and you have ${scans.length} so far. Scan again in a few days and ask me again.`],
        actions: [{ label: 'Scan now', tab: 'scan' }],
      };
    }
    const [a, b] = scans;
    const rows = [['Acne', 'acne_score'], ['Redness', 'redness_score'], ['Dryness', 'dryness_score']].map(([label, key]) => {
      const d = Math.round((a[key] - b[key]) * 10) / 10;
      const word = Math.abs(d) < 0.5 ? 'about the same' : d < 0 ? `${Math.abs(d)} lower` : `${d} higher`;
      return `${label}: ${b[key].toFixed(1)} on ${fmtDate(b.created_at)}, ${a[key].toFixed(1)} on ${fmtDate(a.created_at)} (${word})`;
    });
    const out = {
      text: ['Here is your latest scan next to the one before it. Lower is better.'],
      bullets: rows,
      more: [
        'Scores come from photos, so lighting, angle, distance, camera, makeup and time of day can all move them. ' +
        `The app shows your food log and air quality, but ${NO_COMPARE}`,
        'For a fairer comparison, scan in the same place, at the same time of day, in daylight.',
      ],
    };
    const acne = week?.metrics?.find((m) => m.key === 'acne');
    if (acne?.direction) out.more.push('Averages over a whole week are steadier than two single photos. Ask me "How is my week going?".');
    out.actions = [{ label: 'See progress', tab: 'timeline' }];
    return out;
  },

  eat({ lastScan }) {
    const recs = lastScan?.recommendations || [];
    if (!lastScan) {
      return { text: ['Food ideas come from your latest scan. Scan once and I can show them here.'], actions: [{ label: 'Scan now', tab: 'scan' }] };
    }
    if (recs.length === 0) {
      return { text: ['Nothing stood out in your latest scan, so there are no food ideas right now. Keep scanning every few days.'] };
    }
    const bullets = recs.slice(0, 3).map((r) => {
      const foods = (r.foods_to_add || []).slice(0, 3).map((f) => f.name);
      return foods.length ? `${r.title}: ${list(foods)}` : r.title;
    });
    return {
      text: ['From your latest scan, these are the areas the app looked at, with foods to try:'],
      bullets,
      more: ['These are food ideas, not treatment. Each suggestion on the result screen shows how strong the evidence is. Tap "+ Plan" next to a food to track it.'],
      actions: [{ label: 'Open my plan', tab: 'diet' }, { label: 'Open last result', tab: 'scan' }],
    };
  },

  plan({ plan }) {
    if (!plan) return { text: ['I could not load your plan yet. Check your connection and try again in a moment.'] };
    if (plan.items.length === 0) {
      return {
        text: ['You have not added any foods to your plan yet. On a scan result, tap "+ Plan" next to a food you want to try or cut back on.'],
        actions: [{ label: 'Open last result', tab: 'scan' }],
      };
    }
    const bullets = plan.items.map((i) => {
      const goal = i.kind === 'try' ? `at least ${i.target_days}` : `at most ${i.target_days}`;
      return `${i.food}: ${i.days_eaten} of the last 7 days (goal ${goal}), ${i.met ? 'on track' : i.kind === 'try' ? 'not there yet' : 'over the limit'}`;
    });
    const todo = plan.items.filter((i) => i.kind === 'try' && !i.met && !i.eaten_today).map((i) => i.food);
    const out = {
      text: [`You are meeting ${plan.goals_met} of ${plural(plan.goals_total, 'goal')} this week. You have logged food ${plural(plan.logging_streak, 'day')} in a row.`],
      bullets,
      more: [],
      actions: [{ label: 'Open my plan', tab: 'diet' }],
    };
    if (todo.length) out.more.push(`Not ticked today yet: ${list(todo)}.`);
    out.more.push('The plan only counts what you tick. It does not show that any food changes your skin.');
    return out;
  },

  air({ lastScan }) {
    const env = lastScan?.environment;
    if (!env || env.source === 'unavailable') {
      return { text: ['I do not have an air quality reading from your latest scan. It can be missing if the city is not set or the air service is busy.'] };
    }
    const band = BAND_TEXT[env.aqi_band] || env.aqi_band;
    const where = env.city ? ` in ${env.city}` : '';
    return {
      text: [`At your latest scan, air quality${where} was ${env.local_aqi}, which is ${band}${env.source === 'demo' ? ' (a demo value, not a live reading)' : ''}.`],
      more: [
        'The app uses air quality as one input when it ranks food suggestions. It cannot tell you how the air affects your skin or health.',
        'For health advice about air pollution, follow your local official guidance.',
      ],
      small: WAQI_CREDIT,
    };
  },

  scan() {
    return {
      text: ['A few things make the reading more reliable:'],
      bullets: [
        'Use daylight, or face a window so both cheeks are lit evenly.',
        'Keep your whole face in the frame, looking at the camera.',
        'No filters. Take glasses off and keep hair off your forehead.',
        'Hold the phone steady and tap the screen to focus.',
        'Scan in the same place and at the same time of day, so scans can be compared.',
      ],
      more: ['The app also checks light and sharpness before it uploads, and tells you if a retake would help.'],
      actions: [{ label: 'Scan now', tab: 'scan' }],
    };
  },

  medical() {
    return {
      text: [
        'No. Twacha gives rough estimates from a photo for a class project. It cannot diagnose a skin condition, and it cannot tell you which medicine or treatment to use.',
        'Please see a doctor or dermatologist if a spot is painful, bleeding, spreading, changing shape or colour, or not healing, or if your skin is bothering you. Ask a doctor or pharmacist about any medicine.',
      ],
      small: DISCLAIMER,
    };
  },

  photos() {
    return {
      text: [
        'Your photo is sent to the Twacha server over HTTPS, analysed in memory and not saved there. The server keeps only the scores, the date and the air quality reading.',
        'If you chose to keep previews, a small copy of each photo stays on this phone for your timeline. They stay on the phone after you log out. You can delete them from the Progress screen, or with "Delete scans and logs" or "Delete my account" in About.',
        'The photo is not shared with anyone else. Only the city name goes to the air quality service.',
      ],
      actions: [{ label: 'Open Progress', tab: 'timeline' }],
    };
  },

  delete() {
    return {
      text: [
        'Open About, then scroll to "Delete my data". "Delete scans and logs" clears your scans, food log and plan and the previews on this phone, and keeps your account. "Delete my account" removes everything including your login, and asks for your password.',
      ],
      actions: [{ label: 'Open About', tab: 'about' }],
    };
  },
};

export const FALLBACK = {
  text: ['I can only answer a fixed set of questions about your scans, plan, week and privacy. I am not an AI chat model, so I cannot help with other questions. Pick one below.'],
};

export const CRISIS_REPLY = {
  text: [
    'I am sorry you are going through this. I am only a small app and cannot help with it, but please talk to someone now: a person you trust, or your local emergency number.',
    'In India you can call the free Tele-MANAS helpline on 14416, at any hour.',
  ],
};

/** Returns { text: string[], bullets?: string[], more?: string[], small?: string, actions?: [{label, tab}] }. */
export function answer(id, ctx = {}) {
  const make = ANSWERS[id];
  return make ? make(ctx) : FALLBACK;
}

/** Free text in, answer out. Anything that is not a known topic gets the fallback, never a guess. */
export function reply(text, ctx = {}) {
  if (isCrisis(text)) return CRISIS_REPLY;
  const id = matchIntent(text);
  return id ? answer(id, ctx) : FALLBACK;
}
