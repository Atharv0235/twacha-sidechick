import React from 'react';

// Animated start screen. Progress is tied to the real server wake-up (see PhoneSimulator).
export default function Splash({ progress, phaseText, failed, onRetry, onContinue }) {
  return (
            <div style={{
              flex: 1,
              backgroundColor: '#F5EFE6',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 26px',
              color: '#1C2920',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* === BOTANICAL BACKGROUND MOTIFS (Leaves, Wheat Grains, Herbal sprigs) === */}
              {/* Top-Right Botanical Leaf Branch */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '180px',
                height: '180px',
                pointerEvents: 'none',
                opacity: 0.55,
                animation: 'swayBotanical 7s ease-in-out infinite'
              }}>
                <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%' }}>
                  <path d="M165 5 C145 30, 115 42, 90 80" stroke="#6E8E64" strokeWidth="2" fill="none" opacity="0.6" />
                  <path d="M160 8 C140 20, 130 35, 120 55 C135 42, 150 28, 162 15 Z" fill="#6E8E64" opacity="0.65" />
                  <path d="M148 18 C128 28, 118 42, 102 60 C116 48, 134 36, 148 20 Z" fill="#5A7B51" opacity="0.75" />
                  <path d="M170 38 C152 52, 140 64, 124 84 C138 72, 156 62, 170 46 Z" fill="#82A179" opacity="0.6" />
                  {/* Golden Oat grains */}
                  <g fill="#CFA86A" stroke="#A8883E" strokeWidth="0.8">
                    <ellipse cx="145" cy="90" rx="7" ry="4" transform="rotate(-25 145 90)" />
                    <ellipse cx="132" cy="100" rx="6.5" ry="3.5" transform="rotate(18 132 100)" />
                    <ellipse cx="152" cy="108" rx="7" ry="4" transform="rotate(40 152 108)" />
                  </g>
                </svg>
              </div>

              {/* Bottom-Left Aloe Vera & Chamomile Botanical sprig */}
              <div style={{
                position: 'absolute',
                bottom: '-15px',
                left: '-15px',
                width: '190px',
                height: '210px',
                pointerEvents: 'none',
                opacity: 0.7,
                animation: 'swayBotanical 9s ease-in-out infinite'
              }}>
                <svg viewBox="0 0 200 230" style={{ width: '100%', height: '100%' }}>
                  <path d="M15 220 C25 155, 55 110, 85 55 C70 120, 50 170, 40 220 Z" fill="#618B5E" />
                  <path d="M35 220 C52 150, 92 115, 125 78 C98 135, 78 178, 65 220 Z" fill="#75A272" />
                  <path d="M5 220 C10 170, 2 135, -5 105 C2 150, 8 185, 15 220 Z" fill="#4C7449" />
                  {/* Chamomile Flower */}
                  <g transform="translate(100, 160)">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                      <ellipse
                        key={i}
                        cx="15"
                        cy="0"
                        rx="8"
                        ry="4"
                        fill="#ffffff"
                        stroke="#E0DDD5"
                        strokeWidth="0.8"
                        transform={`rotate(${angle})`}
                      />
                    ))}
                    <circle cx="0" cy="0" r="8" fill="#E5A93B" stroke="#B8841B" strokeWidth="1" />
                  </g>
                </svg>
              </div>

              {/* Subtle ambient warm glow */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 46%, rgba(207, 168, 106, 0.16) 0%, rgba(106, 142, 110, 0.08) 50%, transparent 75%)',
                pointerEvents: 'none'
              }} />

              {/* Concentric spinning rings with herbal green & warm gold palette */}
              <div style={{
                position: 'absolute',
                width: '290px',
                height: '290px',
                borderRadius: '50%',
                border: '1.5px dashed rgba(106, 142, 110, 0.35)',
                animation: 'spinSlow 24s linear infinite',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                border: '1.5px dashed rgba(207, 168, 106, 0.45)',
                animation: 'spinSlowReverse 16s linear infinite',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                border: '1px dashed rgba(46, 68, 48, 0.45)',
                animation: 'spinSlow 9s linear infinite',
                pointerEvents: 'none'
              }} />

              {/* Radiating pulse rings in warm botanical tone */}
              <div style={{
                position: 'absolute',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '2px solid rgba(106, 142, 110, 0.35)',
                animation: 'pulseRingOut 2.8s ease-out infinite',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '2px solid rgba(207, 168, 106, 0.3)',
                animation: 'pulseRingOut 2.8s ease-out infinite',
                animationDelay: '1.2s',
                pointerEvents: 'none'
              }} />

              {/* Orbiting glowing chakra pearl on mid ring */}
              <div style={{
                position: 'absolute',
                width: '220px',
                height: '220px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'spinSlowReverse 16s linear infinite',
                pointerEvents: 'none'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: '#CFA86A',
                  boxShadow: '0 0 10px 3px rgba(207, 168, 106, 0.7)'
                }} />
              </div>

              {/* Floating botanical particles */}
              <div style={{
                position: 'absolute', top: '16%', left: '14%',
                fontSize: '20px', animation: 'driftParticle 4s ease-in-out infinite', opacity: 0.8
              }}>🌿</div>
              <div style={{
                position: 'absolute', top: '22%', right: '14%',
                fontSize: '18px', animation: 'driftParticleB 5.5s ease-in-out infinite', opacity: 0.75
              }}>🌾</div>
              <div style={{
                position: 'absolute', bottom: '24%', left: '12%',
                fontSize: '19px', animation: 'driftParticleC 4.8s ease-in-out infinite', opacity: 0.85
              }}>🌼</div>
              <div style={{
                position: 'absolute', bottom: '18%', right: '14%',
                fontSize: '16px', animation: 'driftParticle 6s ease-in-out infinite reverse', opacity: 0.7
              }}>🍃</div>

                            {/* === COMPACT GOLDEN MANDALA & YOGA MEDITATION CHAKRA LOGO === */}
              <div style={{
                position: 'relative',
                zIndex: 5,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Subtle soft golden radiance pulse */}
                <div style={{
                  position: 'absolute',
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(235, 175, 45, 0.28) 0%, rgba(207, 168, 106, 0.12) 50%, transparent 75%)',
                  animation: 'pulseRing 3s ease-in-out infinite',
                  pointerEvents: 'none'
                }} />

                {/* SVG Container: Compact 76px x 76px */}
                <div style={{
                  width: '76px',
                  height: '76px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  animation: 'logoBreath 3.2s ease-in-out infinite'
                }}>
                  <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                      <filter id="chakraGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* === 1. SACRED GOLDEN MANDALA / LOTUS BACKGROUND === */}
                    <g transform="translate(100, 100)" stroke="#E5A93B" strokeWidth="1.8" fill="none" opacity="0.95">
                      {/* Outer 12 Sacred Pointed Lotus Petals */}
                      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                        <path
                          key={`outer-${i}`}
                          d="M0 -78 C12 -65, 20 -48, 0 -36 C-20 -48, -12 -65, 0 -78 Z"
                          transform={`rotate(${angle})`}
                          fill="rgba(245, 185, 60, 0.08)"
                        />
                      ))}

                      {/* Middle Geometric Petal Ring */}
                      {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((angle, i) => (
                        <path
                          key={`mid-${i}`}
                          d="M0 -62 C9 -52, 14 -38, 0 -28 C-14 -38, -9 -52, 0 -62 Z"
                          transform={`rotate(${angle})`}
                          fill="rgba(245, 185, 60, 0.12)"
                        />
                      ))}

                      {/* Concentric Golden Mandala Halo Rings */}
                      <circle cx="0" cy="0" r="48" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.75" />
                      <circle cx="0" cy="0" r="36" strokeWidth="1.4" opacity="0.85" />
                    </g>

                    {/* === 2. MEDITATING YOGA SILHOUETTE (Padmasana with Hair Bun & Jnana Mudra) === */}
                    <g fill="#121814">
                      {/* High Topknot Bun */}
                      <circle cx="100" cy="42" r="7.5" />
                      <ellipse cx="100" cy="46" rx="5" ry="3.5" />

                      {/* Head & Elegant Neck */}
                      <ellipse cx="100" cy="58" rx="11" ry="12.5" />
                      <path d="M96 68 L104 68 L106 78 L94 78 Z" />

                      {/* Torso & Shoulders in deep poise */}
                      <path d="M100 76 C86 78, 73 85, 68 96 C65 102, 69 106, 74 104 C81 100, 90 98, 100 98 C110 98, 119 100, 126 104 C131 106, 135 102, 132 96 C127 85, 114 78, 100 76 Z" />
                      
                      {/* Core Torso tapering down to hips */}
                      <path d="M90 97 C87 110, 84 125, 76 138 C88 141, 112 141, 124 138 C116 125, 113 110, 110 97 Z" />

                      {/* Left Arm extended gracefully to knee */}
                      <path d="M72 98 C65 110, 52 125, 38 138 C34 142, 38 146, 44 143 C54 138, 68 126, 78 114 Z" />

                      {/* Right Arm extended gracefully to knee */}
                      <path d="M128 98 C135 110, 148 125, 162 138 C166 142, 162 146, 156 143 C146 138, 132 126, 122 114 Z" />

                      {/* Jnana Mudra Hands (Index finger touching thumb in a ring, other fingers straight) */}
                      {/* Left Hand Mudra */}
                      <circle cx="34" cy="142" r="4.2" />
                      <path d="M34 140 C32 136, 27 137, 28 142 L25 145 C23 147, 26 150, 29 148 L35 144 Z" />
                      {/* Inner circle opening of Mudra */}
                      <circle cx="31" cy="142" r="1.8" fill="#F5EFE6" />

                      {/* Right Hand Mudra */}
                      <circle cx="166" cy="142" r="4.2" />
                      <path d="M166 140 C168 136, 173 137, 172 142 L175 145 C177 147, 174 150, 171 148 L165 144 Z" />
                      {/* Inner circle opening of Mudra */}
                      <circle cx="169" cy="142" r="1.8" fill="#F5EFE6" />

                      {/* Crossed Legs in Lotus / Padmasana Base */}
                      <path d="M40 142 C36 138, 52 134, 72 138 C88 141, 112 141, 128 138 C148 134, 164 138, 160 142 C152 153, 130 158, 100 158 C70 158, 48 153, 40 142 Z" />
                    </g>

                    {/* === 3. THE 7 CONCENTRIC LUMINOUS CHAKRAS ALONG THE SPINE === */}
                    {/* Chakra 1: Sahasrara (Crown - Violet/Purple) */}
                    <circle cx="100" cy="52" r="4.8" fill="#7C3AED" stroke="#4C1D95" strokeWidth="0.8" filter="url(#chakraGlow)" />
                    <circle cx="100" cy="52" r="2.2" fill="#DDD6FE" />

                    {/* Chakra 2: Ajna (Third Eye - Indigo / Blue) */}
                    <circle cx="100" cy="66" r="4.8" fill="#2563EB" stroke="#1E3A8A" strokeWidth="0.8" filter="url(#chakraGlow)" />
                    <circle cx="100" cy="66" r="2.2" fill="#BFDBFE" />

                    {/* Chakra 3: Vishuddha (Throat - Cyan / Sky Blue) */}
                    <circle cx="100" cy="80" r="4.8" fill="#0EA5E9" stroke="#0369A1" strokeWidth="0.8" filter="url(#chakraGlow)" />
                    <circle cx="100" cy="80" r="2.2" fill="#BAE6FD" />

                    {/* Chakra 4: Anahata (Heart - Emerald Green) */}
                    <circle cx="100" cy="94" r="5.2" fill="#22C55E" stroke="#15803D" strokeWidth="0.8" filter="url(#chakraGlow)" />
                    <circle cx="100" cy="94" r="2.4" fill="#BBF7D0" />

                    {/* Chakra 5: Manipura (Solar Plexus - Golden Yellow) */}
                    <circle cx="100" cy="108" r="5.2" fill="#EAB308" stroke="#A16207" strokeWidth="0.8" filter="url(#chakraGlow)" />
                    <circle cx="100" cy="108" r="2.4" fill="#FEF08A" />

                    {/* Chakra 6: Svadhishthana (Sacral - Warm Orange) */}
                    <circle cx="100" cy="122" r="5.2" fill="#F97316" stroke="#C2410C" strokeWidth="0.8" filter="url(#chakraGlow)" />
                    <circle cx="100" cy="122" r="2.4" fill="#FFEDD5" />

                    {/* Chakra 7: Muladhara (Root - Deep Crimson Red) */}
                    <circle cx="100" cy="136" r="5.4" fill="#EF4444" stroke="#B91C1C" strokeWidth="0.8" filter="url(#chakraGlow)" />
                    <circle cx="100" cy="136" r="2.5" fill="#FEE2E2" />
                  </svg>
                </div>
              </div>

              {/* Title & Slogan with serif typography matching the warm cream theme */}
              <h1 className="font-serif" style={{
                fontSize: '32px',
                fontWeight: '800',
                letterSpacing: '3px',
                color: '#1B382B',
                marginBottom: '4px',
                position: 'relative',
                zIndex: 5,
                animation: 'fadeSlideUp 0.7s ease forwards'
              }}>
                TWACHA
              </h1>

              <p style={{
                fontSize: '11px',
                color: '#5A6E5D',
                letterSpacing: '1.4px',
                textTransform: 'uppercase',
                marginBottom: '32px',
                fontWeight: '700',
                position: 'relative',
                zIndex: 5
              }}>
                Skin and diet wellness tracker
              </p>

              {/* === Warm Botanical Shimmer Progress Bar === */}
              <div style={{ width: '100%', maxWidth: '220px', position: 'relative', zIndex: 5, marginBottom: '10px' }}>
                <div style={{
                  height: '6px',
                  backgroundColor: '#E5DDCF',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #3D5A40, #6A8E6E, #CFA86A, #6A8E6E, #3D5A40)',
                    backgroundSize: '200% auto',
                    boxShadow: '0 0 12px rgba(61, 90, 64, 0.45)',
                    transition: 'width 0.08s linear',
                    borderRadius: '9999px',
                    animation: progress > 0 ? 'shimmerBar 1.4s linear infinite' : 'none'
                  }} />
                </div>
              </div>

              {/* Counter number in bold forest green */}
              <div style={{
                fontSize: '22px',
                color: '#1B382B',
                fontWeight: '900',
                letterSpacing: '0.5px',
                marginBottom: '4px',
                zIndex: 5,
                position: 'relative',
                animation: 'counterPop 0.15s ease',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {progress}%
              </div>

              {/* Live changing status text */}
              <p style={{
                fontSize: '11.5px',
                color: '#657867',
                fontWeight: '600',
                minHeight: '16px',
                zIndex: 5,
                position: 'relative',
                letterSpacing: '0.2px',
                transition: 'opacity 0.4s ease'
              }}>
                {phaseText}
              </p>
            
              {failed && (
                <div style={{ position: 'relative', zIndex: 6, display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <button onClick={onRetry} style={{ background: '#19231c', color: '#fff', border: 'none', borderRadius: '9999px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Try again</button>
                  <button onClick={onContinue} style={{ background: 'transparent', color: '#19231c', border: '1px solid #19231c', borderRadius: '9999px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Continue anyway</button>
                </div>
              )}
</div>
  );
}
