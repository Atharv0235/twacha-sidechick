import React from 'react';
import { Globe, Shield, Activity, Compass, Cpu, Layers, Disc, CircleDot, Grid } from 'lucide-react';

export default function FeaturedLogos() {
  const brandList = [
    { name: 'Corp', icon: Layers },
    { name: 'Europa', icon: Globe },
    { name: 'CoreOS', icon: CircleDot },
    { name: 'Hexsmith', icon: Shield },
    { name: '45 Degrees°', icon: Compass },
    { name: 'ContrastAI', icon: Cpu },
    { name: 'Eightball', icon: Disc },
    { name: 'DermaCon-IN', icon: Activity },
    { name: 'INDB Clinical', icon: Layers }
  ];

  // Quadruple items for seamless loop
  const marqueeItems = [...brandList, ...brandList, ...brandList, ...brandList];

  return (
    <section style={{
      backgroundColor: '#ffffff',
      padding: '44px 0 40px 0',
      borderBottom: '1px solid #eeebe2',
      overflow: 'hidden',
      position: 'relative',
      width: '100%'
    }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <p style={{
          fontSize: '13px',
          color: '#555f58',
          letterSpacing: '0.4px',
          fontWeight: '600'
        }}>
          We are featured on
        </p>
      </div>

      {/* Infinite Left-to-Right Continuous Rotating Ticker */}
      <div style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)'
      }}>
        <div className="animate-marquee-ltr" style={{
          display: 'flex',
          gap: '54px',
          alignItems: 'center'
        }}>
          {marqueeItems.map((brand, idx) => {
            const Icon = brand.icon;
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#657169',
                  fontWeight: '600',
                  fontSize: '15px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--c-forest-dark)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#657169';
                }}
              >
                <Icon size={18} style={{ opacity: 0.8 }} />
                <span>{brand.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
