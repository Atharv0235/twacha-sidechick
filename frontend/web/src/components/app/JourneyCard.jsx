import React from 'react';
import { CalendarClock } from 'lucide-react';
import { useAppData } from '../../state/AppData';
import { CADENCES, nextScanText, prettyDate } from '../../ScanTimeline';
import { THEMES, cardStyle, GOOD } from './ui';
import { DoodleCluster } from './BotanicalDoodles';

const t = THEMES.light;

/** One small circle per day of the 30. Filled = a scan that day. Ring = today. Dashed = the suggested next scan. */
function DayDot({ d }) {
  const label = `Day ${d.day}${d.dateKey ? `, ${prettyDate(d.dateKey)}` : ''}: ${d.scanned ? 'scanned' : d.isNext ? 'next scan suggested' : d.isFuture ? 'ahead' : 'no scan'}`;
  return (
    <div role="img" aria-label={label} title={label} style={{ textAlign: 'center' }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%', boxSizing: 'border-box', margin: '0 auto',
        backgroundColor: d.scanned ? GOOD : 'transparent',
        border: d.isToday ? `2px solid ${t.ink}` : d.isNext ? `2px dashed ${t.accent}` : d.scanned ? 'none' : `1.5px solid ${d.isFuture ? t.track : '#d9d3c4'}`,
      }} />
      <div style={{ fontSize: '9px', color: d.isToday ? t.ink : t.faint, fontWeight: d.isToday ? 800 : 400, marginTop: '2px' }}>{d.day}</div>
    </div>
  );
}

/** The 30-day journey and the 3 or 4 day scan rhythm (used on the Progress screen). */
export default function JourneyCard() {
  const { journey, cadence, setCadence } = useAppData();
  const j = journey;

  return (
    <div style={{ ...cardStyle(t), position: 'relative', overflow: 'hidden' }}>
      <DoodleCluster variant="corner" opacity={0.35} />
      <div style={{ fontSize: '13px', fontWeight: '800' }}>Your 30-day journey</div>
      <div style={{ fontSize: '12px', color: t.muted, marginTop: '2px', maxWidth: '230px' }}>
        {j.started ? `Day ${j.day} of ${j.totalDays} · scanned on ${j.scanDays} day${j.scanDays === 1 ? '' : 's'}` : 'Starts with your first scan'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '8px 4px', marginTop: '14px' }}>
        {j.days.map((d) => <DayDot key={d.day} d={d} />)}
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '10px', color: t.faint, marginTop: '10px' }}>
        <span><span style={{ color: GOOD }}>●</span> scanned</span>
        <span>◯ today</span>
        <span style={{ color: t.accent }}>◌ next scan</span>
      </div>

      <div style={{ borderTop: `1px solid ${t.cardBorder}`, marginTop: '14px', paddingTop: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <CalendarClock size={18} color={t.accent} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '13px', lineHeight: 1.5, color: t.text }}>{nextScanText(j.next)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: t.muted }}>Suggest a scan every</span>
          <div role="group" aria-label="Scan rhythm" style={{ display: 'inline-flex', borderRadius: '9999px', border: `1px solid ${t.cardBorder}`, overflow: 'hidden' }}>
            {CADENCES.map((c) => (
              <button key={c} onClick={() => setCadence(c)} aria-pressed={cadence === c} style={{
                border: 'none', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                backgroundColor: cadence === c ? t.ink : 'transparent', color: cadence === c ? t.onInk : t.text,
              }}>{c} days</button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: '10px', color: t.faint, lineHeight: 1.5, margin: '8px 0 0' }}>
          A few days apart gives a steadier picture than scanning every day, because light, angle and camera change the photo-based estimates.
          This is a suggestion, not a rule.
        </p>
      </div>
    </div>
  );
}
