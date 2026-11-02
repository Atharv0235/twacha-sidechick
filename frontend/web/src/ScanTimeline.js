// The 30-day journey and the 3 or 4 day scan rhythm. Pure functions only (no React), so they can be tested without a browser
// (see scripts/check-journey.mjs).
//
// All dates here are the phone's LOCAL calendar dates, written 'YYYY-MM-DD'. The program's start date comes from the server
// (the server's calendar date), so near midnight the "day" can differ from the phone's by one. That is why this module never
// claims more than "Day N of 30" and a suggested next scan date.
//
// The rhythm is a suggestion: scores come from photos, so scanning more often than every few days mostly adds noise.

export const TOTAL_DAYS = 30;
export const CADENCES = [3, 4];
export const DEFAULT_CADENCE = 3;
/** Differences smaller than this are shown as "about the same" (the same band the weekly summary uses). */
export const SAME_BELOW = 0.5;

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

/** Local calendar date of a Date or ISO timestamp, as 'YYYY-MM-DD'. Returns null for invalid input. */
export function localDateKey(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return keyOf(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

const toUtcDay = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
};

/** Whole days from key a to key b (b - a). */
export const daysBetween = (a, b) => Math.round(toUtcDay(b) - toUtcDay(a));

/** The date key that is `n` days after `key`. */
export function addDays(key, n) {
  const dt = new Date((toUtcDay(key) + n) * 86400000);
  return keyOf(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** A short label for a date key, e.g. "Fri 30 Oct". */
export function prettyDate(key, locale) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Works out where the person is in their 30 days and when the next scan is suggested.
 * scans: newest first, as the server returns them. program: { start_date, total_days } or null.
 * Returns { totalDays, started, day, finished, days, scanDays, scanCount, next }.
 */
export function buildJourney({ scans = [], program = null, cadence = DEFAULT_CADENCE, now = new Date() } = {}) {
  const c = CADENCES.includes(cadence) ? cadence : DEFAULT_CADENCE;
  const todayKey = localDateKey(now);
  const totalDays = program?.total_days || TOTAL_DAYS;
  const startKey = program?.start_date || null;
  const scanKeys = scans.map((s) => localDateKey(s.created_at)).filter(Boolean);
  const scanned = new Set(scanKeys);
  const started = !!startKey && scans.length > 0;

  const rawDay = startKey ? daysBetween(startKey, todayKey) + 1 : 0;
  const day = started ? Math.max(1, rawDay) : 0;
  const finished = started && rawDay > totalDays;

  // Where the next scan falls, counted from the most recent scan.
  const lastKey = scanKeys.length ? scanKeys.reduce((a, b) => (a > b ? a : b)) : null;
  let next;
  if (!lastKey) {
    next = { state: 'first', cadence: c, dueKey: todayKey, daysUntil: 0, daysLate: 0 };
  } else {
    const dueKey = addDays(lastKey, c);
    const diff = daysBetween(todayKey, dueKey);
    const state = lastKey === todayKey ? 'done' : diff > 0 ? 'upcoming' : diff === 0 ? 'due' : 'overdue';
    next = { state, cadence: c, dueKey, daysUntil: Math.max(0, diff), daysLate: Math.max(0, -diff), lastKey };
  }
  if (finished) next = { ...next, state: 'complete' };

  const days = Array.from({ length: totalDays }, (_, i) => {
    const n = i + 1;
    const dateKey = startKey ? addDays(startKey, i) : null;
    return {
      day: n,
      dateKey,
      scanned: !!dateKey && scanned.has(dateKey),
      isToday: started && n === day && !finished,
      isFuture: started ? n > day : true,
      isNext: started && !finished && !!dateKey && dateKey === next.dueKey && next.state !== 'complete',
    };
  });

  return {
    totalDays, started, day: Math.min(day, totalDays), finished,
    days, scanDays: days.filter((d) => d.scanned).length, scanCount: scans.length, next, todayKey,
  };
}

/** One short sentence about the next scan. */
export function nextScanText(next, locale) {
  switch (next.state) {
    case 'first': return 'Take your first scan to start your 30 days.';
    case 'done': return `Scanned today. Next scan around ${prettyDate(next.dueKey, locale)}.`;
    case 'due': return 'A scan is due today.';
    case 'overdue': return `Your scan is ${next.daysLate} day${next.daysLate === 1 ? '' : 's'} late. Scan when you can.`;
    case 'complete': return 'Your 30 days are up. Compare your first and latest scan on the Progress screen.';
    default: return `Next scan ${next.daysUntil === 1 ? 'tomorrow' : `in ${next.daysUntil} days`}, around ${prettyDate(next.dueKey, locale)}.`;
  }
}

// ── Comparing scans ──

const SCORES = [['acne_score', 'Acne'], ['redness_score', 'Redness'], ['dryness_score', 'Dryness']];
const r1 = (n) => Math.round(n * 10) / 10;

/** The newest scan before `current`, or null. scans can be in any order. */
export function findPrevious(scans = [], current) {
  if (!current) return null;
  const at = new Date(current.created_at).getTime();
  const earlier = scans.filter((s) => s.id !== current.id && new Date(s.created_at).getTime() < at);
  return earlier.length ? earlier.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b)) : null;
}

/** The oldest scan in the list, or null. */
export function findFirst(scans = []) {
  return scans.length ? scans.reduce((a, b) => (new Date(a.created_at) < new Date(b.created_at) ? a : b)) : null;
}

/**
 * Describes how three photo-based estimates moved from `before` to `after`. Lower is better for all three.
 * direction is 'lower', 'higher' or 'same' (a change under 0.5 is treated as noise). This describes; it never explains why.
 */
export function compareScans(before, after) {
  return SCORES.map(([key, label]) => {
    const delta = r1(after[key] - before[key]);
    const direction = Math.abs(delta) < SAME_BELOW ? 'same' : delta < 0 ? 'lower' : 'higher';
    return { key, label, before: before[key], after: after[key], delta, direction };
  });
}
