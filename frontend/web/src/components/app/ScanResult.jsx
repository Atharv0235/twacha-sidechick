import React from 'react';
import { AlertCircle, Wind } from 'lucide-react';
import { THEMES, cardStyle, scoreColor, scoreWord, GOOD, WARN } from './ui';
import { DISCLAIMER, WAQI_CREDIT } from '../../config';
import { PlanButton } from './Plan';
import ScanCompare from './ScanCompare';

function ScoreRow({ t, label, note, value }) {
  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: t.text }}>
          {label} {note && <span style={{ fontSize: '11px', fontWeight: '500', color: t.faint }}>({note})</span>}
        </span>
        <span style={{ fontSize: '13px', color: t.muted }}>
          <strong style={{ color: scoreColor(value) }}>{scoreWord(value)}</strong> · {value.toFixed(1)} / 10
        </span>
      </div>
      <div style={{ height: '8px', borderRadius: '9999px', backgroundColor: t.track, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: scoreColor(value) }} />
      </div>
    </div>
  );
}

const TIER_LABEL = {
  clinical: 'Evidence: strong',
  mixed: 'Evidence: mixed',
  traditional: 'Traditional use'
};
const TREND_TEXT = {
  improving: 'Your acne score is trending down (improving).',
  flat: 'Your acne score is about the same as recently.',
  worsening: 'Your acne score is trending up.',
  insufficient_data: 'Not enough scans yet to show a trend (needs at least 3 earlier scans).'
};

/** compare (optional): { scans, thumbs, cadence }. When given, the result shows this scan next to earlier ones. */
export default function ScanResult({ result, theme = 'light', compare }) {
  const t = THEMES[theme];
  const { scan, environment, recommendations = [], quality_notes = [] } = result;
  const showAqi = environment && environment.source !== 'unavailable';
  const trend = recommendations[0]?.trend;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: t.text }}>
      {quality_notes.length > 0 && (
        <div style={{ ...cardStyle(t), borderColor: WARN, display: 'flex', gap: '10px' }}>
          <AlertCircle size={18} color={WARN} style={{ flexShrink: 0, marginTop: '2px' }} />
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', lineHeight: 1.55, color: t.muted }}>
            {quality_notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      )}

      <div style={cardStyle(t)}>
        <div style={{ fontSize: '12px', color: t.faint, marginBottom: '10px' }}>
          Day {scan.day_number} · lower is better
        </div>
        <ScoreRow t={t} label="Acne" value={scan.acne_score} />
        <ScoreRow t={t} label="Redness" note="rough estimate" value={scan.redness_score} />
        <ScoreRow t={t} label="Dryness" note="rough estimate" value={scan.dryness_score} />
        {trend && <p style={{ fontSize: '12px', color: t.muted, marginTop: '4px' }}>{TREND_TEXT[trend]}</p>}
      </div>

      {compare && <ScanCompare t={t} current={scan} scans={compare.scans} thumbs={compare.thumbs} cadence={compare.cadence} />}

      {showAqi && (
        <div style={{ ...cardStyle(t), display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Wind size={22} color={t.accent} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '700' }}>
              Air quality {environment.local_aqi} · {environment.aqi_band.replace('_', ' ')}
              {environment.source === 'demo' && (
                <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: WARN, color: '#fff' }}>DEMO VALUE</span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: t.muted }}>
              {environment.city ? `${environment.city} · ` : ''}main pollutant {environment.dominant_pollutant}
              {environment.source === 'demo' ? ' · not a live reading' : ''}
            </div>
            <div style={{ fontSize: '10px', color: t.faint, marginTop: '4px' }}>{WAQI_CREDIT}</div>
          </div>
        </div>
      )}

      <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '4px' }}>Foods to try</div>
      {recommendations.length === 0 && (
        <div style={{ ...cardStyle(t), fontSize: '13px', color: t.muted }}>
          Nothing stands out for these scores. Keep scanning every few days.
        </div>
      )}
      {recommendations.map((r) => (
        <div key={r.nutrient_key} style={cardStyle(t)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '15px', fontWeight: '800' }}>{r.title}</div>
            <span style={{
              fontSize: '10px', fontWeight: '700', padding: '3px 9px', borderRadius: '9999px', whiteSpace: 'nowrap',
              color: '#fff', backgroundColor: r.evidence_tier === 'clinical' ? GOOD : r.evidence_tier === 'mixed' ? WARN : '#8b5cf6'
            }}>
              {TIER_LABEL[r.evidence_tier] || r.evidence_tier}
            </span>
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.55, color: t.muted, margin: '8px 0' }}>{r.nutrient_explanation}</p>

          {r.foods_to_add.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.6px', color: GOOD, textTransform: 'uppercase' }}>Try adding</div>
              <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '13px', lineHeight: 1.5 }}>
                {r.foods_to_add.map((f) => (
                  <li key={f.name}>
                    <strong>{f.name}</strong>
                    <span style={{ color: t.muted }}> · {f.reason}</span>
                    {f.nutrient_value != null && (
                      <span style={{ color: t.faint, fontSize: '11px' }}> ({f.nutrient_value} {f.unit}{f.source ? `, ${f.source}` : ''})</span>
                    )}
                    <PlanButton food={f.name} kind="try" />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {r.foods_to_reduce.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.6px', color: WARN, textTransform: 'uppercase' }}>Try eating less of</div>
              <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '13px', lineHeight: 1.5 }}>
                {r.foods_to_reduce.map((f) => (
                  <li key={f.name}>
                    <strong>{f.name}</strong>
                    {f.logged_recently && <span style={{ color: WARN, fontSize: '11px' }}> · you logged this recently</span>}
                    <span style={{ color: t.muted }}> · {f.reason}</span>
                    <PlanButton food={f.name} kind="limit" />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {r.source_note && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ fontSize: '12px', cursor: 'pointer', color: t.muted }}>About the evidence</summary>
              <p style={{ fontSize: '12px', lineHeight: 1.55, color: t.muted, marginTop: '6px' }}>{r.source_note}</p>
            </details>
          )}
        </div>
      ))}

      <p style={{ fontSize: '11px', color: t.faint, lineHeight: 1.5, textAlign: 'center' }}>
        {result.prototype_notice || DISCLAIMER}
      </p>
    </div>
  );
}
