// ============================================================
// All 5 Custom Spinners for Parley
// ============================================================

import React from 'react'

// ============================================================
// 1. ParleySpinner — Animated scales of justice
// ============================================================
export function ParleySpinner({ size = 48, color = 'var(--accent-cyan)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="ps-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-cyan)" />
          <stop offset="100%" stopColor="var(--accent-purple)" />
        </linearGradient>
      </defs>

      {/* Center pole */}
      <rect x="30.5" y="8" width="3" height="14" rx="1.5" fill="url(#ps-g)" />

      {/* Horizontal beam — rotates slowly */}
      <g style={{ transformOrigin: '32px 22px', animation: 'ps-beam 3s ease-in-out infinite' }}>
        <rect x="14" y="20.5" width="36" height="3" rx="1.5" fill="url(#ps-g)" />

        {/* Left arm (goes up when right goes down) */}
        <g style={{ transformOrigin: '20px 22px', animation: 'ps-left 3s ease-in-out infinite' }}>
          <line x1="20" y1="22" x2="20" y2="36" stroke="url(#ps-g)" strokeWidth="2" strokeLinecap="round" />
          <path d="M13 36 Q20 42 27 36" stroke="url(#ps-g)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="20" cy="36" r="2.5" fill="url(#ps-g)" opacity="0.6" />
        </g>

        {/* Right arm */}
        <g style={{ transformOrigin: '44px 22px', animation: 'ps-right 3s ease-in-out infinite' }}>
          <line x1="44" y1="22" x2="44" y2="36" stroke="url(#ps-g)" strokeWidth="2" strokeLinecap="round" />
          <path d="M37 36 Q44 42 51 36" stroke="url(#ps-g)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="44" cy="36" r="2.5" fill="url(#ps-g)" opacity="0.6" />
        </g>
      </g>

      {/* Handle */}
      <rect x="30.5" y="46" width="3" height="10" rx="1.5" fill="url(#ps-g)" opacity="0.6" />
      <rect x="27" y="54" width="10" height="3" rx="1.5" fill="url(#ps-g)" opacity="0.4" />

      {/* Top gem — pulses */}
      <path d="M32 4 L36 8 L32 12 L28 8 Z" fill={color} style={{ animation: 'ps-gem 3s ease-in-out infinite' }} />

      <style>{`
        @keyframes ps-beam {
          0%, 100% { transform: rotate(0deg); }
          33% { transform: rotate(-5deg); }
          66% { transform: rotate(5deg); }
        }
        @keyframes ps-left {
          0%, 100% { transform: translateY(0); }
          33% { transform: translateY(-6px); }
          66% { transform: translateY(4px); }
        }
        @keyframes ps-right {
          0%, 100% { transform: translateY(0); }
          33% { transform: translateY(4px); }
          66% { transform: translateY(-6px); }
        }
        @keyframes ps-gem {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </svg>
  )
}

// ============================================================
// 2. MochiSpinner — Cat silhouette spinning with tail wag
// ============================================================
export function MochiSpinner({ size = 48 }) {
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {/* Outer orbit ring */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        style={{
          position: 'absolute',
          animation: 'ms-orbit 1.5s linear infinite',
        }}
      >
        <defs>
          <linearGradient id="ms-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0" />
            <stop offset="50%" stopColor="#EC4899" stopOpacity="1" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="28" stroke="url(#ms-g)" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="120 60" />
      </svg>

      {/* Cat face */}
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 40 40" style={{ animation: 'ms-bounce 1.5s ease-in-out infinite' }}>
        {/* Head */}
        <circle cx="20" cy="22" r="14" fill="#1A1A2E" stroke="#7C3AED" strokeWidth="1.5" />
        {/* Visor */}
        <ellipse cx="20" cy="24" rx="10" ry="8" fill="#0A0A14" />
        {/* Eyes */}
        <ellipse cx="16" cy="23" rx="3" ry="2" fill="#00F5FF" style={{ animation: 'ms-eye 1.5s ease-in-out infinite' }} />
        <ellipse cx="24" cy="23" rx="3" ry="2" fill="#00F5FF" style={{ animation: 'ms-eye 1.5s ease-in-out infinite' }} />
        {/* Ears */}
        <path d="M8 12 L12 6 L16 12" fill="#EC4899" />
        <path d="M24 12 L28 6 L32 12" fill="#7C3AED" />
      </svg>

      <style>{`
        @keyframes ms-orbit { to { transform: rotate(360deg); } }
        @keyframes ms-bounce {
          0%, 100% { transform: scale(1) rotate(-3deg); }
          50% { transform: scale(1.08) rotate(3deg); }
        }
        @keyframes ms-eye {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
      `}</style>
    </div>
  )
}

// ============================================================
// 3. HexSpinner — Hexagonal blockchain pattern
// ============================================================
export function HexSpinner({ size = 48 }) {
  const hexPoints = (cx, cy, r) => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
    }).join(' ')
  }

  const hexes = [
    { cx: 32, cy: 32, r: 12, delay: '0s', scale: 1 },
    { cx: 32, cy: 14, r: 7, delay: '0.1s', scale: 0.7 },
    { cx: 47, cy: 23, r: 7, delay: '0.2s', scale: 0.7 },
    { cx: 47, cy: 41, r: 7, delay: '0.3s', scale: 0.7 },
    { cx: 32, cy: 50, r: 7, delay: '0.4s', scale: 0.7 },
    { cx: 17, cy: 41, r: 7, delay: '0.5s', scale: 0.7 },
    { cx: 17, cy: 23, r: 7, delay: '0.6s', scale: 0.7 },
  ]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ animation: 'hs-spin 3s linear infinite' }}
    >
      <defs>
        <linearGradient id="hs-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-cyan)" />
          <stop offset="100%" stopColor="var(--accent-purple)" />
        </linearGradient>
      </defs>
      {hexes.map((h, i) => (
        <polygon
          key={i}
          points={hexPoints(h.cx, h.cy, h.r)}
          fill={i === 0 ? 'url(#hs-g)' : 'none'}
          stroke="url(#hs-g)"
          strokeWidth={i === 0 ? 0 : 1.5}
          opacity={i === 0 ? 0.8 : 0.5}
          style={{
            animation: `hs-pulse 1.8s ease-in-out ${h.delay} infinite`,
            transformOrigin: `${h.cx}px ${h.cy}px`,
          }}
        />
      ))}
      <style>{`
        @keyframes hs-spin { to { transform: rotate(360deg); } }
        @keyframes hs-pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </svg>
  )
}

// ============================================================
// 4. CourtSpinner — Gavel swinging animation
// ============================================================
export function CourtSpinner({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="cs-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-purple)" />
          <stop offset="100%" stopColor="var(--accent-pink)" />
        </linearGradient>
      </defs>

      {/* Sound waves */}
      {[1, 2, 3].map((i) => (
        <circle
          key={i}
          cx="32"
          cy="48"
          r={8 + i * 6}
          stroke="url(#cs-g)"
          strokeWidth="1"
          fill="none"
          opacity={0.3 / i}
          style={{ animation: `cs-wave 1.5s ease-out ${i * 0.3}s infinite` }}
        />
      ))}

      {/* Gavel handle */}
      <g style={{ transformOrigin: '20px 44px', animation: 'cs-swing 1.2s ease-in-out infinite' }}>
        <rect x="16" y="24" width="8" height="32" rx="4" fill="url(#cs-g)" />
      </g>

      {/* Gavel head */}
      <g style={{ transformOrigin: '20px 28px', animation: 'cs-swing 1.2s ease-in-out infinite' }}>
        <rect x="10" y="14" width="30" height="16" rx="6" fill="url(#cs-g)" />
        <rect x="12" y="16" width="8" height="12" rx="3" fill="var(--accent-purple)" opacity="0.5" />
        <rect x="34" y="16" width="4" height="12" rx="2" fill="var(--accent-pink)" opacity="0.5" />
      </g>

      {/* Impact burst */}
      <g style={{ animation: 'cs-burst 1.2s ease-in-out infinite' }}>
        <line x1="46" y1="38" x2="54" y2="30" stroke="var(--accent-pink)" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="40" x2="58" y2="38" stroke="var(--accent-pink)" strokeWidth="2" strokeLinecap="round" />
        <line x1="46" y1="44" x2="54" y2="46" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" />
      </g>

      <style>{`
        @keyframes cs-swing {
          0% { transform: rotate(-30deg); }
          45% { transform: rotate(15deg); }
          55% { transform: rotate(15deg); }
          100% { transform: rotate(-30deg); }
        }
        @keyframes cs-burst {
          0%, 40% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
          70%, 100% { opacity: 0; transform: scale(1.2); }
        }
        @keyframes cs-wave {
          0% { transform: scale(0.5); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </svg>
  )
}

// ============================================================
// 5. OrbitSpinner — Multiple orbital rings
// ============================================================
export function OrbitSpinner({ size = 48 }) {
  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Core */}
      <div style={{
        width: size * 0.2,
        height: size * 0.2,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
        boxShadow: '0 0 12px var(--accent-cyan)',
        zIndex: 1,
        animation: 'os-pulse 2s ease-in-out infinite',
      }} />

      {/* Ring 1 */}
      <div style={{
        position: 'absolute',
        width: size * 0.5,
        height: size * 0.5,
        borderRadius: '50%',
        border: '2px solid transparent',
        borderTopColor: 'var(--accent-cyan)',
        borderRightColor: 'var(--accent-cyan)',
        animation: 'os-orbit1 1s linear infinite',
      }} />

      {/* Ring 2 — tilted */}
      <div style={{
        position: 'absolute',
        width: size * 0.72,
        height: size * 0.72,
        borderRadius: '50%',
        border: '2px solid transparent',
        borderTopColor: 'var(--accent-purple)',
        borderLeftColor: 'var(--accent-purple)',
        animation: 'os-orbit2 1.4s linear infinite reverse',
        transform: 'rotateX(60deg)',
      }} />

      {/* Ring 3 */}
      <div style={{
        position: 'absolute',
        width: size * 0.95,
        height: size * 0.95,
        borderRadius: '50%',
        border: '1.5px solid transparent',
        borderTopColor: 'var(--accent-pink)',
        animation: 'os-orbit1 2s linear infinite',
        opacity: 0.7,
      }} />

      {/* Orbiting dot on ring 1 */}
      <div style={{
        position: 'absolute',
        width: size * 0.5,
        height: size * 0.5,
        animation: 'os-orbit1 1s linear infinite',
      }}>
        <div style={{
          width: size * 0.12,
          height: size * 0.12,
          borderRadius: '50%',
          background: 'var(--accent-cyan)',
          boxShadow: '0 0 8px var(--accent-cyan)',
          position: 'absolute',
          top: '-' + (size * 0.06) + 'px',
          left: '50%',
          transform: 'translateX(-50%)',
        }} />
      </div>

      <style>{`
        @keyframes os-orbit1 { to { transform: rotate(360deg); } }
        @keyframes os-orbit2 { to { transform: rotateX(60deg) rotate(360deg); } }
        @keyframes os-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 8px var(--accent-cyan); }
          50% { transform: scale(1.3); box-shadow: 0 0 20px var(--accent-cyan), 0 0 40px var(--accent-purple); }
        }
      `}</style>
    </div>
  )
}

// Default export — a picker component
export default function SpinnerShowcase() {
  return (
    <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
      <ParleySpinner size={56} />
      <MochiSpinner size={56} />
      <HexSpinner size={56} />
      <CourtSpinner size={56} />
      <OrbitSpinner size={56} />
    </div>
  )
}
