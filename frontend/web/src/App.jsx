import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Landing from './components/Landing';
import Footer from './components/Footer';
import ScanStudioModal from './components/ScanStudioModal';
import PhoneSimulator from './components/PhoneSimulator';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsConditions from './components/TermsConditions';

export default function App() {
  const [currentView, setCurrentView] = useState('web'); // 'web' | 'privacy' | 'terms'
  // The app view opens by default on phones, inside the Capacitor app, or with ?mode=app
  const isMobileDevice = typeof window !== 'undefined' && (
    window.innerWidth <= 768 ||
    window.location.search.includes('mode=app') ||
    !!window.Capacitor ||
    window.location.protocol === 'capacitor:'
  );
  const [viewMode, setViewMode] = useState(isMobileDevice ? 'app' : 'web'); // 'web' | 'app'
  const [isScanOpen, setIsScanOpen] = useState(false);

  const navigate = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (viewMode === 'app') {
    return (
      <PhoneSimulator
        onBackToWeb={() => { setViewMode('web'); setCurrentView('web'); }}
        onOpenLegal={(view) => { setViewMode('web'); navigate(view); }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenScan={() => setIsScanOpen(true)} viewMode={viewMode} setViewMode={setViewMode} onNavigate={navigate} />
      <main style={{ flex: 1 }}>
        {currentView === 'privacy' && <PrivacyPolicy onBack={() => setCurrentView('web')} />}
        {currentView === 'terms' && <TermsConditions onBack={() => setCurrentView('web')} />}
        {currentView === 'web' && (
          <Landing onOpenScan={() => setIsScanOpen(true)} onOpenApp={() => setViewMode('app')} />
        )}
      </main>
      <Footer onNavigate={navigate} />
      <ScanStudioModal isOpen={isScanOpen} onClose={() => setIsScanOpen(false)}
        onOpenLegal={(view) => { setIsScanOpen(false); navigate(view); }} />
    </div>
  );
}
