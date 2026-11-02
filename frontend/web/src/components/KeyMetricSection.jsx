import React from 'react';
import { ArrowUpRight, Plus, Sparkles, ShieldCheck, Database, Layers, EyeOff } from 'lucide-react';

export default function KeyMetricSection({ onOpenScan }) {
  const topPillCards = [
    {
      title: "Skin-First Formulas",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=90",
      detail: "Level-1 systematic review evidence"
    },
    {
      title: "Barrier-Friendly Care",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=700&q=90",
      detail: "Stratum corneum lipid protection"
    },
    {
      title: "Transparent by Nature",
      image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=700&q=90",
      detail: "0 ms raw photo data retention"
    }
  ];

  return (
    <section id="services" style={{
      backgroundColor: '#f9f7f2',
      padding: '80px 0 90px 0',
      borderBottom: '1px solid #eae5d8'
    }}>
      <div className="container-custom">
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
            color: '#c85a32',
            marginBottom: '14px'
          }}>
            <Sparkles size={14} color="#c85a32" />
            <span>KEY METRIC</span>
          </div>

          <h2 className="font-serif" style={{
            fontSize: 'clamp(28px, 3.8vw, 44px)',
            fontWeight: '700',
            lineHeight: '1.16',
            color: '#19231c',
            letterSpacing: '-0.3px',
            textTransform: 'uppercase'
          }}>
            KEY METRIC VALUE THAT<br />
            REFLECT OUR COMMITMENT
          </h2>
        </div>

        {/* 1. THREE TOP PILL CARDS (Exact match to reference top cards) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {topPillCards.map((card, idx) => (
            <div
              key={idx}
              onClick={onOpenScan}
              style={{
                position: 'relative',
                height: '148px',
                borderRadius: '24px',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(25, 35, 28, 0.08)',
                border: '1px solid #e5ded0',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 16px 36px rgba(25, 35, 28, 0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(25, 35, 28, 0.08)';
              }}
            >
              <img
                src={card.image}
                alt={card.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(9, 26, 17, 0.1) 0%, rgba(9, 26, 17, 0.82) 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                padding: '18px 20px'
              }}>
                <div>
                  <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '15px' }}>
                    {card.title}
                  </div>
                  <div style={{ color: 'var(--c-lime)', fontSize: '11px', fontWeight: '600', marginTop: '2px' }}>
                    {card.detail}
                  </div>
                </div>

                {/* White circle with plus icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  color: '#19231c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  flexShrink: 0
                }}>
                  <Plus size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 2. ACID LIME SPLIT BANNER (Exact match to reference yellow split box) */}
        <div style={{
          borderRadius: '28px',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          boxShadow: '0 16px 45px rgba(25, 35, 28, 0.08)',
          border: '1px solid #d9d1c1'
        }}>
          {/* Left: Acid Lime Box with asterisk & terracotta button */}
          <div style={{
            backgroundColor: 'var(--c-lime)',
            padding: '48px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '28px'
          }}>
            {/* Flower / Asterisk emblem */}
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--c-forest-dark)',
              color: 'var(--c-lime)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: '900'
            }}>
              ✱
            </div>

            <div>
              <h3 className="font-serif" style={{
                fontSize: 'clamp(26px, 3.2vw, 38px)',
                fontWeight: '700',
                color: 'var(--c-forest-dark)',
                lineHeight: '1.14',
                textTransform: 'uppercase',
                letterSpacing: '-0.3px',
                marginBottom: '16px'
              }}>
                CREATING HEALTHIER SKIN THROUGH MODERN SKINCARE SOLUTION
              </h3>

              <p style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#1f3829',
                marginBottom: '26px'
              }}>
                Groundbreaking clinical computer vision combined with standardized INDB nutritional pairing. Calibrated across Indian skin phototypes III through VI.
              </p>

              {/* Terracotta pill button */}
              <button
                onClick={onOpenScan}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#c85a32',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '12px 24px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(200, 90, 50, 0.35)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span>Book Appointment</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>

          {/* Right: Close-up skin cream application image */}
          <div style={{ position: 'relative', minHeight: '340px' }}>
            <img
              src="https://images.unsplash.com/photo-1512290900672-1f5518b52820?auto=format&fit=crop&w=1200&q=95"
              alt="Hands applying hydrating cream and serum to glowing skin"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
