import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AppDataProvider, useAppData } from '../state/AppData';
import ScanCapture from './app/ScanCapture';
import AuthScreen from './app/AuthScreen';
import ScanResult from './app/ScanResult';
import { DISCLAIMER } from '../config';

function Body({ onClose, onOpenLegal }) {
  const { user } = useAppData();
  const [result, setResult] = useState(null);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(5, 16, 9, 0.88)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }} role="dialog" aria-modal="true" aria-label="Try a scan">
      <div style={{
        backgroundColor: '#0c2217', color: '#fff', borderRadius: '28px', width: '100%', maxWidth: '720px', maxHeight: '92vh',
        overflowY: 'auto', border: '1px solid rgba(255,255,255,0.16)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div className="font-serif" style={{ fontSize: '22px', fontWeight: '700' }}>Try a scan</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>{DISCLAIMER}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '24px 28px 32px' }}>
          {!user ? (
            <AuthScreen embedded onOpenLegal={onOpenLegal} />
          ) : result ? (
            <>
              <ScanResult result={result} theme="dark" />
              <button className="btn-white-pill" onClick={() => setResult(null)} style={{ marginTop: '16px' }}>Scan another photo</button>
            </>
          ) : (
            <ScanCapture theme="dark" onResult={setResult} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScanStudioModal({ isOpen, onClose, onOpenLegal }) {
  if (!isOpen) return null;
  return (
    <AppDataProvider>
      <Body onClose={onClose} onOpenLegal={onOpenLegal} />
    </AppDataProvider>
  );
}
