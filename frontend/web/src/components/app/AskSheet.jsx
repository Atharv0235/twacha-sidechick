import React, { useEffect, useRef, useState } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { useAppData } from '../../state/AppData';
import { INTENTS, answer, reply } from '../../assistant';
import { THEMES, primaryBtn, ghostBtn } from './ui';

const t = THEMES.light;

function Bubble({ from, children }) {
  const mine = from === 'me';
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '88%', padding: '10px 13px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize: '13px', lineHeight: 1.55,
        backgroundColor: mine ? t.ink : '#fff', color: mine ? t.onInk : t.text, border: mine ? 'none' : `1px solid ${t.cardBorder}`
      }}>{children}</div>
    </div>
  );
}

function Answer({ a, onAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {a.text.map((p) => <div key={p}>{p}</div>)}
      {a.bullets && (
        <ul style={{ margin: 0, paddingLeft: '18px' }}>
          {a.bullets.map((b) => <li key={b} style={{ marginBottom: '3px' }}>{b}</li>)}
        </ul>
      )}
      {(a.more || []).map((p) => <div key={p} style={{ color: t.muted }}>{p}</div>)}
      {a.small && <div style={{ fontSize: '10px', color: t.faint }}>{a.small}</div>}
      {a.actions && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
          {a.actions.map((x) => (
            <button key={x.label} style={{ ...ghostBtn(t), padding: '7px 13px', fontSize: '12px' }} onClick={() => onAction(x.tab)}>{x.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A full-screen sheet inside the phone frame. The conversation lives only in this component, so closing it clears it. */
export default function AskSheet({ onClose, go }) {
  const { week, plan, history, lastScan } = useAppData();
  const ctx = { week, plan, history, lastScan };
  const [thread, setThread] = useState([]);       // [{ from: 'me', text } | { from: 'bot', answer }]
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView?.({ block: 'end' }); }, [thread]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ask = (text, id) => {
    const a = id ? answer(id, ctx) : reply(text, ctx);
    setThread((prev) => [...prev, { from: 'me', text }, { from: 'bot', answer: a }]);
  };
  const submit = (e) => {
    e.preventDefault();
    const text = draft.trim().slice(0, 200);
    if (!text) return;
    setDraft('');
    ask(text);
  };
  const act = (tab) => { go(tab); onClose(); };

  return (
    <div role="dialog" aria-modal="true" aria-label="Ask Twacha" style={{
      position: 'absolute', inset: 0, zIndex: 50, backgroundColor: '#f6f5f1', display: 'flex', flexDirection: 'column', color: t.text
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: `1px solid ${t.cardBorder}`, backgroundColor: '#fff' }}>
        <MessageCircle size={20} color={t.accent} />
        <div style={{ flex: 1 }}>
          <div className="font-serif" style={{ fontSize: '18px', fontWeight: '700' }}>Ask Twacha</div>
          <div style={{ fontSize: '10px', color: t.faint }}>Quick answers from your own data. Not an AI chat, and not medical advice.</div>
        </div>
        <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}><X size={20} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }} aria-live="polite">
        <Bubble from="bot">Hi! Pick a question below, or type one. I answer from your scans, plan and week, and nothing you type leaves your phone.</Bubble>
        {thread.map((m, i) => (
          m.from === 'me'
            ? <Bubble key={i} from="me">{m.text}</Bubble>
            : <Bubble key={i} from="bot"><Answer a={m.answer} onAction={act} /></Bubble>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ borderTop: `1px solid ${t.cardBorder}`, backgroundColor: '#fff', padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px' }}>
          {INTENTS.map((it) => (
            <button key={it.id} onClick={() => ask(it.label, it.id)} style={{
              whiteSpace: 'nowrap', borderRadius: '9999px', border: `1px solid ${t.cardBorder}`, backgroundColor: t.soft, color: t.text,
              padding: '7px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', flexShrink: 0
            }}>{it.label}</button>
          ))}
        </div>
        <form onSubmit={submit} style={{ display: 'flex', gap: '8px' }}>
          <input
            ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={200} aria-label="Type a question"
            placeholder="Type a question..." autoComplete="off"
            style={{ flex: 1, borderRadius: '9999px', border: `1px solid ${t.cardBorder}`, padding: '10px 14px', fontSize: '14px', backgroundColor: t.soft, color: t.text, minWidth: 0 }}
          />
          <button type="submit" aria-label="Send" disabled={!draft.trim()} style={{ ...primaryBtn(t, !draft.trim()), padding: '10px 14px' }}><Send size={16} /></button>
        </form>
      </div>
    </div>
  );
}
