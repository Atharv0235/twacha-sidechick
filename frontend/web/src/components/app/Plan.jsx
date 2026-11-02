import React, { useState } from 'react';
import { Check, Minus, Plus, Flame } from 'lucide-react';
import { useAppData } from '../../state/AppData';
import { THEMES, cardStyle, primaryBtn, ghostBtn, GOOD, WARN, BAD } from './ui';

const t = THEMES.light;

function dayLetters(todayIso) {
  const [y, m, d] = todayIso.split('-').map(Number);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(y, m - 1, d - (6 - i));
    return date.toLocaleDateString(undefined, { weekday: 'narrow' });
  });
}

const goalText = (item) => (item.kind === 'try' ? `at least ${item.target_days}` : `at most ${item.target_days}`);
const statusText = (item) => (item.kind === 'try' ? (item.met ? 'Goal met' : 'Not yet') : (item.met ? 'Within limit' : 'Over limit'));
const statusColor = (item) => (item.met ? GOOD : item.kind === 'try' ? t.muted : BAD);

/** The "I ate it today" toggle used on Home and in the plan. */
function EatenToggle({ item }) {
  const { tickFood } = useAppData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const on = item.eaten_today;
  const accent = item.kind === 'try' ? GOOD : WARN;

  const toggle = async () => {
    if (busy) return;
    setBusy(true); setError(null);
    try { await tickFood(item.food, !on); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <button onClick={toggle} disabled={busy} aria-pressed={on} aria-label={`${item.food}: ate it today`} style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '9999px', padding: '7px 12px', fontSize: '12px', fontWeight: '700',
        cursor: busy ? 'wait' : 'pointer', border: `1px solid ${on ? accent : '#ded6c6'}`, backgroundColor: on ? accent : '#fff',
        color: on ? '#fff' : t.text, opacity: busy ? 0.6 : 1, whiteSpace: 'nowrap'
      }}>
        {on && <Check size={13} />}{on ? 'Ate today' : 'Ate today?'}
      </button>
      {error && <div role="alert" style={{ fontSize: '11px', color: BAD, marginTop: '4px' }}>{error}</div>}
    </div>
  );
}

function WeekDots({ item, today }) {
  const letters = dayLetters(today);
  const accent = item.kind === 'try' ? GOOD : WARN;
  return (
    <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }} aria-label={`Eaten on ${item.days_eaten} of the last 7 days`}>
      {item.last_7.map((on, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: on ? accent : t.track, border: i === 6 ? `2px solid ${t.ink}` : 'none', boxSizing: 'border-box' }} />
          <div style={{ fontSize: '9px', color: t.faint, marginTop: '2px' }}>{letters[i]}</div>
        </div>
      ))}
    </div>
  );
}

function Stepper({ item }) {
  const { setPlanTarget } = useAppData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const lo = item.kind === 'try' ? 1 : 0;
  const hi = item.kind === 'try' ? 7 : 6;
  const change = async (delta) => {
    const next = item.target_days + delta;
    if (busy || next < lo || next > hi) return;
    setBusy(true); setError(null);
    try { await setPlanTarget(item.id, next); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const btn = { width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ded6c6', backgroundColor: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: t.muted }}>
      Goal: {item.kind === 'try' ? 'at least' : 'at most'}
      <button style={btn} onClick={() => change(-1)} disabled={busy || item.target_days <= lo} aria-label="Fewer days"><Minus size={13} /></button>
      <strong style={{ color: t.text }}>{item.target_days}</strong>
      <button style={btn} onClick={() => change(1)} disabled={busy || item.target_days >= hi} aria-label="More days"><Plus size={13} /></button>
      days a week
      {error && <span role="alert" style={{ color: BAD }}>{error}</span>}
    </div>
  );
}

function PlanItemCard({ item, today }) {
  const { removeFromPlan } = useAppData();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const kindLabel = item.kind === 'try' ? 'Try' : 'Eat less';
  const kindColor = item.kind === 'try' ? GOOD : WARN;

  const remove = async () => {
    setBusy(true);
    try { await removeFromPlan(item.id); } catch { setBusy(false); setConfirm(false); }
  };

  return (
    <div style={cardStyle(t)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '800' }}>{item.food}</div>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#fff', backgroundColor: kindColor, borderRadius: '9999px', padding: '2px 8px' }}>{kindLabel}</span>
        </div>
        <EatenToggle item={item} />
      </div>
      <div style={{ fontSize: '12px', color: t.muted, marginTop: '10px' }}>
        Eaten on <strong style={{ color: t.text }}>{item.days_eaten}</strong> of the last 7 days · goal {goalText(item)} ·{' '}
        <strong style={{ color: statusColor(item) }}>{statusText(item)}</strong>
      </div>
      <WeekDots item={item} today={today} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <Stepper item={item} />
        {!confirm ? (
          <button style={{ ...ghostBtn(t), padding: '6px 12px', fontSize: '12px' }} onClick={() => setConfirm(true)}>Remove</button>
        ) : (
          <span style={{ display: 'inline-flex', gap: '6px' }}>
            <button style={{ ...primaryBtn(t, busy), padding: '6px 12px', fontSize: '12px', backgroundColor: BAD, color: '#fff' }} disabled={busy} onClick={remove}>Remove</button>
            <button style={{ ...ghostBtn(t), padding: '6px 12px', fontSize: '12px' }} disabled={busy} onClick={() => setConfirm(false)}>Keep</button>
          </span>
        )}
      </div>
    </div>
  );
}

function Streak({ n }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: t.muted }}>
      <Flame size={14} color={n > 0 ? t.accent : t.faint} />
      {n > 0 ? `Logging streak: ${n} day${n === 1 ? '' : 's'}` : 'No food logged yet today'}
    </span>
  );
}

