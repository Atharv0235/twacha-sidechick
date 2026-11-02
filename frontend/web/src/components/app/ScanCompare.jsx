import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { compareScans, findFirst, findPrevious } from '../../ScanTimeline';
import { cardStyle, formatDate, GOOD, WARN } from './ui';

const word = (r) => (r.direction === 'same' ? 'about the same' : `${Math.abs(r.delta).toFixed(1)} ${r.direction}`);
const tone = (r, t) => (r.direction === 'lower' ? GOOD : r.direction === 'higher' ? WARN : t.faint);

function Photo({ t, src, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <img src={src} alt={`${label} scan preview, stored on this phone only`}
        style={{ width: '84px', height: '84px', borderRadius: '16px', objectFit: 'cover', display: 'block', border: `1px solid ${t.cardBorder}` }} />
      <div style={{ fontSize: '10px', color: t.faint, marginTop: '4px' }}>{label}</div>
    </div>
  );
}

/**
 * "This scan next to an earlier one". Describes how the photo-based estimates moved; it never says why.
 * scans: the account's scans (any order). thumbs: previews kept on this phone, by scan id.
 */
export default function ScanCompare({ t, current, scans = [], thumbs = {}, cadence = 3 }) {
  const [pick, setPick] = useState('previous');
  const all = scans.some((s) => s.id === current.id) ? scans : [...scans, current];
  const previous = findPrevious(all, current);
  const first = findFirst(all);

  if (!previous) {
    return (
      <div style={{ ...cardStyle(t), fontSize: '13px', color: t.muted, lineHeight: 1.55 }}>
        <div style={{ fontSize: '13px', fontWeight: '800', color: t.text, marginBottom: '4px' }}>Compare with earlier scans</div>
        This is your first scan, so there is nothing to compare yet. Scan again in {cadence} days, in the same place and light, and the two
        will show up side by side here.
      </div>
    );
  }

  const options = [{ key: 'previous', title: 'Last scan', scan: previous }];
  if (first && first.id !== previous.id && first.id !== current.id) options.push({ key: 'first', title: 'First scan', scan: first });
  const chosen = options.find((o) => o.key === pick) || options[0];
  const base = chosen.scan;
  const rows = compareScans(base, current);
  const photos = [[base, 'Then'], [current, 'Now']].filter(([s]) => thumbs[s.id]);

  return (
    <div style={cardStyle(t)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '13px', fontWeight: '800' }}>Compared with your {chosen.title.toLowerCase()}</div>
        {options.length > 1 && (
          <div role="group" aria-label="Compare with" style={{ display: 'inline-flex', borderRadius: '9999px', border: `1px solid ${t.cardBorder}`, overflow: 'hidden' }}>
            {options.map((o) => (
              <button key={o.key} onClick={() => setPick(o.key)} aria-pressed={chosen.key === o.key} style={{
                border: 'none', padding: '5px 11px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                backgroundColor: chosen.key === o.key ? t.ink : 'transparent', color: chosen.key === o.key ? t.onInk : t.text,
              }}>{o.title}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: '12px', color: t.faint, margin: '2px 0 12px' }}>
        {formatDate(base.created_at)} · Day {base.day_number} <ArrowRight size={11} style={{ verticalAlign: '-1px' }} /> {formatDate(current.created_at)} · Day {current.day_number}
      </div>

      {photos.length > 0 && (
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '14px' }}>
          {photos.map(([s, label]) => <Photo key={label} t={t} src={thumbs[s.id]} label={label} />)}
        </div>
      )}

      <div role="table" aria-label="Change in estimates">
        {rows.map((r) => (
          <div role="row" key={r.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '7px 0', borderTop: `1px solid ${t.cardBorder}` }}>
            <span role="cell" style={{ fontSize: '13px', fontWeight: '700', minWidth: '66px' }}>{r.label}{r.key !== 'acne_score' && <span style={{ color: t.faint, fontWeight: 500 }}>*</span>}</span>
            <span role="cell" style={{ fontSize: '12px', color: t.muted, flex: 1, textAlign: 'center' }}>
              {r.before.toFixed(1)} <ArrowRight size={11} style={{ verticalAlign: '-1px' }} /> <strong style={{ color: t.text }}>{r.after.toFixed(1)}</strong>
            </span>
            <span role="cell" style={{ fontSize: '11px', fontWeight: '700', color: tone(r, t), minWidth: '88px', textAlign: 'right' }}>{word(r)}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '10px', color: t.faint, lineHeight: 1.5, margin: '10px 0 0' }}>
        *rough estimates. Lower is better. Changes under 0.5 are shown as about the same. These are changes in photo-based estimates:
        lighting, angle, distance, camera, makeup and time of day can all move them, and one comparison cannot tell you why a score changed.
      </p>
    </div>
  );
}
