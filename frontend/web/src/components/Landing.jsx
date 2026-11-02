import React from 'react';
import { Camera, Wind, Salad, LineChart, ArrowUpRight } from 'lucide-react';
import { TEAM, DISCLAIMER } from '../config';

const card = {
  backgroundColor: '#ffffff', border: '1px solid var(--c-cream-border)', borderRadius: '24px',
  padding: '28px 26px', boxShadow: '0 6px 18px rgba(25, 35, 28, 0.04)'
};
const eyebrow = {
  fontSize: '12px', fontWeight: '700', letterSpacing: '1.4px', textTransform: 'uppercase', color: '#c85a32', marginBottom: '12px'
};
const h2 = { fontSize: 'clamp(28px, 3.6vw, 42px)', fontWeight: '700', lineHeight: 1.16, color: '#19231c', marginBottom: '16px' };

const STEPS = [
  { icon: Camera, title: '1. Take a photo', body: 'Use daylight and face the camera. The photo is sent to our server, analysed in memory and not saved.' },
  { icon: Wind, title: '2. Add local air quality', body: 'We look up the air quality index for your city, and say clearly when that data is not available.' },
  { icon: Salad, title: '3. Get food ideas to try', body: 'Indian foods linked to the skin measures, each with an honest note on how strong the evidence is.' },
  { icon: LineChart, title: '4. Follow your trend', body: 'Scan every few days and watch a 30-day trend. Your food log changes what we suggest next.' }
];

const LIMITS = [
  'The acne score comes from a small model (MobileNetV2 trained on the ACNE04 dataset). On our test set of 56 images it reached a macro-F1 of about 0.60, so expect mistakes.',
  'It was trained on clinic photos, mostly of East Asian patients. Selfies, darker skin tones, beards and moles can give wrong scores. We have not validated it on any skin tone group.',
  'Redness and dryness are simple colour and texture estimates and are not calibrated against any reference.',
  'The link from a skin score to a nutrient uses weights chosen by the team, not weights taken from research papers.',
  'Research on diet and acne is mixed, so suggestions are things to try for a couple of weeks, not treatment.',
  'Lighting and camera change results. Use daylight and a neutral face.'
];

export default function Landing({ onOpenScan, onOpenApp }) {
  return (
    <div>
      <section style={{ backgroundColor: 'var(--c-forest-dark)', color: '#fff', padding: '96px 0 88px' }}>
        <div className="container-custom" style={{ maxWidth: '860px' }}>
          <div style={{ ...eyebrow, color: 'var(--c-lime)' }}>Student project prototype</div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(38px, 6vw, 68px)', lineHeight: 1.08, fontWeight: '700', marginBottom: '22px' }}>
            Track your skin. Eat with the air you breathe in mind.
          </h1>
          <p style={{ fontSize: '17px', lineHeight: 1.65, color: 'rgba(255,255,255,0.8)', marginBottom: '32px', maxWidth: '640px' }}>
            Twacha estimates acne severity and a few other visible skin measures from a photo, adds your city's air quality, and suggests Indian foods to try, with an honest note on the evidence for each.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button className="btn-lime-pill" onClick={onOpenScan}><span>Try a scan</span><ArrowUpRight size={16} /></button>
            <button className="btn-white-pill" onClick={onOpenApp}><span>Open the app view</span></button>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '22px' }}>{DISCLAIMER}</p>
        </div>
      </section>

      <section id="how" style={{ backgroundColor: 'var(--c-cream-bg)', padding: '88px 0' }}>
        <div className="container-custom">
          <div style={eyebrow}>How it works</div>
          <h2 className="font-serif" style={h2}>From photo to food ideas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '28px' }}>
            {STEPS.map(({ icon: Icon, title, body }) => (
              <div key={title} style={card}>
                <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: 'var(--c-forest-dark)', color: 'var(--c-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Icon size={20} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--c-cream-muted)' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="limits" style={{ backgroundColor: '#f1ede2', padding: '88px 0' }}>
        <div className="container-custom" style={{ maxWidth: '860px' }}>
          <div style={eyebrow}>Be careful with the numbers</div>
          <h2 className="font-serif" style={h2}>What Twacha cannot do yet</h2>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '15px', lineHeight: 1.65, color: '#33433a' }}>
            {LIMITS.map((t) => <li key={t}>{t}</li>)}
          </ul>
          <p style={{ marginTop: '22px', fontSize: '14px', color: 'var(--c-cream-muted)' }}>
            Twacha is not a medical device and does not diagnose anything.
          </p>
        </div>
      </section>

      <section id="team" style={{ backgroundColor: 'var(--c-cream-bg)', padding: '88px 0' }}>
        <div className="container-custom" style={{ maxWidth: '860px' }}>
          <div style={eyebrow}>Built by</div>
          <h2 className="font-serif" style={h2}>Two students, one semester</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.65, color: '#33433a' }}>
            Twacha is a class project. The acne model, the backend and the app were built by two students{TEAM.length > 0 ? ' (listed below)' : ''}. Data sources: ACNE04 (training images), Indian Nutrient Databank (food values) and the World Air Quality Index Project (air quality).
          </p>
          {TEAM.length > 0 && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '22px' }}>
              {TEAM.map((m) => (
                <div key={m.name} style={{ ...card, padding: '18px 22px' }}>
                  <div style={{ fontWeight: '700' }}>{m.name}</div>
                  {m.role && <div style={{ fontSize: '13px', color: 'var(--c-cream-muted)' }}>{m.role}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
