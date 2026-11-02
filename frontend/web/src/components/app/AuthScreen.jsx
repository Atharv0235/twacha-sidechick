import React, { useState } from 'react';
import { useAppData } from '../../state/AppData';
import { DISCLAIMER } from '../../config';
import { BAD } from './ui';

const CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Kolkata', 'Chennai', 'Hyderabad', 'Bhopal', 'Jaipur', 'Lucknow'];

const input = {
  width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid #ded6c6',
  fontSize: '15px', backgroundColor: '#fff', color: '#19231c', outline: 'none'
};
const label = { fontSize: '12px', fontWeight: '700', color: '#5e6d64', marginBottom: '6px', display: 'block' };
const linkBtn = { background: 'none', border: 'none', padding: 0, color: '#c85a32', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' };

/** Create an account or log in. `embedded` removes the full-height layout (used inside the website's dialog). */
export default function AuthScreen({ onOpenLegal, embedded = false }) {
  const { signUp, logIn, sessionMessage } = useAppData();
  const [mode, setMode] = useState('register');           // 'register' | 'login'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [city, setCity] = useState('');
  const [keep, setKeep] = useState(true);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const register = mode === 'register';
  const ready = email.trim() && password && (!register || (name.trim() && consent && password.length >= 8));

  const submit = async (e) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true); setError(null);
    try {
      if (register) await signUp({ email: email.trim(), password, name: name.trim(), city: city.trim(), keep });
      else await logIn(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(null); };

  return (
    <form onSubmit={submit} style={{
      flex: embedded ? undefined : 1, backgroundColor: '#F8F4EC', padding: embedded ? '24px' : '32px 24px 28px', display: 'flex',
      flexDirection: 'column', gap: '14px', overflowY: 'auto', color: '#19231c', borderRadius: embedded ? '20px' : 0
    }}>
      <div>
        <div className="font-serif" style={{ fontSize: '30px', fontWeight: '700', letterSpacing: '1px' }}>
          {register ? 'Create your account' : 'Welcome back'}
        </div>
        <p style={{ fontSize: '13px', color: '#5e6d64', lineHeight: 1.6, marginTop: '6px' }}>
          A class-project prototype that estimates visible skin measures from a photo and suggests foods to try. Your scans, plan and food log are saved to your account.
        </p>
      </div>

      {sessionMessage && !error && (
        <div role="status" style={{ fontSize: '13px', padding: '10px 12px', borderRadius: '12px', backgroundColor: '#fdf1dc', color: '#92400e' }}>{sessionMessage}</div>
      )}

      {register && (
        <div>
          <label style={label} htmlFor="tw-name">First name</label>
          <input id="tw-name" style={input} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Your first name" autoComplete="given-name" />
        </div>
      )}

      <div>
        <label style={label} htmlFor="tw-email">Email</label>
        <input id="tw-email" type="email" style={input} value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" autoComplete={register ? 'email' : 'username'} inputMode="email" autoCapitalize="none" />
      </div>

      <div>
        <label style={label} htmlFor="tw-pw">Password</label>
        <div style={{ position: 'relative' }}>
          <input id="tw-pw" type={showPw ? 'text' : 'password'} style={{ ...input, paddingRight: '64px' }} value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete={register ? 'new-password' : 'current-password'}
            placeholder={register ? 'At least 8 characters' : 'Your password'} maxLength={72} />
          <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}
            style={{ ...linkBtn, position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', textDecoration: 'none', fontWeight: '700' }}>
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>
        {register && (
          <p style={{ fontSize: '11px', color: '#88938a', marginTop: '6px', lineHeight: 1.5 }}>
            There is no "forgot password" yet, so pick one you will remember.
          </p>
        )}
      </div>

      {register && (
        <>
          <div>
            <label style={label} htmlFor="tw-city">City for air quality (optional)</label>
            <input id="tw-city" style={input} value={city} onChange={(e) => setCity(e.target.value)} list="tw-cities" placeholder="e.g. Delhi" maxLength={60} />
            <datalist id="tw-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
          </div>

          <label style={{ display: 'flex', gap: '10px', fontSize: '13px', lineHeight: 1.5, color: '#33433a' }}>
            <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} style={{ marginTop: '3px' }} />
            <span>Keep a small preview of each photo on this phone for my timeline. It never leaves the phone and I can delete it any time.</span>
          </label>

          <label style={{ display: 'flex', gap: '10px', fontSize: '13px', lineHeight: 1.5, color: '#33433a' }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: '3px' }} />
            <span>
              I understand my photo is sent to the Twacha server for analysis and is not saved there, that my email, scores, plan and food log are stored in my account, and that this is not medical advice. I have read the{' '}
              <button type="button" onClick={() => onOpenLegal?.('privacy')} style={{ ...linkBtn, fontSize: '13px' }}>privacy policy</button>.
            </span>
          </label>
        </>
      )}

      {error && <div role="alert" style={{ fontSize: '13px', color: BAD, lineHeight: 1.5 }}>{error}</div>}

      <button type="submit" disabled={!ready || busy} style={{
        backgroundColor: '#19231c', color: '#fff', border: 'none', borderRadius: '9999px', padding: '14px',
        fontSize: '15px', fontWeight: '700', cursor: ready && !busy ? 'pointer' : 'not-allowed', opacity: ready && !busy ? 1 : 0.5
      }}>
        {busy ? 'Please wait...' : register ? 'Create account' : 'Log in'}
      </button>
      {busy && <p style={{ fontSize: '12px', color: '#5e6d64', textAlign: 'center' }}>The first request can take up to a minute while the free server wakes up.</p>}

      <p style={{ fontSize: '13px', textAlign: 'center', color: '#33433a' }}>
        {register ? 'Already have an account? ' : 'New here? '}
        <button type="button" onClick={() => switchMode(register ? 'login' : 'register')} style={{ ...linkBtn, fontWeight: '700' }}>
          {register ? 'Log in' : 'Create an account'}
        </button>
      </p>
      <p style={{ fontSize: '11px', color: '#88938a', textAlign: 'center' }}>{DISCLAIMER}</p>
    </form>
  );
}
