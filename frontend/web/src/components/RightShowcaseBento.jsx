import React, { useState } from 'react';
import { ArrowUpRight, Check, Sparkles } from 'lucide-react';

export default function RightShowcaseBento({ onOpenScan }) {
  const [selectedDoctor, setSelectedDoctor] = useState(0);

  const doctors = [
    {
      id: 1,
      name: "Dr. Amelia Carter",
      role: "Dr. Dermatologist",
      experience: "4 years",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=90"
    },
    {
      id: 2,
      name: "Dr. Sofia Bennett",
      role: "Cosmetic Formulation Scientist",
      experience: "6 years",
      image: "https://images.unsplash.com/photo-1594824813515-5853f6511b0e?auto=format&fit=crop&w=400&q=90"
    },
    {
      id: 3,
      name: "Dr. Cameron White",
      role: "Clinical Skincare Researcher",
      experience: "5 years",
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=90"
    },
    {
      id: 4,
      name: "Dr. Olivia Reed",
      role: "Skin Health Specialist",
      experience: "3 years",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=90"
    },
    {
      id: 6,
      name: "Henry Wilson",
      role: "Aesthetic Specialist",
      experience: "5 years",
      image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=90"
    }
  ];

  return (
    <section id="faculty" style={{
      backgroundColor: '#f9f7f2',
      padding: '40px 0 110px 0',
      borderBottom: '1px solid #eae5d8'
    }}>
      <div className="container-custom" style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>

        {/* 1. EXPERT HEADER & DOCTOR GRID */}
        <div>
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
              <span>EXPERT</span>
            </div>

            <h2 className="font-serif" style={{
              fontSize: 'clamp(28px, 3.8vw, 44px)',
              fontWeight: '700',
              lineHeight: '1.16',
              color: '#19231c',
              letterSpacing: '-0.3px',
              textTransform: 'uppercase'
            }}>
              PEOPLE WHO CARE<br />
              FOR YOUR SKIN
            </h2>
          </div>

          {/* 6-Card Doctor Grid (3 cols x 2 rows) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '22px'
          }}>
            {/* Card 1: Dr. Amelia Carter */}
            <DoctorCard
              doctor={doctors[0]}
              isSelected={selectedDoctor === 0}
              onClick={() => setSelectedDoctor(0)}
              onOpenScan={onOpenScan}
            />

            {/* Card 2: Dr. Sofia Bennett */}
            <DoctorCard
              doctor={doctors[1]}
              isSelected={selectedDoctor === 1}
              onClick={() => setSelectedDoctor(1)}
              onOpenScan={onOpenScan}
            />

            {/* Card 3: Dr. Cameron White */}
            <DoctorCard
              doctor={doctors[2]}
              isSelected={selectedDoctor === 2}
              onClick={() => setSelectedDoctor(2)}
              onOpenScan={onOpenScan}
            />

            {/* Card 4: Dr. Olivia Reed */}
            <DoctorCard
              doctor={doctors[3]}
              isSelected={selectedDoctor === 3}
              onClick={() => setSelectedDoctor(3)}
              onOpenScan={onOpenScan}
            />

            {/* Card 5: CENTER TILE (21+ Industry Expert) */}
            <div style={{
              backgroundColor: '#ece5d8',
              borderRadius: '24px',
              padding: '36px 28px',
              border: '1px solid #ded5c5',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(25, 35, 28, 0.05)',
              minHeight: '180px'
            }}>
              <div className="font-serif" style={{
                fontSize: '52px',
                fontWeight: '700',
                color: '#19231c',
                lineHeight: '1',
                marginBottom: '8px'
              }}>
                21+
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#55635b',
                marginBottom: '16px'
              }}>
                Industry Expert of Skincare
              </div>
              <button
                onClick={onOpenScan}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#c85a32',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '9px 20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(200, 90, 50, 0.3)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span>View All Experts</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            {/* Card 6: Henry Wilson */}
            <DoctorCard
              doctor={doctors[4]}
              isSelected={selectedDoctor === 4}
              onClick={() => setSelectedDoctor(4)}
              onOpenScan={onOpenScan}
            />
          </div>
        </div>

        {/* 2. "GLOW & SHINE" DUAL BENTO CARD FLOATING OVER BACKGROUND PHOTO */}
        <div style={{
          position: 'relative',
          borderRadius: '34px',
          overflow: 'hidden',
          padding: '60px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 24px 60px rgba(25, 35, 28, 0.12)'
        }}>
          {/* Soft background portrait of radiant skin */}
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=2000&q=90"
            alt="Soft warm ambient skin photography background"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.85) contrast(1.05)'
            }}
          />

          {/* Floating Split Card */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: '1080px',
            borderRadius: '28px',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            {/* Left: Periwinkle Blue / Lavender Box */}
            <div style={{
              backgroundColor: '#ccd7f9',
              padding: '52px 46px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '32px'
            }}>
              {/* Asterisk icon */}
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#1b2644',
                color: '#ccd7f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '900'
              }}>
                ✱
              </div>

              <div>
                <h3 className="font-serif" style={{
                  fontSize: 'clamp(28px, 3.4vw, 42px)',
                  fontWeight: '700',
                  color: '#1b2644',
                  lineHeight: '1.12',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.3px',
                  marginBottom: '16px'
                }}>
                  GLOW & SHINE
                </h3>

                <p style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#2a3b66',
                  marginBottom: '10px'
                }}>
                  You're invited to a conversation about confidence
                </p>

                <p style={{
                  fontSize: '14px',
                  lineHeight: '1.65',
                  color: '#3d4d77',
                  marginBottom: '32px'
                }}>
                  About showing up fully in social settings and laughing without hesitation. About embracing your smile in photos without second-guessing yourself.
                </p>

                {/* Lime Pill Button */}
                <button
                  onClick={onOpenScan}
                  className="btn-lime-pill"
                  style={{ padding: '12px 26px', fontSize: '13px' }}
                >
                  <span>Explore Product</span>
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </div>

            {/* Right: Radiant Woman Photo in Denim Jacket with Floating Glass Tag */}
            <div style={{ position: 'relative', minHeight: '400px' }}>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=95"
                alt="Radiant smiling woman receiving personalized dermatological care"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Floating Glass Tag at Bottom */}
              <div style={{
                position: 'absolute',
                bottom: '22px',
                left: '20px',
                right: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '9999px',
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.8)'
              }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--c-lime)',
                  color: 'var(--c-forest-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Check size={14} strokeWidth={3} />
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#19231c',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase'
                }}>
                  PERSONALIZED CARE DELIVERED BY EXPERIENCED PROFESSIONALS
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

