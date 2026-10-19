import { STATES } from '@data/mockData'
import { motion } from 'framer-motion'

// Visual state machine diagram for deal lifecycle
export default function StateFlow({ currentState = 0, path = 0 }) {
  const states = [
    { id: 0, label: 'OPEN', x: 200, y: 20, ...STATES[0] },
    { id: 1, label: 'ACTIVE', x: 200, y: 100, ...STATES[1] },
    { id: 2, label: 'DELIVERED', x: 200, y: 180, ...STATES[2] },
    { id: 3, label: 'DISPUTED', x: 340, y: 260, ...STATES[3] },
    { id: 4, label: 'RULED', x: 340, y: 340, ...STATES[4] },
    { id: 5, label: 'APPEALED', x: 340, y: 420, ...STATES[5] },
    { id: 6, label: 'SETTLED', x: 200, y: 480, ...STATES[6] },
    { id: 7, label: 'CANCELLED', x: 60, y: 260, ...STATES[7] },
    { id: 8, label: 'DEFAULTED', x: 60, y: 340, ...STATES[8] },
  ]

  const edges = [
    { from: 0, to: 1, label: 'accept_deal' },
    { from: 0, to: 7, label: 'withdraw / expire' },
    { from: 1, to: 2, label: 'deliver' },
    { from: 1, to: 8, label: 'expire (default)' },
    { from: 2, to: 6, label: 'approve / finalize' },
    { from: 2, to: 3, label: 'reject' },
    { from: 3, to: 4, label: 'rule' },
    { from: 3, to: 6, label: 'accept_split / release' },
    { from: 4, to: 5, label: 'appeal' },
    { from: 4, to: 6, label: 'finalize' },
    { from: 5, to: 6, label: 'rule (final) / release' },
  ]

  const W = 440
  const H = 540

  const sx = (s) => states[s]?.x ?? 0
  const sy = (s) => states[s]?.y ?? 0

  return (
    <div style={{ overflowX: 'auto', padding: '20px 0' }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
      >
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-muted)" />
          </marker>
          <marker id="arrow-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-cyan)" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const x1 = sx(edge.from), y1 = sy(edge.from) + 16
          const x2 = sx(edge.to), y2 = sy(edge.to) - 4
          const isActive = edge.from === currentState || edge.to === currentState
          const mx = (x1 + x2) / 2
          const my = (y1 + y2) / 2

          return (
            <g key={i}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isActive ? 'var(--accent-cyan)' : 'var(--border-primary)'}
                strokeWidth={isActive ? 2 : 1}
                markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow)'}
                strokeDasharray={isActive ? '0' : '4 3'}
                style={{ transition: 'all 0.4s ease' }}
              />
              {isActive && (
                <text
                  x={mx + 4}
                  y={my}
                  fill="var(--text-tertiary)"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {edge.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {states.map((s) => {
          const isCurrent = s.id === currentState
          const isPast = s.id < currentState && s.id <= 6
          return (
            <motion.g
              key={s.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: s.id * 0.05, duration: 0.3 }}
            >
              {/* Glow ring for current */}
              {isCurrent && (
                <circle
                  cx={s.x} cy={s.y}
                  r={26}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  opacity="0.4"
                  style={{ animation: 'pulse-ring 2s ease-in-out infinite' }}
                />
              )}
              {/* Node circle */}
              <circle
                cx={s.x}
                cy={s.y}
                r={18}
                fill={isCurrent ? s.color + '22' : 'var(--bg-secondary)'}
                stroke={isCurrent ? s.color : isPast ? s.color + '60' : 'var(--border-primary)'}
                strokeWidth={isCurrent ? 2.5 : 1.5}
                style={{ transition: 'all 0.3s ease' }}
              />
              {/* State label */}
              <text
                x={s.x}
                y={s.y + 4}
                fill={isCurrent ? s.color : isPast ? s.color : 'var(--text-muted)'}
                fontSize="8"
                fontFamily="monospace"
                fontWeight={isCurrent ? '700' : '500'}
                textAnchor="middle"
              >
                {s.label}
              </text>
            </motion.g>
          )
        })}

        <style>{`
          @keyframes pulse-ring {
            0%, 100% { r: 24; opacity: 0.3; }
            50% { r: 28; opacity: 0.6; }
          }
        `}</style>
      </svg>
    </div>
  )
}
