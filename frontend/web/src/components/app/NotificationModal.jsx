import React, { useEffect, useState } from 'react';
import { Bell, X, Camera, Utensils, Flame, Flag, ChevronRight } from 'lucide-react';
import { useAppData } from '../../state/AppData';
import { THEMES, cardStyle, ghostBtn } from './ui';
import { DoodleEmpty, DoodleCluster } from './BotanicalDoodles';

const t = THEMES.light;
const ICON = { scan: Camera, plan: Utensils, log: Flame, journey: Flag };

/** The list behind the bell. Reminders are worked out on the phone and shown only here; nothing is pushed. */
export default function NotificationModal({ go, onClose }) {
  const { notifications, readNotes, markNotesRead } = useAppData();
  const seen = new Set(readNotes);

  // Opening the list counts as reading it, but the unread dots stay visible while it is open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const [initiallyUnread] = useState(() => new Set(notifications.filter((n) => !seen.has(n.id)).map((n) => n.id)));
  useEffect(() => { markNotesRead(); }, [markNotesRead]);

  const act = (tab) => { go(tab); onClose(); };

  return (
    <div role="dialog" aria-modal="true" aria-label="Notifications" style={{
      position: 'absolute', inset: 0, zIndex: 50, backgroundColor: '#f6f5f1', display: 'flex', flexDirection: 'column', color: t.text
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: `1px solid ${t.cardBorder}`, backgroundColor: '#fff' }}>
        <Bell size={20} color={t.accent} />
        <div style={{ flex: 1 }}>
          <div className="font-serif" style={{ fontSize: '18px', fontWeight: '700' }}>Notifications</div>
          <div style={{ fontSize: '10px', color: t.faint }}>Reminders from your own scans, plan and log.</div>
        </div>
        <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}><X size={20} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
        {notifications.length === 0 ? (
          <div style={{ ...cardStyle(t), padding: '28px 16px', position: 'relative', overflow: 'hidden' }}>
            <DoodleEmpty name="leaf">
              <div style={{ fontSize: '15px', fontWeight: '800' }}>You are all caught up</div>
              <div style={{ fontSize: '12px', color: t.muted, lineHeight: 1.5 }}>Nothing needs you right now. New reminders show up here when a scan is due or your plan needs a tick.</div>
            </DoodleEmpty>
          </div>
        ) : notifications.map((n) => {
          const Icon = ICON[n.kind] || Bell;
          const fresh = initiallyUnread.has(n.id);
          return (
            <div key={n.id} style={{ ...cardStyle(t), display: 'flex', gap: '12px', alignItems: 'flex-start', borderColor: fresh ? t.accent : t.cardBorder }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: t.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color={t.accent} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {n.title}
                  {fresh && <span style={{ fontSize: '9px', fontWeight: '800', color: '#fff', backgroundColor: t.accent, borderRadius: '9999px', padding: '1px 7px' }}>NEW</span>}
                </div>
                <div style={{ fontSize: '12px', color: t.muted, lineHeight: 1.5, margin: '3px 0 8px' }}>{n.body}</div>
                <button onClick={() => act(n.tab)} style={{ ...ghostBtn(t), padding: '7px 13px', fontSize: '12px' }}>
                  {n.cta} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
        <p style={{ fontSize: '10px', color: t.faint, lineHeight: 1.5, textAlign: 'center', margin: '6px 8px 0' }}>
          These reminders appear only inside the app. Twacha does not send push notifications, emails or texts.
        </p>
      </div>
      <DoodleCluster variant="edge" opacity={0.35} />
    </div>
  );
}
