import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Home, Camera, TrendingUp, BookOpen, User, ArrowLeft, Bell, MessageCircle } from 'lucide-react';
import { AppDataProvider, useAppData } from '../state/AppData';
import { wake } from '../api/client';
import Splash from './app/Splash';
import AuthScreen from './app/AuthScreen';
import HomeTab from './app/HomeTab';
import ScanTab from './app/ScanTab';
import TimelineTab from './app/TimelineTab';
import DietTab from './app/DietTab';
import AboutTab from './app/AboutTab';
import AskSheet from './app/AskSheet';
import NotificationModal from './app/NotificationModal';
import { Doodle } from './app/BotanicalDoodles';

const MIN_SPLASH_MS = 1800;

function useIsMobileScreen() {
  const calc = () => typeof window !== 'undefined' && (
    window.innerWidth <= 820 ||
    !!window.Capacitor ||
    window.location.protocol === 'capacitor:' ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')
  );
  const [mobile, setMobile] = useState(calc);
  useEffect(() => {
    const h = () => setMobile(calc());
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mobile;
}

function NavButton({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-current={active ? 'page' : undefined}
      style={{
        background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
        color: active ? '#ff6b00' : 'rgba(255, 255, 255, 0.6)', cursor: 'pointer', padding: '8px'
      }}
    >
      {children}
    </button>
  );
}

function TopButton({ label, onClick, badge = 0, children }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} style={{
      position: 'relative', width: '38px', height: '38px', borderRadius: '50%', border: '1px solid #e9e4d8', backgroundColor: '#fff',
      color: '#19231c', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
    }}>
      {children}
      {badge > 0 && (
        <span aria-hidden="true" style={{
          position: 'absolute', top: '-3px', right: '-3px', minWidth: '17px', height: '17px', borderRadius: '9999px', backgroundColor: '#ff6b00',
          color: '#fff', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          border: '2px solid #f6f5f1', boxSizing: 'content-box'
        }}>{badge > 9 ? '9+' : badge}</span>
      )}
    </button>
  );
}

