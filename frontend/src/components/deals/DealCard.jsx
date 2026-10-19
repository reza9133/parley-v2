import { STATES } from '@data/mockData'
import { Clock, Link as LinkIcon, Shield, Pin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function formatPrice(p) {
  return parseFloat(p).toFixed(1) + ' GEN'
}

function formatTime(ts) {
  const diff = ts - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hours}h`
  const mins = Math.floor((diff % 3600000) / 60000)
  return `${hours}h ${mins}m`
}

function formatAddress(addr) {
  if (!addr) return 'Anyone'
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

export default function DealCard({ deal, index = 0 }) {
  const state = STATES[deal.state]
  if (!state) return null

  const bondAmount = deal.price * deal.bondBps / 10000

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={`/deals/${deal.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          className="glass-card"
          style={{
            padding: '20px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* State color accent bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '2px',
            background: `linear-gradient(90deg, ${state.color}, transparent)`,
          }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                <span className={`badge badge-${state.name.toLowerCase()}`}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: state.color, display: 'inline-block' }} />
                  {state.label}
                </span>
                {deal.pinned && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 600, color: 'var(--accent-purple)',
                    padding: '3px 8px', borderRadius: 20,
                    background: 'var(--accent-purple-dim)',
                    border: '1px solid var(--accent-purple)',
                  }}>
                    <Pin size={9} /> PINNED
                  </span>
                )}
              </div>
              <h3 style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
              }}>
                {deal.title}
              </h3>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'Orbitron, sans-serif' }}>
                {formatPrice(deal.price)}
              </div>
              {deal.bondBps > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <Shield size={9} /> Bond: {formatPrice(bondAmount.toFixed(2))}
                </div>
              )}
            </div>
          </div>

          {/* Scope preview */}
          <p style={{
            margin: '0 0 14px',
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {deal.scope}
          </p>

          {/* Criteria count */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
            {deal.criteria.slice(0, 2).map((c, i) => (
              <span key={i} style={{
                fontSize: 11,
                padding: '3px 9px',
                borderRadius: 20,
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-tertiary)',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                maxWidth: '200px',
              }}>
                ✓ {c}
              </span>
            ))}
            {deal.criteria.length > 2 && (
              <span style={{
                fontSize: 11,
                padding: '3px 9px',
                borderRadius: 20,
                background: 'var(--accent-purple-dim)',
                border: '1px solid var(--accent-purple)',
                color: 'var(--accent-purple)',
              }}>
                +{deal.criteria.length - 2} more
              </span>
            )}
          </div>

          {/* Completion bar (if ruled/settled) */}
          {deal.completionBps !== null && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Completion</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: state.color }}>
                  {(deal.completionBps / 100).toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${deal.completionBps / 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer: parties + time */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 14,
            borderTop: '1px solid var(--border-primary)',
          }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>CLIENT</div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {formatAddress(deal.client)}
                </div>
              </div>
              {deal.provider && (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>PROVIDER</div>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {formatAddress(deal.provider)}
                  </div>
                </div>
              )}
              {!deal.provider && deal.openToAny && (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>PROVIDER</div>
                  <div style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600 }}>Open to all</div>
                </div>
              )}
            </div>

            {/* Time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-tertiary)' }}>
              <Clock size={12} />
              {deal.state === 0 && deal.offerEnd && `Offer: ${formatTime(deal.offerEnd)}`}
              {deal.state === 1 && deal.workEnd && `Due: ${formatTime(deal.workEnd)}`}
              {deal.state === 2 && deal.reviewEnd && `Review: ${formatTime(deal.reviewEnd)}`}
              {deal.state >= 6 && 'Closed'}
            </div>
          </div>

          {/* Hover glow effect */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            opacity: 0,
            background: `radial-gradient(circle at 50% 0%, ${state.color}15, transparent 70%)`,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}
          />
        </div>
      </Link>
    </motion.div>
  )
}
