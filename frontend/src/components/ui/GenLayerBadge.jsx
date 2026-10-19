// GenLayer Logo Badge Component
export default function GenLayerBadge({ size = 28, showText = false, className = '' }) {
  return (
    <a
      href="https://genlayer.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity duration-200 ${className}`}
      title="Powered by GenLayer"
    >
      <svg width={size} height={size} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="GenLayer">
        <g fill="currentColor">
          <path d="M183 33 V150 L125 268 L183 308 L22 372 Z" />
          <path d="M217 33 V150 L275 268 L217 308 L378 372 Z" />
          <path d="M200 195 L236 266 L200 286 L164 266 Z" />
        </g>
      </svg>
      {showText && (
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'currentColor' }}>
          GENLAYER
        </span>
      )}
    </a>
  )
}