/** Home screen: today's checklist. */
export function TodayCard({ go }) {
  const { plan, planError } = useAppData();
  if (!plan) {
    return planError ? <div style={{ ...cardStyle(t), fontSize: '13px' }}>Could not load your plan: {planError}</div> : null;
  }
  if (plan.items.length === 0) {
    return (
      <div style={cardStyle(t)}>
        <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '6px' }}>My plan</div>
        <p style={{ fontSize: '13px', color: t.muted, lineHeight: 1.55, marginBottom: '10px' }}>
          Pick a few foods from your scan result to follow. Tick them off each day and Twacha shows how your week is going.
        </p>
        <button style={{ ...ghostBtn(t), fontSize: '12px' }} onClick={() => go('scan')}>See my food ideas</button>
      </div>
    );
  }
  return (
    <div style={cardStyle(t)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: '800' }}>Today's plan</span>
        <span style={{ fontSize: '12px', color: t.muted }}>{plan.goals_met} of {plan.goals_total} weekly goals met</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {plan.items.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>{item.kind === 'limit' ? 'Less: ' : ''}{item.food}</div>
              <div style={{ fontSize: '11px', color: t.muted }}>{item.days_eaten} of 7 days · goal {goalText(item)}</div>
            </div>
            <EatenToggle item={item} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', gap: '8px', flexWrap: 'wrap' }}>
        <Streak n={plan.logging_streak} />
        <button onClick={() => go('diet')} style={{ background: 'none', border: 'none', color: t.accent, fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>Open my plan</button>
      </div>
    </div>
  );
}

/** Diet tab: the full plan with weekly progress. */
export function PlanManager({ go }) {
  const { plan, planError, refreshPlan } = useAppData();

  if (!plan) {
    return (
      <div style={{ ...cardStyle(t), fontSize: '13px', color: t.muted }}>
        {planError ? <>Could not load your plan: {planError}{' '}
          <button onClick={refreshPlan} style={{ background: 'none', border: 'none', color: t.accent, fontWeight: '700', cursor: 'pointer' }}>Retry</button></> : 'Loading your plan...'}
      </div>
    );
  }
  const change = plan.scan_change;

  return (
    <>
      <p style={{ fontSize: '12px', color: t.muted, lineHeight: 1.5 }}>
        Foods you chose to follow. Tick "Ate today" and your food log updates. The weekly goals count the last 7 days. These are ideas to try, not treatment.
      </p>

      {plan.items.length === 0 ? (
        <div style={{ ...cardStyle(t), textAlign: 'center', fontSize: '14px', color: t.muted, lineHeight: 1.55 }}>
          Your plan is empty. Open a scan result and tap "+ Plan" next to a food.{' '}
          <button onClick={() => go('scan')} style={{ background: 'none', border: 'none', color: t.accent, fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Go to my result</button>
        </div>
      ) : (
        <>
          <div style={cardStyle(t)}>
            <div style={{ fontSize: '13px', fontWeight: '800' }}>This week</div>
            <div style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0' }}>
              {plan.goals_met} <span style={{ fontSize: '14px', fontWeight: '600', color: t.muted }}>of {plan.goals_total} goals met</span>
            </div>
            <Streak n={plan.logging_streak} />
            {change && (
              <p style={{ fontSize: '12px', color: t.muted, lineHeight: 1.55, marginTop: '10px' }}>
                Acne score {change.from_score.toFixed(1)} to {change.to_score.toFixed(1)} over {change.days} days
                (first and latest scan in the last 2 weeks, {change.scans} scans). {plan.note}
              </p>
            )}
          </div>
          {plan.items.map((item) => <PlanItemCard key={item.id} item={item} today={plan.today} />)}
          <p style={{ fontSize: '11px', color: t.faint }}>
            {plan.items.length} of {plan.max_items} foods in your plan.
          </p>
        </>
      )}
    </>
  );
}

/** Small "+ Plan" button used next to a food in a scan result. */
export function PlanButton({ food, kind }) {
  const { plan, addToPlan } = useAppData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inPlan = plan?.items?.some((i) => i.food === food);

  if (!plan) return null;
  const add = async () => {
    if (busy || inPlan) return;
    setBusy(true); setError(null);
    try { await addToPlan(food, kind); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return (
    <span style={{ marginLeft: '8px', whiteSpace: 'nowrap' }}>
      <button onClick={add} disabled={busy || inPlan} aria-label={inPlan ? `${food} is in your plan` : `Add ${food} to my plan`} style={{
        fontSize: '11px', fontWeight: '700', borderRadius: '9999px', padding: '3px 10px', cursor: inPlan ? 'default' : 'pointer',
        border: `1px solid ${inPlan ? GOOD : '#ded6c6'}`, backgroundColor: inPlan ? '#e7f6ef' : '#fff', color: inPlan ? '#0b6b4b' : t.text
      }}>
        {inPlan ? 'In plan' : busy ? '...' : '+ Plan'}
      </button>
      {error && <div role="alert" style={{ fontSize: '11px', color: BAD, whiteSpace: 'normal' }}>{error}</div>}
    </span>
  );
}
