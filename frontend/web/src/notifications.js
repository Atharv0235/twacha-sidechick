// In-app reminders. They are worked out on the phone from data the app already holds, and they only show inside the app
// (the bell). Twacha does not send push notifications, emails or texts. Pure functions only (see scripts/check-journey.mjs).
import { buildJourney } from './ScanTimeline.js';

const list = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

/**
 * Returns [{ id, kind, title, body, tab, cta }], most important first.
 * The id includes today's date, so a reminder that is still true tomorrow shows up again as unread.
 */
export function buildNotifications({ history, plan, week, cadence, now = new Date() } = {}) {
  const j = buildJourney({ scans: history?.scans || [], program: history?.program || null, cadence, now });
  const today = j.todayKey;
  const out = [];

  // Scan rhythm
  const n = j.next;
  if (n.state === 'first') {
    out.push({ id: `scan-first:${today}`, kind: 'scan', title: 'Take your first scan', tab: 'scan', cta: 'Scan now',
      body: 'Your 30 days start with one photo in daylight. It takes about a minute.' });
  } else if (n.state === 'due') {
    out.push({ id: `scan-due:${today}`, kind: 'scan', title: 'Scan day', tab: 'scan', cta: 'Scan now',
      body: `It has been ${n.cadence} days since your last scan. Scan in the same place and light as last time.` });
  } else if (n.state === 'overdue') {
    out.push({ id: `scan-overdue:${today}`, kind: 'scan', title: 'Your scan is late', tab: 'scan', cta: 'Scan now',
      body: `Your next scan was due ${n.daysLate} day${n.daysLate === 1 ? '' : 's'} ago. There is no penalty: scan when you can.` });
  } else if (n.state === 'upcoming' && n.daysUntil === 1) {
    out.push({ id: `scan-soon:${today}`, kind: 'scan', title: 'Scan tomorrow', tab: 'home', cta: 'Open Home',
      body: 'Your next scan is tomorrow. Try to use the same place and light.' });
  }

  // The end of the 30 days
  if (n.state === 'complete') {
    out.push({ id: `journey-done`, kind: 'journey', title: 'Your 30 days are up', tab: 'timeline', cta: 'See progress',
      body: 'Open Progress to compare your first and latest scan. The scores are photo-based estimates, so look at the overall direction, not single days.' });
  }

  // Plan: "try" foods that are not ticked today and not yet at their goal
  const todo = (plan?.items || []).filter((i) => i.kind === 'try' && !i.met && !i.eaten_today).map((i) => i.food);
  if (todo.length) {
    const shown = todo.slice(0, 3);
    out.push({ id: `plan-todo:${today}`, kind: 'plan', title: 'Foods to tick today', tab: 'diet', cta: 'Open my plan',
      body: `Not ticked yet today: ${list(shown)}${todo.length > shown.length ? ` and ${todo.length - shown.length} more` : ''}.` });
  }

  // Logging streak: only mention it when there is a streak to keep and nothing is logged today
  const streak = plan?.logging_streak || 0;
  const loggedToday = !!week?.log_days?.[week.log_days.length - 1];
  if (streak > 0 && week && !loggedToday) {
    out.push({ id: `streak:${today}`, kind: 'log', title: 'Keep your logging streak', tab: 'diet', cta: 'Log food',
      body: `You have logged food ${streak} day${streak === 1 ? '' : 's'} in a row. Nothing is logged today yet.` });
  }

  return out;
}

/** How many of these have not been read. readIds is an array or Set of ids. */
export function unreadCount(items, readIds) {
  const seen = readIds instanceof Set ? readIds : new Set(readIds || []);
  return items.filter((i) => !seen.has(i.id)).length;
}
