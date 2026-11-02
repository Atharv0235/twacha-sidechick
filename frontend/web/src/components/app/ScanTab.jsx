import React, { useState } from 'react';
import { useAppData } from '../../state/AppData';
import ScanCapture from './ScanCapture';
import ScanResult from './ScanResult';
import { THEMES, primaryBtn, ghostBtn } from './ui';

const t = THEMES.light;

export default function ScanTab({ go }) {
  const { lastScan, history, thumbs, cadence } = useAppData();
  const [result, setResult] = useState(lastScan);
  const [scanning, setScanning] = useState(!lastScan);

  return (
    <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="font-serif" style={{ fontSize: '24px', fontWeight: '700', color: t.text }}>
        {scanning ? 'New scan' : 'Your result'}
      </div>
      {scanning ? (
        <ScanCapture onResult={(r) => { setResult(r); setScanning(false); }} />
      ) : (
        <>
          <ScanResult result={result} compare={{ scans: history?.scans || [], thumbs, cadence }} />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button style={primaryBtn(t)} onClick={() => go('diet')}>Log what I ate</button>
            <button style={ghostBtn(t)} onClick={() => setScanning(true)}>New scan</button>
          </div>
        </>
      )}
    </div>
  );
}
