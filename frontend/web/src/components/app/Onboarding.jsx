import React, { useState } from 'react';
import { useAppData } from '../../state/AppData';
import { DISCLAIMER } from '../../config';

const CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Kolkata', 'Chennai', 'Hyderabad', 'Bhopal', 'Jaipur', 'Lucknow'];

const input = {
  width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid #ded6c6',
  fontSize: '15px', backgroundColor: '#fff', color: '#19231c', outline: 'none'
};
const label = { fontSize: '12px', fontWeight: '700', color: '#5e6d64', marginBottom: '6px', display: 'block' };

export default function Onboarding({ onOpenLegal }) {
  const { setProfile } = useAppData();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [keepThumbnails, setKeepThumbnails] = useState(true);
  const [consent, setConsent] = useState(false);
  const ok = name.trim().length > 0 && consent;

  const submit = (e) => {
    e.preventDefault();
    if (!ok) return;
    setProfile({ name: name.trim(), city: city.trim(), keepThumbnails, consent: true });
  };

  return (
    <form onSubmit={submit} style={{
      flex: 1, backgroundColor: '#F8F4EC', padding: '36px 24px 28px', display: 'flex',
      flexDirection: 'column', gap: '16px', overflowY: 'auto', color: '#19231c'
    }}>
      <div>
        <div className="font-serif" style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '1px' }}>Welcome to Twacha</div>
        <p style={{ fontSize: '14px', color: '#5e6d64', lineHeight: 1.6, marginTop: '8px' }}>
          A class-project prototype that estimates visible skin measures from a photo and suggests foods to try. No account needed.
        </p>
      </div>

      <div>
        <label style={label} htmlFor="tw-name">First name</label>
        <input id="tw-name" style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" autoComplete="given-name" />
      </div>

      <div>
        <label style={label} htmlFor="tw-city">City for air quality (optional)</label>
        <input id="tw-city" style={input} value={city} onChange={(e) => setCity(e.target.value)} list="tw-cities" placeholder="e.g. Delhi" />
        <datalist id="tw-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
      </div>

      <label style={{ display: 'flex', gap: '10px', fontSize: '13px', lineHeight: 1.5, color: '#33433a' }}>
        <input type="checkbox" checked={keepThumbnails} onChange={(e) => setKeepThumbnails(e.target.checked)} style={{ marginTop: '3px' }} />
        <span>Keep a small preview of each photo on this phone for my timeline. It never leaves the phone and I can delete it any time.</span>
      </label>

      <label style={{ display: 'flex', gap: '10px', fontSize: '13px', lineHeight: 1.5, color: '#33433a' }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: '3px' }} />
        <span>
          I understand my photo is sent to the Twacha server for analysis and is not saved there, that my scores and food log are stored under an anonymous ID, and that this is not medical advice. I have read the{' '}
          <button type="button" onClick={() => onOpenLegal('privacy')} style={{ background: 'none', border: 'none', padding: 0, color: '#c85a32', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px' }}>privacy policy</button>.
        </span>
      </label>

      <button type="submit" disabled={!ok} style={{
        backgroundColor: '#19231c', color: '#fff', border: 'none', borderRadius: '9999px', padding: '14px',
        fontSize: '15px', fontWeight: '700', cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : 0.5
      }}>
        Get started
      </button>
      <p style={{ fontSize: '11px', color: '#88938a', textAlign: 'center' }}>{DISCLAIMER}</p>
    </form>
  );
}
