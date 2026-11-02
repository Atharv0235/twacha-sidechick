// Run:  node scripts/check-journey.mjs      (from frontend/web)
// Checks the 30-day journey, the 3/4-day scan rhythm, scan comparisons and the in-app reminders.
process.env.TZ = 'Asia/Calcutta';
import assert from 'node:assert/strict';
const { buildJourney, nextScanText, compareScans, findPrevious, findFirst, localDateKey, addDays, daysBetween } = await import('../src/ScanTimeline.js');
const { buildNotifications, unreadCount } = await import('../src/notifications.js');

// local time, so the checks are the same wherever they run
const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0, 0);
const scan = (id, when, a = 5, r = 4, dr = 3) => ({ id, created_at: when.toISOString(), acne_score: a, redness_score: r, dryness_score: dr });
const program = { start_date: '2026-10-01', total_days: 30 };

// ── dates ──
assert.equal(localDateKey(at(2026, 10, 5, 23)), '2026-10-05');
assert.equal(localDateKey('not a date'), null);
assert.equal(addDays('2026-10-30', 3), '2026-11-02');
assert.equal(addDays('2026-12-30', 3), '2027-01-02');
assert.equal(daysBetween('2026-10-01', '2026-10-31'), 30);
// 23:30 UTC on 4 Oct is already 5 Oct in India
assert.equal(localDateKey('2026-10-04T23:30:00Z'), '2026-10-05');

// ── no scans yet ──
let j = buildJourney({ scans: [], program: null, now: at(2026, 10, 5) });
assert.equal(j.started, false);
assert.equal(j.next.state, 'first');
assert.equal(j.days.length, 30);
assert.ok(j.days.every((d) => !d.scanned && !d.isToday));
assert.match(nextScanText(j.next), /first scan/i);

// ── the rhythm: 3 days (default) and 4 days ──
const scans = [scan(2, at(2026, 10, 4)), scan(1, at(2026, 10, 1))];
j = buildJourney({ scans, program, now: at(2026, 10, 5) });
assert.equal(j.day, 5);
assert.equal(j.next.cadence, 3);
assert.equal(j.next.dueKey, '2026-10-07');
assert.equal(j.next.state, 'upcoming');
assert.equal(j.next.daysUntil, 2);
assert.match(nextScanText(j.next), /in 2 days/);
assert.equal(j.scanDays, 2);
assert.equal(j.days[0].scanned, true);
assert.equal(j.days[3].scanned, true);
assert.equal(j.days[4].isToday, true);
assert.equal(j.days[6].isNext, true);

j = buildJourney({ scans, program, cadence: 4, now: at(2026, 10, 5) });
assert.equal(j.next.dueKey, '2026-10-08');
assert.equal(j.next.daysUntil, 3);
assert.equal(buildJourney({ scans, program, cadence: 7, now: at(2026, 10, 5) }).next.cadence, 3, 'only 3 or 4 are allowed');

assert.equal(buildJourney({ scans, program, now: at(2026, 10, 4) }).next.state, 'done');
assert.match(nextScanText(buildJourney({ scans, program, now: at(2026, 10, 4) }).next), /Scanned today/);
assert.equal(buildJourney({ scans, program, now: at(2026, 10, 7) }).next.state, 'due');
assert.equal(buildJourney({ scans, program, now: at(2026, 10, 6) }).next.daysUntil, 1);
assert.match(nextScanText(buildJourney({ scans, program, now: at(2026, 10, 6) }).next), /tomorrow/);
j = buildJourney({ scans, program, now: at(2026, 10, 10) });
assert.equal(j.next.state, 'overdue');
assert.equal(j.next.daysLate, 3);
assert.match(nextScanText(j.next), /3 days late/);

// the unsorted case: the newest scan wins whatever order the list is in
assert.equal(buildJourney({ scans: [...scans].reverse(), program, now: at(2026, 10, 5) }).next.dueKey, '2026-10-07');

// ── the end of the 30 days ──
j = buildJourney({ scans, program, now: at(2026, 10, 30) });
assert.equal(j.day, 30);
assert.equal(j.finished, false);
j = buildJourney({ scans, program, now: at(2026, 10, 31) });
assert.equal(j.finished, true);
assert.equal(j.day, 30);
assert.equal(j.next.state, 'complete');
assert.ok(j.days.every((d) => !d.isToday));

