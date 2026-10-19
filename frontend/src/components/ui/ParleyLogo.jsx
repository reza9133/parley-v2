// Parley Logo SVG Component
export default function ParleyLogo({ size = 40, showText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ userSelect: 'none' }}>
      {/* Logo Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="parley-g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F5FF" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="parley-g2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <filter id="parley-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Left scale arm */}
        <path d="M10 30 L22 20 L26 30 Z" fill="url(#parley-g1)" opacity="0.95" />
        <rect x="21.5" y="20" width="2.5" height="18" rx="1.25" fill="url(#parley-g1)" />

        {/* Right scale arm */}
        <path d="M54 30 L42 20 L38 30 Z" fill="url(#parley-g2)" opacity="0.95" />
        <rect x="40" y="20" width="2.5" height="18" rx="1.25" fill="url(#parley-g2)" />

        {/* Center beam */}
        <rect x="18" y="19" width="28" height="3.5" rx="1.75" fill="url(#parley-g1)" />

        {/* Center pole */}
        <rect x="30.75" y="10" width="2.5" height="12" rx="1.25" fill="url(#parley-g1)" />

        {/* Top diamond gem */}
        <path d="M32 5 L37 11 L32 17 L27 11 Z" fill="url(#parley-g1)" filter="url(#parley-glow)" />
        <path d="M32 7.5 L35 11 L32 14.5 L29 11 Z" fill="white" opacity="0.4" />

        {/* Bottom handle */}
        <rect x="29.5" y="38" width="5" height="13" rx="2.5" fill="url(#parley-g2)" />
        <rect x="27" y="49" width="10" height="4" rx="2" fill="url(#parley-g2)" opacity="0.7" />

        {/* Left pan arc */}
        <path d="M10 30 Q18 38 26 30" stroke="url(#parley-g1)" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Right pan arc */}
        <path d="M38 30 Q46 38 54 30" stroke="url(#parley-g2)" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Glow dots */}
        <circle cx="18" cy="30" r="3" fill="url(#parley-g1)" opacity="0.7" />
        <circle cx="46" cy="30" r="3" fill="url(#parley-g2)" opacity="0.7" />
      </svg>

      {/* Wordmark */}
      {showText && (
        <div style={{ lineHeight: 1 }}>
          <div
            className="font-display gradient-text"
            style={{
              fontSize: size * 0.55,
              fontWeight: 800,
              letterSpacing: '0.08em',
            }}
          >
            PARLEY
          </div>
          <div
            style={{
              fontSize: size * 0.22,
              color: 'var(--text-tertiary)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Trustless Escrow
          </div>
        </div>
      )}
    </div>
  )
}
