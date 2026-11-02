import React from 'react';
import { THEMES } from './ui';

// Minimal SVG line chart for a 0-10 score over time. points: [{ label, value }] oldest first.
export default function LineChart({ points, theme = 'light', color = '#ff6b00', title = 'Acne score over time' }) {
  const t = THEMES[theme];
  const W = 320, H = 150, L = 28, R = 10, T = 12, B = 26;
  if (points.length < 2) {
    return <p style={{ fontSize: '13px', color: t.muted, lineHeight: 1.5 }}>Scan on at least two days to see a chart.</p>;
  }
  const x = (i) => L + (i * (W - L - R)) / (points.length - 1);
  const y = (v) => T + (1 - Math.max(0, Math.min(10, v)) / 10) * (H - T - B);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const step = Math.max(1, Math.ceil(points.length / 5));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} style={{ width: '100%', height: 'auto' }}>
      {[0, 5, 10].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={t.track} strokeWidth="1" />
          <text x={L - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill={t.faint}>{v}</text>
        </g>
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="3" fill={color} />
          {(i % step === 0 || i === points.length - 1) && (
            <text x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} fontSize="9" fill={t.faint}>{p.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}
