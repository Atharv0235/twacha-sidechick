import React from 'react';
import { ArrowUpRight, Smartphone, Monitor } from 'lucide-react';

const link = {
  color: 'rgba(255, 255, 255, 0.82)',
  fontSize: '13px',
  fontWeight: '500',
  textDecoration: 'none'
};

export default function Navbar({ onOpenScan, viewMode, setViewMode, onNavigate }) {
  return (
    <header style={{
      backgroundColor: 'var(--c-forest-dark)',
      borderBottom: '1px solid var(--c-forest-border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(12px)'
    }}>
      <div className="container-custom" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '76px',
        gap: '16px'
      }}>
        <button
          onClick={() => onNavigate('web')}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '8px' }}
        >
          <span className="font-serif" style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '2px', color: '#ffffff' }}>
            TWACHA
          </span>
          <span style={{ fontSize: '11px', letterSpacing: '1px', color: 'var(--c-lime)', fontWeight: '700', opacity: 0.9 }}>
            PROTOTYPE
          </span>
        </button>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <a href="#how" style={link}>How it works</a>
          <a href="#limits" style={link}>Limitations</a>
          <a href="#team" style={link}>Team</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.08)',
            padding: '3px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            {[['web', 'Web', Monitor], ['app', 'App', Smartphone]].map(([mode, label, Icon]) => (
              <button
                key={mode}
                onClick={() => { if (mode === 'web') onNavigate('web'); setViewMode(mode); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  backgroundColor: viewMode === mode ? 'var(--c-lime)' : 'transparent',
                  color: viewMode === mode ? 'var(--c-forest-dark)' : 'rgba(255, 255, 255, 0.75)',
                  border: 'none', borderRadius: '9999px', padding: '5px 12px',
                  fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                }}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          <button onClick={onOpenScan} className="btn-lime-pill" style={{ padding: '10px 22px', fontSize: '13px' }}>
            <span>Try a scan</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
