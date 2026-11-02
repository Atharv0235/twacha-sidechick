// Shared colours and small style helpers for the app screens.
export const THEMES = {
  light: {
    text: '#19231c', muted: '#5e6d64', faint: '#88938a', card: '#ffffff', cardBorder: '#e9e4d8',
    soft: '#f6f5f1', accent: '#ff6b00', ink: '#19231c', onInk: '#ffffff', track: '#ece8dc'
  },
  dark: {
    text: '#ffffff', muted: 'rgba(255,255,255,0.72)', faint: 'rgba(255,255,255,0.5)',
    card: 'rgba(255,255,255,0.06)', cardBorder: 'rgba(255,255,255,0.12)',
    soft: 'rgba(255,255,255,0.04)', accent: '#d9fb48', ink: '#d9fb48', onInk: '#0a1b12',
    track: 'rgba(255,255,255,0.14)'
  }
};

export const GOOD = '#10b981';
export const WARN = '#d97706';
export const BAD = '#dc2626';

export const scoreColor = (v) => (v < 3 ? GOOD : v < 6 ? WARN : BAD);
export const scoreWord = (v) => (v < 3 ? 'Low' : v < 6 ? 'Moderate' : 'High');

export const cardStyle = (t) => ({
  backgroundColor: t.card,
  border: `1px solid ${t.cardBorder}`,
  borderRadius: '20px',
  padding: '16px 16px'
});

export const primaryBtn = (t, disabled) => ({
  backgroundColor: t.ink, color: t.onInk, border: 'none', borderRadius: '9999px',
  padding: '12px 22px', fontSize: '14px', fontWeight: '700', cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.55 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
});

export const ghostBtn = (t) => ({
  backgroundColor: 'transparent', color: t.text, border: `1px solid ${t.cardBorder}`, borderRadius: '9999px',
  padding: '11px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
});

export function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}
