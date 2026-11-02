import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { useAppData } from '../../state/AppData';
import { THEMES, cardStyle, primaryBtn, GOOD, WARN, BAD, formatDate } from './ui';
import { localDate } from '../../api/client';
import { PlanManager } from './Plan';

const t = THEMES.light;

function Segmented({ value, onChange, items }) {
  return (
    <div style={{ display: 'flex', backgroundColor: '#ece8dc', borderRadius: '9999px', padding: '4px', gap: '2px' }}>
      {items.map(([k, label]) => (
        <button key={k} onClick={() => onChange(k)} style={{
          flex: 1, border: 'none', borderRadius: '9999px', padding: '8px 6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
          backgroundColor: value === k ? t.ink : 'transparent', color: value === k ? '#fff' : t.muted
        }}>{label}</button>
      ))}
    </div>
  );
}

function FoodsToTry({ go }) {
  const { lastScan } = useAppData();
  const recs = lastScan?.recommendations || [];
  if (!recs.length) {
    return (
      <div style={{ ...cardStyle(t), textAlign: 'center', fontSize: '14px', color: t.muted, lineHeight: 1.55 }}>
        Food ideas appear after your first scan.{' '}
        <button onClick={() => go('scan')} style={{ background: 'none', border: 'none', color: t.accent, fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Scan now</button>
      </div>
    );
  }
  return (
    <>
      <p style={{ fontSize: '12px', color: t.muted, lineHeight: 1.5 }}>
        From your scan on {formatDate(lastScan.scan.created_at)}. These are ideas to try for about two weeks, not treatment.
      </p>
      {recs.map((r) => (
        <div key={r.nutrient_key} style={cardStyle(t)}>
          <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '8px' }}>{r.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {r.foods_to_add.map((f) => (
              <span key={f.name} style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '9999px', backgroundColor: '#e7f6ef', color: '#0b6b4b' }}>{f.name}</span>
            ))}
            {r.foods_to_reduce.map((f) => (
              <span key={f.name} style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '9999px', backgroundColor: '#fdf1dc', color: '#92400e' }}>less: {f.name}</span>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function FoodLog() {
  const { foodNames, foodLog, saveFoods } = useAppData();
  // Start from what is already saved for today (including foods ticked in "My plan"), so saving never wipes them.
  const todayFoods = useMemo(() => foodLog.find((l) => l.log_date === localDate())?.foods_eaten || [], [foodLog]);
  const [edited, setEdited] = useState(null);
  const selected = edited ?? todayFoods;
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const list = useMemo(() => foodNames.filter((n) => n.toLowerCase().includes(q.trim().toLowerCase())), [foodNames, q]);

  const toggle = (n) => setEdited((selected.includes(n) ? selected.filter((x) => x !== n) : [...selected, n]));

  const save = async () => {
    if (!selected.length || busy) return;
    setBusy(true); setMsg(null);
    try {
      await saveFoods(selected);
      setMsg({ ok: true, text: 'Saved. Your next scan will take this into account.' });
      setEdited(null);
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p style={{ fontSize: '12px', color: t.muted, lineHeight: 1.5 }}>
        Tap the foods you ate today (foods you ticked in My plan are already selected), then save. Foods from the last 3 days are not suggested to you as new.
      </p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search foods" aria-label="Search foods"
        style={{ padding: '11px 14px', borderRadius: '14px', border: '1px solid #ded6c6', fontSize: '14px', backgroundColor: '#fff' }} />
      {foodNames.length === 0 && <p style={{ fontSize: '13px', color: t.muted }}>Could not load the food list. Check your connection and reopen this tab.</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {list.map((n) => {
          const on = selected.includes(n);
          return (
            <button key={n} onClick={() => toggle(n)} aria-pressed={on} style={{
              fontSize: '12px', padding: '7px 12px', borderRadius: '9999px', cursor: 'pointer', display: 'inline-flex', gap: '4px', alignItems: 'center',
              border: `1px solid ${on ? GOOD : '#ded6c6'}`, backgroundColor: on ? '#e7f6ef' : '#fff', color: t.text
            }}>{on && <Check size={12} color={GOOD} />}{n}</button>
          );
        })}
      </div>
      <button style={primaryBtn(t, !selected.length || busy || edited === null)} disabled={!selected.length || busy || edited === null} onClick={save}>
        {busy ? 'Saving...' : `Save today's log${selected.length ? ` (${selected.length})` : ''}`}
      </button>
      {msg && <p role="status" style={{ fontSize: '13px', color: msg.ok ? GOOD : BAD }}>{msg.text}</p>}

      {foodLog.length > 0 && (
        <div style={cardStyle(t)}>
          <div style={{ fontWeight: '800', fontSize: '13px', marginBottom: '8px' }}>Recent days</div>
          {foodLog.map((l) => (
            <div key={l.id} style={{ fontSize: '12px', color: t.muted, lineHeight: 1.6, marginBottom: '4px' }}>
              <strong style={{ color: t.text }}>{formatDate(l.log_date)}:</strong> {l.foods_eaten.join(', ')}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const HABITS = [
  'Wash your face gently twice a day, and after sweating.',
  'Use a moisturiser that suits your skin type.',
  'Wear sunscreen (SPF 30 or higher) in the daytime.',
  'Do not pick or squeeze spots.',
  'Patch-test any new product on your inner arm for 24 hours first.'
];
const TRADITIONAL = [
  ['Turmeric (haldi)', 'Used in Indian home care for generations. Can stain the skin and cause allergy in some people.'],
  ['Aloe vera', 'Commonly used as a cooling gel. Patch-test first.'],
  ['Rose water', 'A traditional toner. Choose one without added fragrance if your skin is sensitive.'],
  ['Honey', 'Used in traditional masks. Avoid if you are allergic to bee products.']
];

function Skincare() {
  return (
    <>
      <div style={cardStyle(t)}>
        <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '8px' }}>General skin-care habits</div>
        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: 1.7, color: t.muted }}>
          {HABITS.map((h) => <li key={h}>{h}</li>)}
        </ul>
      </div>
      <div style={cardStyle(t)}>
        <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '4px' }}>Traditional home ingredients</div>
        <p style={{ fontSize: '11px', color: WARN, marginBottom: '8px' }}>Traditional use only. We have not tested these and they are not shown to treat acne.</p>
        {TRADITIONAL.map(([n, d]) => (
          <div key={n} style={{ fontSize: '13px', lineHeight: 1.55, marginBottom: '6px', color: t.muted }}>
            <strong style={{ color: t.text }}>{n}.</strong> {d}
          </div>
        ))}
      </div>
      <p style={{ fontSize: '11px', color: t.faint }}>General information, not medical advice. See a doctor for persistent or painful skin problems.</p>
    </>
  );
}

export default function DietTab({ go }) {
  const [view, setView] = useState('plan');
  return (
    <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', color: t.text }}>
      <div className="font-serif" style={{ fontSize: '24px', fontWeight: '700' }}>Diet and plan</div>
      <Segmented value={view} onChange={setView} items={[['plan', 'My plan'], ['foods', 'Ideas'], ['log', 'Food log'], ['skin', 'Skin care']]} />
      {view === 'plan' && <PlanManager go={go} />}
      {view === 'foods' && <FoodsToTry go={go} />}
      {view === 'log' && <FoodLog />}
      {view === 'skin' && <Skincare />}
    </div>
  );
}
