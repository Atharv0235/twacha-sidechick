import React from 'react';
import { ArrowUpRight, Sparkles, ChevronDown, Plus } from 'lucide-react';

export default function Hero({ onOpenScan }) {
  return (
    <section style={{
      position: 'relative',
      width: '100%',
      minHeight: '680px',
      height: '86vh',
      maxHeight: '820px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      backgroundColor: 'var(--c-forest-dark)',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      {/* 100% Full-Width Radiant Skin Background Image (Dewy sunlit skin close-up) */}
      <img
        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=2600&q=95"
        alt="Radiant glowing skin through modern clinical solution"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 22%',
          zIndex: 0,
          filter: 'contrast(1.05) brightness(0.96)'
        }}
      />

      {/* Deep Forest Gradient Overlay for optimal text readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(9, 26, 17, 0.15) 0%, rgba(9, 26, 17, 0.35) 45%, rgba(9, 26, 17, 0.85) 82%, rgba(9, 26, 17, 0.98) 100%)',
        zIndex: 1
      }} />

      {/* Hero Content Area */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        paddingBottom: '56px',
        paddingTop: '60px'
      }}>
        <div className="container-custom" style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '32px'
        }}>
          {/* Left Column: Headline and Dual Pill CTA Buttons */}
          <div style={{ maxWidth: '640px' }}>
            <h1 className="font-serif" style={{
              fontSize: 'clamp(36px, 4.6vw, 62px)',
              fontWeight: '700',
              color: '#ffffff',
              lineHeight: '1.08',
              letterSpacing: '-0.5px',
              textTransform: 'uppercase',
              marginBottom: '28px',
              textShadow: '0 4px 30px rgba(0,0,0,0.65)'
            }}>
              CREATE GLOWING SKIN<br />
              THROUGH MODERN SOLUTION
            </h1>

            {/* Dual Iconic Pill Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={onOpenScan}
                className="btn-lime-pill"
                style={{ padding: '14px 30px', fontSize: '14px' }}
              >
                <span>Book Appointment</span>
                <ArrowUpRight size={17} />
              </button>

              <a
                href="#about"
                className="btn-white-pill"
                style={{ padding: '14px 30px', fontSize: '14px' }}
              >
                <span>Explore Service</span>
                <ArrowUpRight size={17} />
              </a>
            </div>
          </div>

          {/* Right Column: Floating Glassmorphism Metric & Tag Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(15, 35, 23, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '16px 20px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
            maxWidth: '380px'
          }}>
            {/* Left Box: Trusted by 97% */}
            <div style={{ paddingRight: '16px', borderRight: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '600',
                letterSpacing: '0.4px',
                marginBottom: '2px'
              }}>
                Trusted by
              </div>
              <div className="font-serif" style={{
                fontSize: '36px',
                fontWeight: '700',
                color: '#ffffff',
                lineHeight: '1.1'
              }}>
                97%
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.75)',
                lineHeight: '1.4',
                marginTop: '4px'
              }}>
                Our clients love us and are united about our clinical care
              </div>
            </div>

            {/* Right Box: Floating Pill Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '110px' }}>
              {/* Twacha Selector Badge */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}>
                <span>Twacha</span>
                <ChevronDown size={12} />
              </div>

              {/* Acid Lime Pill Badge */}
              <div style={{
                backgroundColor: 'var(--c-lime)',
                color: 'var(--c-forest-dark)',
                borderRadius: '9999px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(217, 251, 72, 0.3)'
              }}>
                <Sparkles size={11} />
                <span>Skin Care</span>
              </div>

              {/* White Pill Badge */}
              <div style={{
                backgroundColor: '#ffffff',
                color: 'var(--c-forest-dark)',
                borderRadius: '9999px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Glowing Skin</span>
                <Plus size={12} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
