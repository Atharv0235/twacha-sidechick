import React, { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Video, RefreshCw, Sun, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAppData } from '../../state/AppData';
import { checkPhoto } from '../../api/photoCheck';
import { THEMES, cardStyle, primaryBtn, ghostBtn, BAD, GOOD, WARN } from './ui';

const TIPS = ['Use daylight or face a window', 'Whole face in the frame, looking at the camera', 'No filters, and hair off your forehead'];

export default function ScanCapture({ onResult, theme = 'light' }) {
  const t = THEMES[theme];
  const { runScan } = useAppData();
  const [blob, setBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false);
  const [check, setCheck] = useState(null);      // { issues: [{id, text}] } once the photo has been looked at
  const checkId = useRef(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const takeRef = useRef(null);
  const pickRef = useRef(null);
  const canLive = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const stopLive = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setLive(false);
  };
  useEffect(() => () => streamRef.current?.getTracks().forEach((tr) => tr.stop()), []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const setPhoto = (b) => {
    setPreviewUrl(b ? URL.createObjectURL(b) : null);
    setBlob(b);
    setError(null);
    setCheck(null);
    const id = ++checkId.current;                                  // ignore a result that arrives after the photo changed
    if (b) checkPhoto(b).then((r) => { if (id === checkId.current) setCheck(r); });
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) { stopLive(); setPhoto(f); }
  };

  const startLive = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setLive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      });
    } catch {
      setError('Live camera is not available here. Use "Take a photo" or "Choose a photo" instead.');
    }
  };

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob((b) => { if (b) { stopLive(); setPhoto(b); } }, 'image/jpeg', 0.92);
  };

  const analyse = async () => {
    if (!blob || busy) return;
    setBusy(true); setError(null);
    try {
      const result = await runScan(blob);
      setPhoto(null);
      onResult?.(result);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: t.text }}>
      <input ref={takeRef} type="file" accept="image/*" capture="user" onChange={onFile} style={{ display: 'none' }} />
      <input ref={pickRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />

      {!blob && !live && (
        <div style={cardStyle(t)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '14px', marginBottom: '8px' }}>
            <Sun size={16} color={t.accent} /> For a better reading
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: 1.7, color: t.muted }}>
            {TIPS.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
      )}

      {live && (
        <div style={{ ...cardStyle(t), padding: '10px' }}>
          <div style={{ position: 'relative' }}>
            <video ref={videoRef} playsInline muted style={{ width: '100%', display: 'block', borderRadius: '14px', transform: 'scaleX(-1)', backgroundColor: '#000' }} />
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: '58%', height: '82%', border: '2px dashed rgba(255,255,255,0.85)', borderRadius: '50%', boxShadow: '0 0 0 9999px rgba(0,0,0,0.28)' }} />
            </div>
            <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: '8px', textAlign: 'center', fontSize: '11px', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              Fit your face inside the oval
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'center' }}>
            <button style={primaryBtn(t)} onClick={snap}><Camera size={16} /> Capture</button>
            <button style={ghostBtn(t)} onClick={stopLive}>Cancel</button>
          </div>
        </div>
      )}

      {blob && previewUrl && (
        <div style={{ ...cardStyle(t), padding: '10px', textAlign: 'center' }}>
          <img src={previewUrl} alt="Your photo preview" style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '14px' }} />
          {check && check.issues.length > 0 && (
            <div role="status" style={{ marginTop: '12px', textAlign: 'left', border: `1px solid ${WARN}`, borderRadius: '14px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: WARN, marginBottom: '4px' }}>
                <AlertTriangle size={14} /> A new photo may give a better reading
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', lineHeight: 1.6, color: t.muted }}>
                {check.issues.map((i) => <li key={i.id}>{i.text}</li>)}
              </ul>
            </div>
          )}
          {check && check.issues.length === 0 && (
            <div role="status" style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '12px', color: GOOD, fontWeight: '700' }}>
              <CheckCircle2 size={14} /> Light and sharpness look fine
            </div>
          )}
          {(() => {
            const warned = !!check && check.issues.length > 0;
            const analyseBtn = (
              <button key="go" style={warned ? ghostBtn(t) : primaryBtn(t, busy)} disabled={busy} onClick={analyse}>
                {busy ? <><RefreshCw size={16} /> Analysing...</> : (warned ? 'Use this photo anyway' : 'Analyse this photo')}
              </button>
            );
            const retakeBtn = (
              <button key="redo" style={warned ? primaryBtn(t, busy) : ghostBtn(t)} disabled={busy} onClick={() => setPhoto(null)}>Retake</button>
            );
            return (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {warned ? [retakeBtn, analyseBtn] : [analyseBtn, retakeBtn]}
              </div>
            );
          })()}
          {busy && (
            <p style={{ fontSize: '12px', color: t.muted, marginTop: '10px', lineHeight: 1.5 }}>
              The first scan can take up to a minute while the free server wakes up.
            </p>
          )}
        </div>
      )}

      {error && (
        <div role="alert" style={{ ...cardStyle(t), borderColor: BAD, fontSize: '13px', lineHeight: 1.5 }}>
          <strong style={{ color: BAD }}>Could not scan: </strong>{error}
        </div>
      )}

      {!blob && !live && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button style={primaryBtn(t)} onClick={() => takeRef.current?.click()}><Camera size={16} /> Take a photo</button>
          <button style={ghostBtn(t)} onClick={() => pickRef.current?.click()}><ImageIcon size={16} /> Choose a photo</button>
          {canLive && <button style={ghostBtn(t)} onClick={startLive}><Video size={16} /> Live camera</button>}
        </div>
      )}
      <p style={{ fontSize: '11px', color: t.faint, lineHeight: 1.5 }}>
        Your photo is sent to the Twacha server, analysed in memory and not saved there.
      </p>
    </div>
  );
}
