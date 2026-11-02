import React from 'react';
import { Camera, Wind, MessageCircle, CalendarClock } from 'lucide-react';
import { useAppData } from '../../state/AppData';
import { THEMES, cardStyle, primaryBtn, ghostBtn, scoreColor, scoreWord, formatDate } from './ui';
import { WAQI_CREDIT } from '../../config';
import { nextScanText } from '../../ScanTimeline';
import { TodayCard } from './Plan';
import WeekCard from './WeekCard';
import { DoodleCluster, DoodleEmpty } from './BotanicalDoodles';

const t = THEMES.light;

function Mini({ label, value }) {
  return (
    <div style={{ flex: 1, backgroundColor: t.soft, borderRadius: '14px', padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: '18px', fontWeight: '800', color: scoreColor(value) }}>{value.toFixed(1)}</div>
      <div style={{ fontSize: '11px', color: t.muted }}>{label}</div>
      <div style={{ fontSize: '10px', color: t.faint }}>{scoreWord(value)}</div>
    </div>
  );
}

/** One card for the whole picture: which day of the 30 it is, the latest scan, and when the next scan is suggested. */
function HeroCard({ go, latest, hasFullResult }) {
  const { journey: j } = useAppData();
  const pct = j.started ? Math.round((j.day / j.totalDays) * 100) : 0;
  const scanNow = ['first', 'due', 'overdue'].includes(j.next.state);
  const late = j.next.state === 'overdue';

  return (
    <div style={{ ...cardStyle(t), position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #fff8ec 0%, #ffffff 46%)' }}>
      <DoodleCluster variant="corner" opacity={0.4} />

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        {j.started ? (
          <>
            <span className="font-serif" style={{ fontSize: '30px', fontWeight: '700', lineHeight: 1 }}>Day {j.day}</span>
            <span style={{ fontSize: '13px', color: t.muted }}>of {j.totalDays}</span>
          </>
        ) : (
          <span className="font-serif" style={{ fontSize: '22px', fontWeight: '700' }}>Your 30 days</span>
        )}
      </div>
      <div style={{ fontSize: '12px', color: t.muted, marginTop: '4px', maxWidth: '230px' }}>
        {j.started ? `${j.scanCount} scan${j.scanCount === 1 ? '' : 's'} so far` : 'Start with your first scan'}
      </div>
      <div style={{ height: '8px', borderRadius: '9999px', backgroundColor: t.track, overflow: 'hidden', marginTop: '12px' }}
        role="progressbar" aria-label="Day of your 30-day journey" aria-valuemin={0} aria-valuemax={j.totalDays} aria-valuenow={j.started ? j.day : 0}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: t.accent }} />
      </div>

      {latest ? (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px' }}>
            Latest scan <span style={{ fontWeight: '500', color: t.faint }}>· {formatDate(latest.created_at)}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Mini label="Acne" value={latest.acne_score} />
            <Mini label="Redness*" value={latest.redness_score} />
            <Mini label="Dryness*" value={latest.dryness_score} />
          </div>
          <div style={{ fontSize: '11px', color: t.faint, marginTop: '8px' }}>*rough estimates. Lower is better.</div>
        </div>
      ) : (
        <div style={{ marginTop: '16px' }}>
          <DoodleEmpty name="avocado">
            <p style={{ fontSize: '13px', color: t.muted, lineHeight: 1.55, margin: 0 }}>
              No scans yet. Take a photo in daylight to get your first result and food ideas.
            </p>
          </DoodleEmpty>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${t.cardBorder}`, marginTop: '16px', paddingTop: '14px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }} data-testid="next-scan">
          <CalendarClock size={18} color={late ? '#d97706' : t.accent} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', color: t.faint, textTransform: 'uppercase' }}>Next scan</div>
            <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{nextScanText(j.next)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          {scanNow ? (
            <button onClick={() => go('scan')} style={{ ...primaryBtn(t), padding: '10px 18px', fontSize: '13px' }}><Camera size={16} /> Scan now</button>
          ) : (
            <button onClick={() => go('scan')} style={{ ...primaryBtn(t), padding: '10px 18px', fontSize: '13px' }}>
              {hasFullResult ? 'See full result' : 'New scan'}
            </button>
          )}
          {scanNow && hasFullResult && (
            <button onClick={() => go('scan')} style={{ ...ghostBtn(t), padding: '9px 16px', fontSize: '13px' }}>See last result</button>
          )}
          {j.started && <button onClick={() => go('timeline')} style={{ ...ghostBtn(t), padding: '9px 16px', fontSize: '13px' }}>My journey</button>}
        </div>
      </div>
    </div>
  );
}

export default function HomeTab({ go, onAsk }) {
  const { profile, lastScan, history, historyError, refreshHistory } = useAppData();
  const program = history?.program;
  const env = lastScan?.environment;
  const showAqi = env && env.source !== 'unavailable';
  // The newest scan: the full result saved on this phone, or the newest one the server knows (a new phone, or a scan made elsewhere).
  const saved = lastScan?.scan || null;
  const newest = history?.scans?.[0] || null;
  const latest = saved && newest ? (new Date(saved.created_at) >= new Date(newest.created_at) ? saved : newest) : (saved || newest);

  return (
    <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', color: t.text }}>
      <div>
        <div style={{ fontSize: '12px', color: t.faint }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div className="font-serif" style={{ fontSize: '26px', fontWeight: '700' }}>Hello, {profile?.name}</div>
      </div>

      {historyError && (
        <div style={{ ...cardStyle(t), fontSize: '13px', lineHeight: 1.5 }}>
          Could not load your history: {historyError}{' '}
          <button onClick={refreshHistory} style={{ background: 'none', border: 'none', color: t.accent, fontWeight: '700', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {program?.is_demo && (
        <div style={{ ...cardStyle(t), borderColor: '#d97706', fontSize: '12px', color: '#92400e' }}>
          Demo data: part of this history is synthetic and was added for a presentation.
        </div>
      )}

      <HeroCard go={go} latest={latest} hasFullResult={!!saved && latest?.id === saved.id} />

      <TodayCard go={go} />

      <WeekCard />

      {onAsk && (
        <button onClick={onAsk} style={{ ...cardStyle(t), display: 'flex', gap: '12px', alignItems: 'center', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
          <MessageCircle size={22} color={t.accent} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: t.text }}>Ask Twacha</span>
            <span style={{ display: 'block', fontSize: '12px', color: t.muted, lineHeight: 1.45 }}>Quick answers about your week, plan, scans and privacy.</span>
          </span>
        </button>
      )}

      {showAqi && (
        <div style={{ ...cardStyle(t), display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Wind size={22} color={t.accent} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700' }}>
              Air quality {env.local_aqi} · {env.aqi_band.replace('_', ' ')}{env.source === 'demo' ? ' (demo value)' : ''}
            </div>
            <div style={{ fontSize: '10px', color: t.faint }}>{WAQI_CREDIT}</div>
          </div>
        </div>
      )}
    </div>
  );
}