function AppShell({ onOpenLegal, mobile }) {
  const { user, sessionKey, unreadNotes } = useAppData();
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phaseText, setPhaseText] = useState('Starting up...');
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // The selected tab belongs to one login session, so every new login starts on Home (derived, no effect needed).
  const [tabState, setTabState] = useState({ session: 0, tab: 'home' });
  const tab = tabState.session === sessionKey ? tabState.tab : 'home';
  const [askState, setAskState] = useState({ session: 0, open: false });      // the Ask Twacha sheet; closes on log out
  const askOpen = askState.session === sessionKey && askState.open;
  const setAsk = useCallback((open) => setAskState({ session: sessionKey, open }), [sessionKey]);
  const [notesState, setNotesState] = useState({ session: 0, open: false });  // the bell's list; closes on log out
  const notesOpen = notesState.session === sessionKey && notesState.open;
  const setNotes = useCallback((open) => setNotesState({ session: sessionKey, open }), [sessionKey]);
  const scroller = useRef(null);

  // Splash: the progress bar follows the real server wake-up (free hosting sleeps).
  useEffect(() => {
    if (ready) return undefined;
    let cancelled = false;
    setFailed(false); setProgress(0); setPhaseText('Starting up...');
    const started = Date.now();
    const ticker = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + 1.5, 90);
        const secs = (Date.now() - started) / 1000;
        setPhaseText(secs > 4 ? 'Waking the server. Free hosting can take up to a minute...' : 'Connecting to the Twacha server...');
        return next;
      });
    }, 75);
    wake(60000).then((ok) => {
      const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - started));
      setTimeout(() => {
        if (cancelled) return;
        clearInterval(ticker);
        if (ok) {
          setProgress(100); setPhaseText('Ready');
          setTimeout(() => !cancelled && setReady(true), 400);
        } else {
          setFailed(true); setProgress(90);
          setPhaseText('Could not reach the server. Scans need an internet connection.');
        }
      }, wait);
    });
    return () => { cancelled = true; clearInterval(ticker); };
  }, [attempt, ready]);

  const go = useCallback((t) => {
    setTabState({ session: sessionKey, tab: t });
    if (scroller.current) scroller.current.scrollTop = 0;
  }, [sessionKey]);

  let screen;
  if (!ready) {
    screen = <Splash progress={Math.round(progress)} phaseText={phaseText} failed={failed}
      onRetry={() => setAttempt((a) => a + 1)} onContinue={() => setReady(true)} />;
  } else if (!user) {
    screen = <AuthScreen onOpenLegal={onOpenLegal} />;
  } else {
    screen = (
      <div style={{ flex: 1, backgroundColor: '#f6f5f1', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 4px', flexShrink: 0,
          backgroundColor: '#f6f5f1'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Doodle name="leaf" size={22} opacity={0.9} />
            <span className="font-serif" style={{ fontSize: '20px', fontWeight: '700', color: '#19231c' }}>Twacha</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <TopButton label="Ask Twacha" onClick={() => setAsk(true)}><MessageCircle size={18} /></TopButton>
            <TopButton label={unreadNotes > 0 ? `Notifications, ${unreadNotes} unread` : 'Notifications'} onClick={() => setNotes(true)} badge={unreadNotes}>
              <Bell size={18} />
            </TopButton>
          </div>
        </header>
        <div ref={scroller} style={{ flex: 1, overflowY: 'auto', paddingBottom: '96px' }}>
          {tab === 'home' && <HomeTab go={go} onAsk={() => setAsk(true)} />}
          {tab === 'scan' && <ScanTab go={go} />}
          {tab === 'timeline' && <TimelineTab go={go} />}
          {tab === 'diet' && <DietTab go={go} />}
          {tab === 'about' && <AboutTab onOpenLegal={onOpenLegal} />}
        </div>
        <nav aria-label="Main" style={{
          position: 'absolute', bottom: '12px', left: '14px', right: '14px', height: '62px', backgroundColor: '#19231c',
          borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
        }}>
          <NavButton active={tab === 'home'} onClick={() => go('home')} title="Home"><Home size={20} /></NavButton>
          <NavButton active={tab === 'timeline'} onClick={() => go('timeline')} title="Progress"><TrendingUp size={20} /></NavButton>
          <button
            onClick={() => go('scan')} title="Scan" aria-label="Scan"
            style={{
              width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#ff6b00', color: '#fff', border: '3px solid #19231c',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(255, 107, 0, 0.55)', transform: 'translateY(-10px)'
            }}
          ><Camera size={21} /></button>
          <NavButton active={tab === 'diet'} onClick={() => go('diet')} title="Diet and plan"><BookOpen size={20} /></NavButton>
          <NavButton active={tab === 'about'} onClick={() => go('about')} title="About"><User size={20} /></NavButton>
        </nav>
        {askOpen && <AskSheet go={go} onClose={() => setAsk(false)} />}
        {notesOpen && <NotificationModal go={go} onClose={() => setNotes(false)} />}
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative', width: mobile ? '100%' : '386px', minWidth: mobile ? '100%' : '386px',
      height: mobile ? '100vh' : '804px', borderRadius: mobile ? 0 : '50px', backgroundColor: '#FAF6EE',
      border: mobile ? 'none' : '10px solid #202b24', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      color: '#19231c', boxShadow: mobile ? 'none' : '0 40px 100px rgba(0,0,0,0.9), 0 0 70px rgba(217,251,72,0.15)'
    }}>
      {mobile && <div style={{ height: 'max(4px, env(safe-area-inset-top, 0px))', flexShrink: 0 }} />}
      {screen}
    </div>
  );
}

export default function PhoneSimulator({ onBackToWeb, onOpenLegal }) {
  const mobile = useIsMobileScreen();
  return (
    <AppDataProvider>
      <div style={{
        backgroundColor: mobile ? '#FAF6EE' : '#051009', minHeight: '100vh', width: '100%', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: mobile ? 'flex-start' : 'center',
        padding: mobile ? 0 : '76px 20px 40px', position: 'relative', overflowX: 'hidden'
      }}>
        {!mobile && (
          <header style={{
            position: 'fixed', top: '18px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center',
            gap: '20px', backgroundColor: 'rgba(9, 26, 17, 0.94)', padding: '10px 24px', borderRadius: '9999px',
            border: '1px solid rgba(255,255,255,0.14)', zIndex: 100
          }}>
            <button onClick={onBackToWeb} className="btn-lime-pill" style={{ padding: '8px 18px', fontSize: '12px', gap: '6px' }}>
              <ArrowLeft size={14} /><span>Back to website</span>
            </button>
            <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.6px', color: '#fff' }}>TWACHA APP VIEW</span>
          </header>
        )}
        <AppShell mobile={mobile} onOpenLegal={onOpenLegal} />
      </div>
    </AppDataProvider>
  );
}