// ── comparing scans ──
const a = scan(1, at(2026, 10, 1), 6.0, 4.0, 3.0);
const b = scan(2, at(2026, 10, 4), 4.9, 4.2, 3.8);
const rows = compareScans(a, b);
assert.deepEqual(rows.map((r) => [r.key, r.direction, r.delta]), [['acne_score', 'lower', -1.1], ['redness_score', 'same', 0.2], ['dryness_score', 'higher', 0.8]]);
assert.equal(compareScans(a, scan(3, at(2026, 10, 9), 6.4, 4.0, 2.6))[0].direction, 'same', 'a change under 0.5 is noise');
assert.equal(compareScans(a, scan(3, at(2026, 10, 9), 6.5, 4.0, 2.6))[0].direction, 'higher', '0.5 or more counts');
const c = scan(3, at(2026, 10, 9));
assert.equal(findPrevious([c, b, a], c).id, 2);
assert.equal(findPrevious([c, b, a], b).id, 1);
assert.equal(findPrevious([c, b, a], a), null);
assert.equal(findPrevious([a], a), null);
assert.equal(findFirst([c, b, a]).id, 1);
assert.equal(findFirst([]), null);

// ── reminders ──
const ids = (items) => items.map((i) => i.id.split(':')[0]);
const today = at(2026, 10, 7);
let notes = buildNotifications({ history: { program, scans }, plan: { items: [], logging_streak: 0 }, week: { log_days: Array(7).fill(false) }, now: today });
assert.deepEqual(ids(notes), ['scan-due']);
assert.equal(notes[0].tab, 'scan');

notes = buildNotifications({ history: { program, scans }, plan: null, week: null, now: at(2026, 10, 6) });
assert.deepEqual(ids(notes), ['scan-soon']);
notes = buildNotifications({ history: { program, scans }, plan: null, week: null, now: at(2026, 10, 5) });
assert.deepEqual(ids(notes), [], 'two days ahead: no reminder yet');
notes = buildNotifications({ history: { program, scans }, plan: null, week: null, now: at(2026, 10, 12) });
assert.deepEqual(ids(notes), ['scan-overdue']);
assert.match(notes[0].body, /no penalty/);
notes = buildNotifications({ history: null, plan: null, week: null, now: today });
assert.deepEqual(ids(notes), ['scan-first']);
notes = buildNotifications({ history: { program, scans }, plan: null, week: null, now: at(2026, 10, 31) });
assert.deepEqual(ids(notes), ['journey-done']);

const plan = {
  logging_streak: 3,
  items: [
    { food: 'Curd', kind: 'try', met: false, eaten_today: false },
    { food: 'Walnuts', kind: 'try', met: true, eaten_today: false },
    { food: 'Sugary tea', kind: 'limit', met: true, eaten_today: false },
    { food: 'Spinach', kind: 'try', met: false, eaten_today: true },
  ],
};
const week = { log_days: [true, true, true, false, false, false, false] };
notes = buildNotifications({ history: { program, scans }, plan, week, now: at(2026, 10, 5) });
assert.deepEqual(ids(notes), ['plan-todo', 'streak']);
assert.match(notes[0].body, /Curd\./, 'only the "try" food that is not ticked and not at goal');
assert.doesNotMatch(notes[0].body, /Walnuts|Sugary|Spinach/);
notes = buildNotifications({ history: { program, scans }, plan, week: { log_days: [false, false, false, false, false, false, true] }, now: at(2026, 10, 5) });
assert.deepEqual(ids(notes), ['plan-todo'], 'logged today: no streak reminder');

// ids change daily, so a repeated reminder is unread again tomorrow
const d1 = buildNotifications({ history: { program, scans }, plan: null, week: null, now: at(2026, 10, 7) });
const d2 = buildNotifications({ history: { program, scans }, plan: null, week: null, now: at(2026, 10, 8) });
assert.notEqual(d1[0].id, d2[0].id);
assert.equal(unreadCount(d1, []), 1);
assert.equal(unreadCount(d1, [d1[0].id]), 0);
assert.equal(unreadCount(d2, new Set([d1[0].id])), 1);

// wording rules: never promise outside notifications, never claim causes
for (const n of buildNotifications({ history: { program, scans }, plan, week, now: at(2026, 10, 31) })) {
  assert.doesNotMatch(`${n.title} ${n.body}`, /clinical|diagnos|cure|because of|caused|push notification/i, n.id);
}

console.log('journey checks passed');
