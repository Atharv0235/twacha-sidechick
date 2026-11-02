// Run:  node scripts/check-assistant.mjs      (from frontend/web)
// Checks the quick-answer assistant: topic matching, answers built from sample data, and the safety rules.
import assert from 'node:assert/strict';
import { INTENTS, matchIntent, answer, reply, FALLBACK, CRISIS_REPLY } from '../src/assistant.js';

const ids = (q) => matchIntent(q);
const flat = (a) => [...(a.text || []), ...(a.bullets || []), ...(a.more || []), a.small || ''].join(' ');

// ── topic matching ──
const cases = [
  ['How is my week going?', 'week'], ['give me a summary', 'week'],
  ['Why did my score change?', 'change'], ['my acne got worse', 'change'],
  ['What should I eat?', 'eat'], ['any food recommendations', 'eat'],
  ['How is my plan going?', 'plan'], ['what is my streak', 'plan'],
  ['Is the air a problem today?', 'air'], ['what is the AQI', 'air'],
  ['How do I take a good scan?', 'scan'], ['my photo is blurry', 'scan'],
  ['Is this a diagnosis?', 'medical'], ['which cream should i use', 'medical'], ['should I see a dermatologist', 'medical'],
  ['What happens to my photos?', 'photos'], ['is my data private', 'photos'],
  ['How do I delete my data?', 'delete'], ['delete my account', 'delete'],
];
for (const [q, want] of cases) assert.equal(ids(q), want, `"${q}" should match ${want}, got ${ids(q)}`);
for (const it of INTENTS) assert.equal(ids(it.label), it.id, `the chip "${it.label}" must match its own topic`);

// unknown or empty input never guesses
for (const q of ['', '   ', 'what is the capital of france', 'tell me a joke', 'asdf qwer', null, undefined]) {
  assert.equal(ids(q), null, `"${q}" should not match anything`);
  assert.deepEqual(reply(q, {}), FALLBACK);
}
assert.match(flat(FALLBACK), /not an AI/i);

// crisis wording gets a human reply, not the fallback
for (const q of ['I want to kill myself', 'thinking about suicide', 'i want to hurt myself']) assert.deepEqual(reply(q, {}), CRISIS_REPLY);
assert.match(flat(CRISIS_REPLY), /14416/);

// ── answers from data ──
const week = {
  highlights: ['You scanned on 3 days in the last 7 days.', 'You logged food on 2 of the last 7 days.'],
  note: 'Scores come from photos.', metrics: [{ key: 'acne', direction: 'lower' }],
};
assert.deepEqual(answer('week', { week }).text, week.highlights);
assert.match(flat(answer('week', { week: null })), /could not load/i);

const scan = (acne, redness, dryness, created_at) => ({ acne_score: acne, redness_score: redness, dryness_score: dryness, created_at });
assert.match(flat(answer('change', { history: { scans: [scan(5, 3, 4, '2026-10-20T10:00:00Z')] } })), /at least two scans/);
const ch = answer('change', { history: { scans: [scan(4.0, 3.1, 5.0, '2026-10-22T10:00:00Z'), scan(6.0, 3.0, 4.0, '2026-10-15T10:00:00Z')] }, week });
assert.match(ch.bullets[0], /Acne: 6\.0 on .*, 4\.0 on .*\(2 lower\)/);
assert.match(ch.bullets[1], /about the same/);
assert.match(ch.bullets[2], /1 higher/);
assert.match(flat(ch), /cannot tell you why/);
assert.doesNotMatch(flat(ch), /\b(because of|caused by|due to)\b/i);

assert.match(flat(answer('eat', { lastScan: null })), /Scan once/);
const rec = { title: 'Zinc', foods_to_add: [{ name: 'Pumpkin seeds' }, { name: 'Chickpeas' }, { name: 'Curd' }, { name: 'Ignored fourth' }] };
const eat = answer('eat', { lastScan: { recommendations: [rec] } });
assert.equal(eat.bullets[0], 'Zinc: Pumpkin seeds, Chickpeas and Curd');
assert.match(flat(eat), /not treatment/);
assert.match(flat(answer('eat', { lastScan: { recommendations: [] } })), /Nothing stood out/);

const item = (o) => ({ food: 'Curd', kind: 'try', target_days: 4, days_eaten: 2, met: false, eaten_today: false, ...o });
assert.match(flat(answer('plan', { plan: null })), /could not load/i);
assert.match(flat(answer('plan', { plan: { items: [] } })), /not added any foods/);
const pl = answer('plan', { plan: { items: [item({}), item({ food: 'Sugary drinks', kind: 'limit', target_days: 2, days_eaten: 3 })], goals_met: 0, goals_total: 2, logging_streak: 1 } });
assert.match(pl.text[0], /meeting 0 of 2 goals/);
assert.match(pl.text[0], /1 day in a row/);
assert.match(pl.bullets[0], /Curd: 2 of the last 7 days \(goal at least 4\), not there yet/);
assert.match(pl.bullets[1], /over the limit/);
assert.match(flat(pl), /Not ticked today yet: Curd\./);
assert.match(flat(pl), /does not show that any food changes your skin/);

assert.match(flat(answer('air', {})), /do not have an air quality reading/);
assert.match(flat(answer('air', { lastScan: { environment: { source: 'unavailable' } } })), /do not have an air quality reading/);
const air = answer('air', { lastScan: { environment: { source: 'live', local_aqi: 212, aqi_band: 'very_poor', city: 'Delhi' } } });
assert.match(air.text[0], /in Delhi was 212, which is very poor/);
assert.match(air.small, /aqicn\.org/);
assert.match(flat(answer('air', { lastScan: { environment: { source: 'demo', local_aqi: 90, aqi_band: 'moderate' } } })), /demo value/);

// safety wording: no diagnosis, no medicine advice, no promises
const medical = flat(answer('medical', {}));
assert.match(medical, /cannot diagnose/);
assert.match(medical, /doctor or dermatologist/);
for (const id of INTENTS.map((i) => i.id)) {
  const text = flat(answer(id, { week, plan: { items: [item({})], goals_met: 0, goals_total: 1, logging_streak: 0 }, history: { scans: [] }, lastScan: null }));
  assert.ok(!/\b(will cure|heals|guarantee|clinically proven)\b/i.test(text), `${id}: forbidden claim`);
  assert.ok(text.length > 20, `${id}: empty answer`);
  for (const a of answer(id, {}).actions || []) assert.ok(['scan', 'timeline', 'diet', 'about', 'home'].includes(a.tab), `${id}: bad action tab ${a.tab}`);
}

console.log(`assistant checks passed (${cases.length} phrasings, ${INTENTS.length} topics)`);