// Reusable Doctor Card Component Matching Editorial Skincare Design
function DoctorCard({ doctor, isSelected, onClick, onOpenScan }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#f4f0e8',
        borderRadius: '24px',
        padding: '24px 22px',
        border: isSelected ? '1.5px solid var(--c-forest-dark)' : '1px solid #ded6c6',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '180px',
        boxShadow: '0 6px 18px rgba(25, 35, 28, 0.04)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(25, 35, 28, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(25, 35, 28, 0.04)';
      }}
    >
      {/* Top Row: Social Icons (in & x) + Doctor Avatar */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        {/* Social Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#738077', fontSize: '12px' }}>
          <span style={{ fontWeight: '700', cursor: 'pointer' }}>in</span>
          <span style={{ fontWeight: '700', cursor: 'pointer' }}>✕</span>
        </div>

        {/* Doctor Thumbnail */}
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '2px solid #ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <img
            src={doctor.image}
            alt={doctor.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Bottom: Name & Specialty */}
      <div>
        <h4 style={{
          fontSize: '15px',
          fontWeight: '700',
          color: '#19231c',
          marginBottom: '3px'
        }}>
          {doctor.name}
        </h4>
        <div style={{
          fontSize: '11px',
          color: '#738077',
          fontWeight: '500'
        }}>
          {doctor.role} <span style={{ opacity: 0.6 }}>|</span> Experience: {doctor.experience}
        </div>
      </div>
    </div>
  );
}
