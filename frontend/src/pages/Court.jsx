import { motion } from 'framer-motion'
import { Gavel, Scale, Brain, Clock, ExternalLink, CheckCircle, Star, XCircle, RefreshCw } from 'lucide-react'
import { mockDeals, STATES } from '@data/mockData'
import { Link } from 'react-router-dom'

const disputedDeals = mockDeals.filter(d => [3, 4, 5].length && [3, 4, 5].includes(d.state))

function RulingCard({ deal }) {
  const state = STATES[deal.state]
  const hasFinalRuling = deal.completionBps !== null
  const pct = deal.completionBps ? (deal.completionBps / 100).toFixed(1) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{ padding: 24, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${state.color}, transparent)` }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <span className={`badge badge-${state.name.toLowerCase()}`} style={{ marginBottom: 8, display: 'inline-block' }}>{state.label}</span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{deal.title}</h3>
        </div>
        {pct && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color: state.color }}>{pct}%</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>COMPLETION</div>
          </div>
        )}
      </div>

      {/* Criteria preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {deal.criteria.slice(0, 2).map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
            {hasFinalRuling
              ? i < deal.criteria.length - 1
                ? <CheckCircle size={14} style={{ color: 'var(--state-settled)', flexShrink: 0, marginTop: 2 }} />
                : <Star size={14} style={{ color: 'var(--state-active)', flexShrink: 0, marginTop: 2 }} />
              : <Clock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
            }
            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{c}</span>
          </div>
        ))}
      </div>

      {pct && (
        <div style={{ marginBottom: 16 }}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: pct + '%' }} />
          </div>
        </div>
      )}

      {/* Filings count */}
      {deal.filings.length > 0 && (
        <div style={{
          display: 'flex', gap: 12, padding: '10px 14px',
          background: 'var(--bg-glass)', borderRadius: 10,
          border: '1px solid var(--border-primary)', marginBottom: 16,
          fontSize: 12, color: 'var(--text-secondary)',
        }}>
          <span>📋 {deal.filings.length} filing{deal.filings.length > 1 ? 's' : ''}</span>
          <span>👥 {deal.filings.filter(f => f.who === 1).length} client · {deal.filings.filter(f => f.who === 2).length} provider</span>
        </div>
      )}

      <Link to={`/deals/${deal.id}`} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
        View Full Case <ExternalLink size={13} />
      </Link>
    </motion.div>
  )
}

export default function Court() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 80 }}>
      <div className="container" style={{ padding: '40px 24px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, var(--accent-purple-dim), var(--accent-pink-dim))',
              border: '1px solid var(--accent-purple)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Gavel size={26} style={{ color: 'var(--accent-purple)' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, fontFamily: 'Orbitron, sans-serif' }}>
                <span className="gradient-text-purple-pink">AI Court</span>
              </h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>GenLayer Intelligent Contract Rulings</p>
            </div>
          </div>

          {/* Explainer */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
            padding: '24px', background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)', borderRadius: 16,
          }}>
            {[
              { icon: Brain, title: 'AI reads the page', desc: 'Each validator fetches and reads the delivered URL independently', color: 'var(--accent-cyan)' },
              { icon: Scale, title: 'Criterion by criterion', desc: 'Every criterion is scored 0, 1, or 2. Quotes must appear verbatim.', color: 'var(--accent-purple)' },
              { icon: CheckCircle, title: 'Consensus required', desc: 'Validators check each other — one biased model cannot swing the result', color: 'var(--accent-pink)' },
            ].map(({ icon: I, title, desc, color }) => (
              <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <I size={18} style={{ color, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Score table */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>Scoring System</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: CheckCircle, status: 'Fully Met', score: '2 pts', color: 'var(--state-settled)', desc: 'Evidence clearly present with a verifiable quote' },
              { icon: Star, status: 'Partly Met', score: '1 pt', color: 'var(--state-active)', desc: 'Evidence partially present or incomplete' },
              { icon: XCircle, status: 'Not Met', score: '0 pts', color: 'var(--state-disputed)', desc: 'No evidence found on the delivered page' },
            ].map(({ icon: I, status, score, color, desc }) => (
              <div key={status} className="glass-card" style={{ padding: 20, borderColor: color + '33' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <I size={18} style={{ color }} />
                  <span style={{ fontWeight: 700, color, fontSize: 14 }}>{status}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'Orbitron, sans-serif', fontSize: 16, fontWeight: 800, color }}>{score}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payout Rules */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>Payout Rules</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Outcome', 'Completion', 'Client Gets', 'Provider Gets'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Approved / Silent', '100%', '0', 'Price + Bond'],
                  ['Ruling ≥ 80%', '≥ 80%', 'Price - Earned', 'Earned + Bond + Client Deposit'],
                  ['Ruling 30%–80%', '30–80%', 'Price - Earned + Own Deposit', 'Earned + Bond'],
                  ['Ruling ≤ 30%', '≤ 30%', 'Price - Earned + Provider Bond + Own Deposit', 'Earned'],
                  ['Negotiated Split', 'Agreed', 'Own Deposit + (Price - Agreed)', 'Agreed + Bond'],
                  ['Default', '0%', 'Price + Bond', '0'],
                  ['Cancelled', '0%', 'Price', '0'],
                ].map(([outcome, comp, client, provider]) => (
                  <tr key={outcome} style={{ borderBottom: '1px solid var(--border-primary)', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{outcome}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--accent-cyan)', fontFamily: 'Orbitron, sans-serif' }}>{comp}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{client}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{provider}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active cases */}
        <div>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>Active Cases</h2>
          {disputedDeals.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {disputedDeals.map(deal => <RulingCard key={deal.id} deal={deal} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Scale size={40} style={{ marginBottom: 12 }} />
              <div>No active disputes</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
