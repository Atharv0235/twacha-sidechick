import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export default function AboutSection({ onOpenScan }) {
  const tiltedCards = [
    {
      id: 'top-left',
      rot: '-7deg',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=90',
      alt: 'Model applying dropper facial serum to cheek',
      posStyle: { top: '35px', left: '25px' }
    },
    {
      id: 'top-right',
      rot: '7deg',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=700&q=90',
      alt: 'Woman holding natural botanical aloe vera skincare jar and bottle',
      posStyle: { top: '45px', right: '25px' }
    },
    {
      id: 'bottom-left',
      rot: '-7deg',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=90',
      alt: 'Woman smiling radiant and joyful in natural sunlight',
      posStyle: { bottom: '25px', left: '45px' }
    },
    {
      id: 'bottom-right',
      rot: '6deg',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=90',
      alt: 'Woman with radiant dewy skin gently touching face',
      posStyle: { bottom: '20px', right: '45px' }
    }
  ];

  return (
    <section id="about" style={{
      backgroundColor: '#f9f7f2',
      padding: '110px 0 120px 0',
      position: 'relative',
      overflow: 'hidden',
      borderBottom: '1px solid #eae5d8'
    }}>
      <div className="container-custom" style={{ position: 'relative', minHeight: '620px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* 4 Floating Tilted Organic Photo Cards (Visible on desktop / large viewports) */}
        <div className="desktop-tilted-cards" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {tiltedCards.map((card) => (
            <div
              key={card.id}
              className="animate-float"
              style={{
                position: 'absolute',
                ...card.posStyle,
                width: '215px',
                height: '245px',
                borderRadius: '26px',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                border: '4px solid #ffffff',
                boxShadow: '0 20px 48px rgba(25, 35, 28, 0.13)',
                transform: `rotate(${card.rot})`,
                pointerEvents: 'auto',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = `rotate(0deg) scale(1.04)`;
                e.currentTarget.style.boxShadow = '0 26px 56px rgba(25, 35, 28, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = `rotate(${card.rot})`;
                e.currentTarget.style.boxShadow = '0 20px 48px rgba(25, 35, 28, 0.13)';
              }}
              onClick={onOpenScan}
            >
              <img
                src={card.image}
                alt={card.alt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          ))}
        </div>

        {/* Center Editorial Block */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '680px',
          margin: '0 auto',
          padding: '20px 16px'
        }}>
          {/* Terracotta Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
            color: '#c85a32',
            marginBottom: '18px'
          }}>
            <Sparkles size={14} color="#c85a32" />
            <span>ABOUT US</span>
          </div>

          {/* Editorial Serif Headline */}
          <h2 className="font-serif" style={{
            fontSize: 'clamp(32px, 4vw, 50px)',
            fontWeight: '700',
            lineHeight: '1.14',
            color: '#19231c',
            letterSpacing: '-0.3px',
            textTransform: 'uppercase',
            marginBottom: '22px'
          }}>
            COMPASSIONATE SKINCARE,<br />
            EXPERT PRECISION
          </h2>

          {/* Centered Descriptive Narrative */}
          <p style={{
            fontSize: '15px',
            lineHeight: '1.75',
            color: '#55635b',
            marginBottom: '36px',
            maxWidth: '580px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            We believe skincare should feel simple, intentional, and personal. That's why we create thoughtful formulas and calibrated computer-vision algorithms that care for your skin without complicating your everyday ritual.
          </p>

          {/* Dual Pill Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={onOpenScan}
              className="btn-lime-pill"
              style={{ padding: '14px 28px', fontSize: '14px' }}
            >
              <span>Book Appointment</span>
              <ArrowUpRight size={16} />
            </button>

            <a
              href="#faculty"
              className="btn-white-pill"
              style={{ padding: '14px 28px', fontSize: '14px' }}
            >
              <span>Explore Service</span>
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
