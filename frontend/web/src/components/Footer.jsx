import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { DISCLAIMER, WAQI_CREDIT, CONTACT_EMAIL } from '../config';

const linkBtn = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', textAlign: 'left'
};

export default function Footer({ onNavigate }) {
  return (
    <footer style={{
      backgroundColor: 'var(--c-forest-dark)', color: '#ffffff', padding: '56px 0 36px 0',
      borderTop: '1px solid var(--c-forest-border-subtle)'
    }}>
      <div className="container-custom">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '32px', paddingBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ maxWidth: '420px' }}>
            <div className="font-serif" style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '2px' }}>TWACHA</div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginTop: '10px', lineHeight: 1.6 }}>
              A skin and diet wellness tracker built as a student project. It estimates a few visible skin measures from a photo and suggests foods to try.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button style={linkBtn} onClick={() => onNavigate('privacy')}>Privacy Policy</button>
            <button style={linkBtn} onClick={() => onNavigate('terms')}>Terms of Use</button>
            {CONTACT_EMAIL && <a style={{ ...linkBtn, textDecoration: 'none' }} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>}
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '14px 18px',
          border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'flex-start', gap: '12px', margin: '28px 0 18px'
        }}>
          <ShieldAlert size={18} color="var(--c-lime)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>
            <strong>Medical disclaimer:</strong> {DISCLAIMER} Twacha is not a medical device and does not diagnose, treat or prevent any condition. If you are worried about your skin, please see a qualified doctor.
          </p>
        </div>

        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
          {WAQI_CREDIT}. Food data: Indian Nutrient Databank (INDB). Acne model trained on the ACNE04 dataset.
        </p>
      </div>
    </footer>
  );
}
