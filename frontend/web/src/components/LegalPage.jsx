import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function LegalPage({ title, updated, onBack, sections }) {
  return (
    <div style={{ backgroundColor: 'var(--c-cream-bg)', minHeight: '100vh', padding: '56px 0 96px' }}>
      <div className="container-custom" style={{ maxWidth: '820px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', border: '1px solid var(--c-cream-border)',
            borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--c-forest-dark)', cursor: 'pointer', marginBottom: '28px'
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <article style={{ backgroundColor: '#fff', borderRadius: '14px', padding: 'clamp(24px, 5vw, 48px)', border: '1px solid var(--c-cream-border)' }}>
          <h1 className="font-serif" style={{ fontSize: '34px', fontWeight: '700', color: 'var(--c-forest-dark)', marginBottom: '8px' }}>{title}</h1>
          <p style={{ fontSize: '13px', color: 'var(--c-cream-muted)', paddingBottom: '20px', borderBottom: '1px solid var(--c-cream-border)', marginBottom: '28px' }}>
            Last updated: {updated}. Twacha is a student class project.
          </p>
          {sections.map((s) => (
            <section key={s.heading} style={{ marginBottom: '26px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--c-forest-dark)', marginBottom: '10px' }}>{s.heading}</h2>
              {s.paragraphs?.map((p) => (
                <p key={p} style={{ fontSize: '15px', lineHeight: 1.7, color: '#33433a', marginBottom: '10px' }}>{p}</p>
              ))}
              {s.bullets && (
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px', lineHeight: 1.65, color: '#33433a' }}>
                  {s.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              )}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
