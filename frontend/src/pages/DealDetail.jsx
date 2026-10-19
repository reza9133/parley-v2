import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Clock, Shield, Pin, ExternalLink, Scale, AlertTriangle,
  CheckCircle, XCircle, FileText, MessageSquare, Star, Copy, Check
} from 'lucide-react'
import { useState, useEffect } from 'react'
import useDealsStore from '@store/useDealsStore'
import DealActions from '@components/deals/DealActions'
import { STATES } from '@data/mockData'
import StateFlow from '@components/deals/StateFlow'
import { ParleySpinner } from '@components/spinners/Spinners'

const day = 86400000
function fmt(ts) {
  if (!ts) return '—'
  const diff = ts - Date.now()
  const absDiff = Math.abs(diff)
  if (absDiff < 60000) return 'just now'
  const days = Math.floor(absDiff / day)
  const hrs = Math.floor((absDiff % day) / 3600000)
  if (diff > 0) return `${days}d ${hrs}h remaining`
  return `${days}d ${hrs}h ago`
}

function fmtAddr(a) {
  if (!a) return '—'
  return a.slice(0, 8) + '…' + a.slice(-6)
}

function AddressChip({ address }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: 'monospace', fontSize: 12,
        color: 'var(--accent-cyan)', background: 'var(--accent-cyan-dim)',
        border: '1px solid var(--accent-cyan)', borderRadius: 8,
        padding: '4px 10px', cursor: 'pointer',
      }}
    >
      {fmtAddr(address)}
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  )
}

