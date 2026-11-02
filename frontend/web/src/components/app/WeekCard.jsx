import React from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { useAppData } from '../../state/AppData';
import { THEMES, cardStyle, GOOD, WARN } from './ui';

const t = THEMES.light;

function dayLetters(firstDayIso) {
  const [y, m, d] = firstDayIso.split('-').map(Number);
  return Array.from({ length: 7 }, (_, i) => new Date(y, m - 1, d + i).toLocaleDateString(undefined, { weekday: 'narrow' }));
}

function DotRow({ label, days, letters, color }) {
  const count = days.filter(Boolean).length;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} aria-label={`${label} on ${count} of the last 7 days`}>
      <div style={{ width: '76px', fontSize: '11px', color: t.muted, fontWeight: '700' }}>{label}</div>
      <div style={{ display: 'flex', gap: '7px' }}>
        {days.map((on, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%', boxSizing: 'border-box',
              backgroundColor: on ? color : t.track, border: i === 6 ? `2px solid ${t.ink}` : 'none'
            }} />
            <div style={{ fontSize: '9px', color: t.faint, marginTop: '2px' }}>{letters[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// "lower" is good for every score in this app (0 = healthy), but one scan-week to the next is noisy, so we only describe it.
function MetricChip({ m }) {
  const Icon = m.direction === 'lower' ? ArrowDown : m.direction === 'higher' ? ArrowUp : Minus;
  const tone = m.direction === 'lower' ? GOOD : m.direction === 'higher' ? WARN : t.faint;
  return (
    <div style={{ flex: 1, backgroundColor: t.soft, borderRadius: '14px', padding: '9px 6px', textAlign: 'center' }}>
      <div style={{ fontSize: '17px', fontWeight: '800' }}>{m.this_week == null ? '–' : m.this_week.toFixed(1)}</div>
      <div style={{ fontSize: '11px', color: t.muted }}>{m.label}</div>
      <div style={{ fontSize: '10px', color: tone, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', minHeight: '14px' }}>
        {m.direction ? (
          <>
            <Icon size={10} />
            {m.direction === 'same' ? 'about the same' : `${Math.abs(m.change).toFixed(1)} ${m.direction}`}
          </>
        ) : <span style={{ color: t.faint }}>{m.this_week == null ? 'no scan' : 'no comparison'}</span>}
      </div>
    </div>
  );
}

export default function WeekCard() {
  const { week } = useAppData();
  if (!week) return null;
  const letters = dayLetters(week.first_day);
  const empty = week.scans_this_week === 0 && week.food_days === 0;

  return (
    <div style={cardStyle(t)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '800' }}>Your week</div>
        <div style={{ fontSize: '11px', color: t.faint }}>last 7 days</div>
      </div>

      {empty ? (
        <p style={{ fontSize: '13px', color: t.muted, lineHeight: 1.55, margin: 0 }}>
          Scan or log a meal and your week will show up here.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <DotRow label="Scanned" days={week.scan_days} letters={letters} color={t.accent} />
            <DotRow label="Logged food" days={week.log_days} letters={letters} color={GOOD} />
          </div>

          {week.scans_this_week > 0 && (
            <>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                {week.metrics.map((m) => <MetricChip key={m.key} m={m} />)}
              </div>
              <div style={{ fontSize: '10px', color: t.faint, marginTop: '6px' }}>
                Average this week, compared with last week. Lower is better.
              </div>
            </>
          )}

          <details style={{ marginTop: '10px' }}>
            <summary style={{ fontSize: '12px', cursor: 'pointer', color: t.muted }}>Details</summary>
            <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', lineHeight: 1.6, color: t.muted }}>
              {week.highlights.map((h) => <li key={h}>{h}</li>)}
            </ul>
            <p style={{ fontSize: '10px', color: t.faint, lineHeight: 1.5, margin: '8px 0 0' }}>{week.note}</p>
          </details>
        </>
      )}
    </div>
  );
}
