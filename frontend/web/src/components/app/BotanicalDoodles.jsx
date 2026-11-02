import React from 'react';

// Small, soft, hand-drawn style plants and foods used as quiet decoration. All original drawings.
// They are hidden from screen readers and never carry information; the screen reads the same without them.

const INK = '#2f4a39';
const sw = { stroke: INK, strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };

function Face({ x, y, s = 1 }) {
  return (
    <g>
      <circle cx={x - 4 * s} cy={y} r={1.5 * s} fill={INK} />
      <circle cx={x + 4 * s} cy={y} r={1.5 * s} fill={INK} />
      <path d={`M${x - 3 * s} ${y + 4 * s}Q${x} ${y + 7 * s} ${x + 3 * s} ${y + 4 * s}`} fill="none" {...sw} strokeWidth={1.8} />
    </g>
  );
}

const ART = {
  leaf: (
    <g>
      <path d="M32 58C12 45 13 19 32 6C51 19 52 45 32 58Z" fill="#a8d5ae" {...sw} />
      <path d="M32 56V16M32 30L24 22M32 40L41 31M32 48L25 41" fill="none" {...sw} strokeWidth={1.8} />
    </g>
  ),
  sprig: (
    <g>
      <path d="M32 60C31 46 33 30 36 8" fill="none" {...sw} />
      <path d="M33 44C20 44 14 36 14 28C25 28 32 34 33 44Z" fill="#a8d5ae" {...sw} />
      <path d="M34 34C46 34 52 27 52 19C41 19 35 25 34 34Z" fill="#8fc49a" {...sw} />
      <path d="M36 18C30 15 28 10 29 5C35 6 38 11 36 18Z" fill="#a8d5ae" {...sw} />
    </g>
  ),
  avocado: (
    <g>
      <path d="M32 5C42 5 46 18 50 32C54 46 46 59 32 59C18 59 10 46 14 32C18 18 22 5 32 5Z" fill="#7fb98a" {...sw} />
      <path d="M32 11C39 11 42 21 45 32C48 43 42 53 32 53C22 53 16 43 19 32C22 21 25 11 32 11Z" fill="#e6efb5" {...sw} strokeWidth={1.8} />
      <circle cx="32" cy="38" r="9.5" fill="#b98a5e" {...sw} strokeWidth={1.8} />
      <Face x={32} y={37} s={0.9} />
    </g>
  ),
  lemon: (
    <g>
      <path d="M6 32C6 22 16 14 32 14C48 14 58 22 58 32C58 42 48 50 32 50C16 50 6 42 6 32Z" fill="#f6e27a" {...sw} />
      <path d="M58 32L62 31M6 32L2 33" fill="none" {...sw} />
      <path d="M40 14C42 8 48 6 53 8C52 13 47 16 40 14Z" fill="#a8d5ae" {...sw} strokeWidth={1.8} />
      <Face x={32} y={31} s={1} />
    </g>
  ),
  carrot: (
    <g>
      <path d="M44 22C50 28 18 62 10 58C6 50 38 16 44 22Z" fill="#f4a261" {...sw} />
      <path d="M28 38L33 42M21 47L26 50M35 29L39 33" fill="none" {...sw} strokeWidth={1.6} />
      <path d="M44 22C46 14 52 8 58 8C58 14 54 20 44 22ZM44 22C40 14 40 8 44 3C48 8 48 15 44 22ZM44 22C52 22 58 26 60 32C54 32 48 28 44 22Z" fill="#a8d5ae" {...sw} strokeWidth={1.8} />
    </g>
  ),
  drop: (
    <g>
      <path d="M32 6C42 20 50 30 50 40C50 51 42 58 32 58C22 58 14 51 14 40C14 30 22 20 32 6Z" fill="#b9dff0" {...sw} />
      <path d="M24 42C24 47 27 50 31 51" fill="none" {...sw} strokeWidth={1.8} />
    </g>
  ),
};

/** One doodle. name is one of: leaf, sprig, avocado, lemon, carrot, drop. rotate is in degrees. opacity keeps it quiet (default 0.5). */
export function Doodle({ name, size = 48, rotate = 0, opacity = 0.5, style }) {
  const art = ART[name];
  if (!art) return null;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false"
      style={{ opacity, transform: `rotate(${rotate}deg)`, pointerEvents: 'none', flexShrink: 0, ...style }}>
      {art}
    </svg>
  );
}

const CLUSTERS = {
  // top-right corner of a card
  corner: [['sprig', 50, 2, 8, 0], ['avocado', 38, 46, -10, 24]],
  // along the bottom edge of a card or sheet
  edge: [['lemon', 40, 8, 0, 6], ['leaf', 34, 56, 14, 0], ['carrot', 40, 112, -20, 8]],
};

/**
 * A few doodles tucked into a corner of a position:relative parent. Purely decorative.
 * variant "corner": top right. variant "edge": bottom right.
 */
export function DoodleCluster({ variant = 'corner', opacity = 0.45 }) {
  const items = CLUSTERS[variant] || CLUSTERS.corner;
  const base = variant === 'edge'
    ? { position: 'absolute', right: 6, bottom: 4, width: 170, height: 52 }
    : { position: 'absolute', right: 6, top: 4, width: 120, height: 70 };
  return (
    <div aria-hidden="true" style={{ ...base, pointerEvents: 'none', overflow: 'hidden' }}>
      {variant === 'edge'
        ? items.map(([name, size, left, rotate, top]) => (
          <Doodle key={name} name={name} size={size} rotate={rotate} opacity={opacity} style={{ position: 'absolute', left, top }} />
        ))
        : items.map(([name, size, right, rotate, top]) => (
          <Doodle key={name} name={name} size={size} rotate={rotate} opacity={opacity} style={{ position: 'absolute', right, top }} />
        ))}
    </div>
  );
}

/** A centred doodle with a short line, for empty screens. */
export function DoodleEmpty({ name = 'leaf', children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
      <Doodle name={name} size={56} opacity={0.7} />
      {children}
    </div>
  );
}