function CriteriaItem({ criterion, ruling, index }) {
  const statusColor = ruling?.status === 2 ? 'var(--state-settled)' : ruling?.status === 1 ? 'var(--state-active)' : ruling ? 'var(--state-disputed)' : 'var(--text-muted)'
  const statusIcon = ruling?.status === 2 ? <CheckCircle size={16} /> : ruling?.status === 1 ? <Star size={16} /> : ruling ? <XCircle size={16} /> : null
  const statusLabel = ruling?.status === 2 ? 'Fully Met' : ruling?.status === 1 ? 'Partly Met' : ruling ? 'Not Met' : 'Pending'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        padding: '14px 18px',
        borderRadius: 12,
        border: '1px solid var(--border-primary)',
        background: ruling ? statusColor + '08' : 'var(--bg-glass)',
        borderColor: ruling ? statusColor + '40' : 'var(--border-primary)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, flex: 1 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
            flexShrink: 0, marginTop: 2,
          }}>
            {index + 1}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: ruling?.quote ? 8 : 0 }}>
              {criterion}
            </div>
            {ruling?.quote && (
              <div style={{
                fontSize: 12, color: 'var(--text-secondary)',
                background: 'var(--bg-secondary)', borderLeft: `3px solid ${statusColor}`,
                padding: '8px 12px', borderRadius: '0 6px 6px 0',
                fontStyle: 'italic',
              }}>
                "{ruling.quote}"
              </div>
            )}
          </div>
        </div>
        {ruling && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: statusColor, fontSize: 12, fontWeight: 700 }}>
              {statusIcon} {statusLabel}
            </div>
            <div style={{ fontSize:11, color: 'var(--text-muted)' }}>
              {ruling.credit}/{ruling.maxCredit} pts
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function DealDetail() {
  const { id } = useParams()
  const deal = useDealsStore(s => s.getDeal(id))
  const { loadDeal, loaded } = useDealsStore()
  useEffect(() => { loadDeal(id) }, [id])
  const [tab, setTab] = useState('overview')

  if (!deal && !loaded) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><ParleySpinner size={64} /></div>
  }

  if (!deal) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <ParleySpinner size={64} />
        <div style={{ color: 'var(--text-secondary)' }}>Deal not found</div>
        <Link to="/deals" className="btn-secondary">← Back to Deals</Link>
      </div>
    )
  }

  const state = STATES[deal.state]
  const bondAmount = (parseFloat(deal.price) * deal.bondBps / 10000).toFixed(3)

  const tabs = ['overview', 'criteria', 'filings', 'lifecycle']

  // Mock ruling for settled/ruled deals
  const mockRuling = deal.completionBps !== null ? {
    completion: deal.completionBps / 100,
    summary: 'The delivered work meets most criteria. The documentation is comprehensive and the implementation matches the specification. Minor gaps in test coverage prevent a perfect score.',
    criteria: deal.criteria.map((c, i) => ({
      status: i < deal.criteria.length - 1 ? 2 : 1,
      quote: i < deal.criteria.length - 1 ? `Directly from the page: "${c.slice(0, 60)}..."` : null,
      credit: i < deal.criteria.length - 1 ? 2 : 1,
      maxCredit: 2,
    })),
  } : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 80 }}>
      <div className="container" style={{ padding: '40px 24px' }}>

        {/* Back */}
        <Link to="/deals" className="btn-ghost" style={{ display: 'inline-flex', marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Deals
        </Link>

        {/* State banner */}
        <div style={{
          background: state.color + '12',
          border: `1px solid ${state.color}44`,
          borderRadius: 16,
          padding: '16px 24px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: state.color, animation: 'pulse 2s infinite' }} />
          <span style={{ fontWeight: 700, color: state.color, fontSize: 14, letterSpacing: '0.05em' }}>{state.label}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>· Deal #{deal.id}</span>
          {deal.completionBps !== null && (
            <span style={{ marginLeft: 'auto', color: state.color, fontWeight: 800, fontSize: 18, fontFamily: 'Orbitron, sans-serif' }}>
              {(deal.completionBps / 100).toFixed(1)}% Complete
            </span>
          )}
        </div>

        {/* Main layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>

          {/* Left content */}
          <div>
            {/* Title */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span className={`badge badge-${state.name.toLowerCase()}`}>
                  {state.label}
                </span>
                {deal.pinned && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--accent-purple)', padding: '3px 8px', borderRadius: 20, background: 'var(--accent-purple-dim)', border: '1px solid var(--accent-purple)' }}>
                    <Pin size={9} /> PINNED
                  </span>
                )}
              </div>
              <h1 style={{ margin: '0 0 16px', fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>
                {deal.title}
              </h1>
            </motion.div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-primary)', marginBottom: 28 }}>
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px 10px 0 0',
                    fontSize: 13, fontWeight: tab === t ? 700 : 500, cursor: 'pointer',
                    border: 'none', borderBottom: tab === t ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                    background: 'transparent',
                    color: tab === t ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* OVERVIEW */}
                {tab === 'overview' && (
                  <div>
                    <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)' }}>Scope of Work</h3>
                    <div style={{
                      padding: '20px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 14,
                      border: '1px solid var(--border-primary)',
                      fontSize: 15,
                      lineHeight: 1.7,
                      color: 'var(--text-primary)',
                      marginBottom: 24,
                    }}>
                      {deal.scope}
                    </div>

                    {deal.deliveryUrl && (
                      <div style={{ marginBottom: 24 }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)' }}>Deliverable</h3>
                        <a
                          href={deal.deliveryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '14px 18px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--accent-cyan)',
                            borderRadius: 12, textDecoration: 'none',
                            color: 'var(--accent-cyan)', fontSize: 14,
                            fontFamily: 'monospace',
                          }}
                        >
                          <ExternalLink size={16} />
                          {deal.deliveryUrl.length > 60 ? deal.deliveryUrl.slice(0, 60) + '…' : deal.deliveryUrl}
                        </a>
                      </div>
                    )}

                    {mockRuling && (
                      <div style={{
                        padding: '20px',
                        background: 'var(--accent-purple-dim)',
                        border: '1px solid var(--accent-purple)',
                        borderRadius: 14,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <Scale size={16} style={{ color: 'var(--accent-purple)' }} />
                          <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>Court Ruling Summary</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {mockRuling.summary}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* CRITERIA */}
                {tab === 'criteria' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-secondary)' }}>
                      {deal.criteria.length} acceptance criteria · {deal.completionBps !== null ? `${(deal.completionBps / 100).toFixed(1)}% scored` : 'Pending ruling'}
                    </p>
                    {deal.criteria.map((c, i) => (
                      <CriteriaItem
                        key={i}
                        criterion={c}
                        ruling={mockRuling?.criteria[i] ?? null}
                        index={i}
                      />
                    ))}
                  </div>
                )}

                {/* FILINGS */}
                {tab === 'filings' && (
                  <div>
                    {deal.filings.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <MessageSquare size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                        <div>No filings yet</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {deal.filings.map((f, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: f.who === 1 ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                              padding: '16px 20px',
                              borderRadius: 14,
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-primary)',
                              borderLeft: `4px solid ${f.who === 1 ? 'var(--state-disputed)' : 'var(--state-active)'}`,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                              <span style={{
                                fontSize: 12, fontWeight: 700,
                                color: f.who === 1 ? 'var(--state-disputed)' : 'var(--state-active)',
                              }}>
                                {f.who === 1 ? '⚠ CLIENT' : '🔷 PROVIDER'} · {f.stage === 1 ? 'Dispute' : 'Appeal'}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {new Date(f.at).toLocaleDateString()}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.text}</p>
                            {f.url && (
                              <a href={f.url} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                                <ExternalLink size={11} /> View evidence
                              </a>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* LIFECYCLE */}
                {tab === 'lifecycle' && (
                  <div>
                    <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-secondary)' }}>
                      Current state: <strong style={{ color: state.color }}>{state.label}</strong>
                    </p>
                    <StateFlow currentState={deal.state} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Price card */}
            <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>DEAL VALUE</div>
              <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color: 'var(--accent-cyan)', marginBottom: 4 }}>
                {deal.price} GEN
              </div>
              {deal.bondBps > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
                  <Shield size={13} /> Bond: {bondAmount} GEN ({deal.bondBps / 100}%)
                </div>
              )}
              <DealActions deal={deal} />
            </div>

            {/* Details */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 16 }}>DEAL DETAILS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'CLIENT', value: <AddressChip address={deal.client} /> },
                  { label: 'PROVIDER', value: deal.provider ? <AddressChip address={deal.provider} /> : <span style={{ color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 600 }}>Open to all</span> },
                  { label: 'OFFER EXPIRES', value: fmt(deal.offerEnd) },
                  { label: 'WORK DUE', value: deal.workEnd ? fmt(deal.workEnd) : '—' },
                  { label: 'REVIEW WINDOW', value: deal.reviewEnd ? fmt(deal.reviewEnd) : '—' },
                  { label: 'CRITERIA', value: `${deal.criteria.length} items` },
                  { label: 'PINNED', value: deal.pinned ? 'Yes (immutable links required)' : 'No' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Completion */}
            {deal.completionBps !== null && (
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 12 }}>AI COURT SCORE</div>
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color: state.color, marginBottom: 8 }}>
                  {(deal.completionBps / 100).toFixed(1)}%
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${deal.completionBps / 100}%` }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
                  Provider earns: {(parseFloat(deal.price) * deal.completionBps / 10000).toFixed(3)} GEN
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  )
}
