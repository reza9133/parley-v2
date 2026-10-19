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
      <svg
        width={size}
        height={size}
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* GenLayer logo recreation from the triangle mark */}
        <g fill="currentColor">
          {/* Left wing */}
          <path d="M30 280 L140 20 L180 80 L90 280 Z" />
          {/* Right wing */}
          <path d="M270 280 L160 20 L120 80 L210 280 Z" />
          {/* Inner diamond */}
          <path d="M150 60 L180 130 L150 180 L120 130 Z" />
          {/* Bottom connector */}
          <path d="M120 200 L150 240 L180 200 L165 230 L150 250 L135 230 Z" />
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
