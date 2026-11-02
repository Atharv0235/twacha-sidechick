import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAppData } from '../../state/AppData';
import LineChart from './LineChart';
import JourneyCard from './JourneyCard';
import { DoodleEmpty } from './BotanicalDoodles';
import { THEMES, cardStyle, ghostBtn, scoreColor, formatDate, formatDateTime } from './ui';

const t = THEMES.light;

export default function TimelineTab({ go }) {
  const { history, historyError, thumbs, clearThumbs, refreshHistory } = useAppData();
  const [open, setOpen] = useState(null);
  const scans = history?.scans || [];
  const chronological = [...scans].reverse();
  const hasThumbs = Object.keys(thumbs).length > 0;

  return (
    <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', color: t.text }}>
      <div className="font-serif" style={{ fontSize: '24px', fontWeight: '700' }}>Your progress</div>

      {historyError && (
        <div style={{ ...cardStyle(t), fontSize: '13px' }}>
          Could not load history: {historyError}{' '}
          <button onClick={refreshHistory} style={{ background: 'none', border: 'none', color: t.accent, fontWeight: '700', cursor: 'pointer' }}>Retry</button>
        </div>
      )}
      {history?.program?.is_demo && (
        <div style={{ ...cardStyle(t), borderColor: '#d97706', fontSize: '12px', color: '#92400e' }}>
          Demo data: part of this history is synthetic and was added for a presentation.
        </div>
      )}

      {history && <JourneyCard />}

      {history && scans.length === 0 && (
        <div style={{ ...cardStyle(t), fontSize: '14px', color: t.muted, lineHeight: 1.55 }}>
          <DoodleEmpty name="sprig">
            <span>No scans yet.{' '}
              <button onClick={() => go('scan')} style={{ background: 'none', border: 'none', color: t.accent, fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Take your first scan</button>
            </span>
          </DoodleEmpty>
        </div>
      )}

      {scans.length > 0 && (
        <div style={cardStyle(t)}>
          <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '6px' }}>Acne score (lower is better)</div>
          {scans.length < 3 && (
            <p style={{ fontSize: '12px', color: t.muted, marginBottom: '6px' }}>A trend needs at least 3 scans.</p>
          )}
          <LineChart points={chronological.map((s) => ({ label: formatDate(s.created_at), value: s.acne_score }))} />
        </div>
      )}

      {scans.map((s) => {
        const isOpen = open === s.id;
        return (
          <div key={s.id} style={cardStyle(t)}>
            <button onClick={() => setOpen(isOpen ? null : s.id)} style={{
              width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: t.text,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left'
            }}>
              <span>
                <span style={{ fontWeight: '800', fontSize: '14px' }}>{formatDate(s.created_at)}</span>
                <span style={{ fontSize: '12px', color: t.faint }}> · Day {s.day_number}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                <strong style={{ color: scoreColor(s.acne_score) }}>{s.acne_score.toFixed(1)}</strong>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            {isOpen && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {thumbs[s.id] && <img src={thumbs[s.id]} alt="Preview of this scan, stored on this phone only" style={{ width: '72px', height: '72px', borderRadius: '14px', objectFit: 'cover' }} />}
                <div style={{ fontSize: '13px', lineHeight: 1.7, color: t.muted }}>
                  <div>{formatDateTime(s.created_at)}</div>
                  <div>Acne {s.acne_score.toFixed(1)} · Redness* {s.redness_score.toFixed(1)} · Dryness* {s.dryness_score.toFixed(1)}</div>
                  {s.local_aqi != null && <div>Air quality that day: {s.local_aqi}</div>}
                  <div style={{ fontSize: '11px', color: t.faint }}>*rough estimates</div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {hasThumbs && (
        <div style={{ ...cardStyle(t), fontSize: '12px', color: t.muted, lineHeight: 1.55 }}>
          Photo previews are stored only on this phone.
          <div style={{ marginTop: '8px' }}>
            <button style={ghostBtn(t)} onClick={clearThumbs}>Delete previews from this phone</button>
          </div>
        </div>
      )}
    </div>
  );
}
