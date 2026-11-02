import React, { useState } from 'react';
import { useAppData } from '../../state/AppData';
import { THEMES, cardStyle, primaryBtn, ghostBtn, BAD, GOOD } from './ui';
import { DISCLAIMER, WAQI_CREDIT, CONTACT_EMAIL, TEAM } from '../../config';

const t = THEMES.light;

const LIMITS = [
  'The acne score comes from a small model (macro-F1 about 0.60 on 56 test images), so it makes mistakes.',
  'It was trained on clinic photos, mostly of East Asian patients. Selfies, darker skin tones, beards and moles can give wrong results. We have not validated it on any skin tone group.',
  'Redness and dryness are rough colour and texture estimates, not calibrated measurements.',
  'The link between a score and a food uses weights chosen by the team, and research on diet and acne is mixed.'
];

const field = { padding: '11px 14px', borderRadius: '14px', border: '1px solid #ded6c6', fontSize: '14px', backgroundColor: '#fff', width: '100%' };

function ChangePassword() {
  const { changePassword } = useAppData();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setMsg(null);
    try {
      await changePassword(current, next);
      setMsg({ ok: true, text: 'Password changed. Other devices are logged out.' });
      setCurrent(''); setNext(''); setOpen(false);
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: '14px', borderTop: `1px solid ${t.cardBorder}`, paddingTop: '12px' }}>
      {!open ? (
        <button style={ghostBtn(t)} onClick={() => { setOpen(true); setMsg(null); }}>Change password</button>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: t.muted }} htmlFor="cp-cur">Current password</label>
          <input id="cp-cur" type="password" style={field} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" maxLength={72} />
          <label style={{ fontSize: '12px', color: t.muted }} htmlFor="cp-new">New password (at least 8 characters)</label>
          <input id="cp-new" type="password" style={field} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" maxLength={72} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={primaryBtn(t, busy || !current || next.length < 8)} disabled={busy || !current || next.length < 8}>{busy ? 'Saving...' : 'Save password'}</button>
            <button type="button" style={ghostBtn(t)} disabled={busy} onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
      {msg && <p role="status" style={{ fontSize: '12px', color: msg.ok ? GOOD : BAD, marginTop: '8px' }}>{msg.text}</p>}
    </div>
  );
}

function DangerZone() {
  const { deleteMyData, deleteAccount } = useAppData();
  const [step, setStep] = useState(null);          // null | 'data' | 'account'
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const cancel = () => { setStep(null); setPassword(''); setError(null); };
  const wipeData = async () => {
    setBusy(true); setError(null);
    try { await deleteMyData(); setDone('Your scans, food log and plan were deleted.'); cancel(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const wipeAccount = async () => {
    setBusy(true); setError(null);
    try { await deleteAccount(password); } catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <div style={cardStyle(t)}>
      <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '6px' }}>Delete my data</div>
      <p style={{ fontSize: '12px', color: t.muted, lineHeight: 1.55, marginBottom: '10px' }}>
        You can clear your scans, food log and plan and keep your account, or delete the account and everything in it. Both also clear what is stored on this phone.
      </p>
      {step === null && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button style={ghostBtn(t)} onClick={() => { setStep('data'); setDone(null); }}>Delete scans and logs</button>
          <button style={ghostBtn(t)} onClick={() => { setStep('account'); setDone(null); }}>Delete my account</button>
        </div>
      )}
      {step === 'data' && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button style={{ ...primaryBtn(t, busy), backgroundColor: BAD, color: '#fff' }} disabled={busy} onClick={wipeData}>{busy ? 'Deleting...' : 'Yes, delete scans and logs'}</button>
          <button style={ghostBtn(t)} disabled={busy} onClick={cancel}>Cancel</button>
        </div>
      )}
      {step === 'account' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: t.muted }} htmlFor="da-pw">Enter your password to delete the account for good</label>
          <input id="da-pw" type="password" style={field} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" maxLength={72} />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button style={{ ...primaryBtn(t, busy || !password), backgroundColor: BAD, color: '#fff' }} disabled={busy || !password} onClick={wipeAccount}>{busy ? 'Deleting...' : 'Delete account'}</button>
            <button style={ghostBtn(t)} disabled={busy} onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}
      {error && <p role="alert" style={{ fontSize: '12px', color: BAD, marginTop: '8px' }}>{error}</p>}
      {done && <p role="status" style={{ fontSize: '12px', color: GOOD, marginTop: '8px' }}>{done}</p>}
    </div>
  );
}

export default function AboutTab({ onOpenLegal }) {
  const { profile, updateProfile, logOut, history } = useAppData();
  const [name, setName] = useState(profile?.name || '');
  const [city, setCity] = useState(profile?.city || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const scans = history?.scans || [];

  const save = async () => {
    if (!name.trim() || busy) return;
    setBusy(true); setError(null);
    try {
      await updateProfile({ name: name.trim(), city: city.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', color: t.text }}>
      <div className="font-serif" style={{ fontSize: '24px', fontWeight: '700' }}>About you and Twacha</div>

      <div style={cardStyle(t)}>
        <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '2px' }}>Your account</div>
        <div style={{ fontSize: '12px', color: t.muted, marginBottom: '10px', wordBreak: 'break-all' }}>{profile?.email}</div>
        <label style={{ fontSize: '12px', color: t.muted }} htmlFor="ab-name">First name</label>
        <input id="ab-name" style={{ ...field, margin: '4px 0 10px' }} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <label style={{ fontSize: '12px', color: t.muted }} htmlFor="ab-city">City (for air quality)</label>
        <input id="ab-city" style={{ ...field, margin: '4px 0 12px' }} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Delhi" maxLength={60} />
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button style={primaryBtn(t, !name.trim() || busy)} disabled={!name.trim() || busy} onClick={save}>{saved ? 'Saved' : busy ? 'Saving...' : 'Save'}</button>
          <button style={ghostBtn(t)} onClick={logOut}>Log out</button>
        </div>
        {error && <p role="alert" style={{ fontSize: '12px', color: BAD, marginTop: '8px' }}>{error}</p>}
        <div style={{ fontSize: '12px', color: t.muted, marginTop: '12px' }}>Scans so far: {scans.length}</div>
        <ChangePassword />
      </div>

      <div style={cardStyle(t)}>
        <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '8px' }}>What Twacha cannot do</div>
        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: 1.65, color: t.muted }}>
          {LIMITS.map((l) => <li key={l}>{l}</li>)}
        </ul>
        <p style={{ fontSize: '12px', color: t.faint, marginTop: '10px' }}>{DISCLAIMER}</p>
      </div>

      <div style={{ ...cardStyle(t), fontSize: '12px', lineHeight: 1.65, color: t.muted }}>
        <div style={{ fontWeight: '800', fontSize: '14px', color: t.text, marginBottom: '6px' }}>Data and credits</div>
        <div>{WAQI_CREDIT}.</div>
        <div>Food values: Indian Nutrient Databank (INDB).</div>
        <div>Acne model trained on the ACNE04 dataset.</div>
        {TEAM.length > 0 && <div>Built by {TEAM.map((m) => m.name).join(' and ')}.</div>}
        {CONTACT_EMAIL && <div>Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></div>}
        <div style={{ marginTop: '8px' }}>
          <button onClick={() => onOpenLegal('privacy')} style={{ background: 'none', border: 'none', padding: 0, color: t.accent, textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>Privacy policy</button>
          {' · '}
          <button onClick={() => onOpenLegal('terms')} style={{ background: 'none', border: 'none', padding: 0, color: t.accent, textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>Terms</button>
        </div>
      </div>

      <DangerZone />
    </div>
  );
}
