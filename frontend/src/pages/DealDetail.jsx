import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Clock, Shield, Pin, ExternalLink, Scale,
  CheckCircle, XCircle, FileText, MessageSquare, Star,
  Copy, Check, RefreshCw, Loader, AlertTriangle, Gavel
} from 'lucide-react'
import useDealsStore from '@store/useDealsStore'
import useWalletStore from '@store/useWalletStore'
import { STATES } from '@data/mockData'
import StateFlow from '@components/deals/StateFlow'
import { ParleySpinner, CourtSpinner } from '@components/spinners/Spinners'
import {
  approveDeal, rejectDeal, replyDeal, ruleDeal, claimDeal,
  finalizeDeal, expireDeal, releaseDeal, withdrawOffer, acceptDeal,
  deliver, weiToGen, fetchOwed,
} from '@data/parleyService'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtAddr(a) {
  if (!a) return '—'
  return a.slice(0, 8) + '…' + a.slice(-6)
}
function fmt(ts) {
  if (!ts) return '—'
  const diff = ts - Date.now()
  const abs = Math.abs(diff)
  const days = Math.floor(abs / 86400000)
  const hrs = Math.floor((abs % 86400000) / 3600000)
  return diff > 0 ? `${days}d ${hrs}h remaining` : `${days}d ${hrs}h ago`
}

function AddressChip({ address }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <button onClick={copy} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'monospace', fontSize: 11, color: 'var(--accent-cyan)', background: 'var(--accent-cyan-dim)', border: '1px solid var(--accent-cyan)', borderRadius: 6, padding: '3px 9px', cursor: 'pointer' }}>
      {fmtAddr(address)} {copied ? <Check size={10} /> : <Copy size={10} />}
    </button>
  )
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionButton({ label, onClick, variant = 'primary', disabled = false, icon: Icon }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [err, setErr] = useState(null)

  const handle = async () => {
    setLoading(true); setErr(null)
    try {
      await onClick()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setErr(e.reason ?? e.message ?? 'Transaction failed')
    }
    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={handle}
        disabled={disabled || loading}
        className={variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
        style={{ width: '100%', justifyContent: 'center', opacity: (disabled || loading) ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        {loading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : Icon ? <Icon size={15} /> : null}
        {loading ? 'Waiting…' : success ? '✓ Done!' : label}
      </button>
      {err && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--state-disputed)', lineHeight: 1.4 }}>{err}</div>}
    </div>
  )
}

// ─── Criteria Item ─────────────────────────────────────────────────────────
function CriteriaItem({ criterion, ruling, index }) {
  const sc = ruling?.status
  const color = sc === 2 ? 'var(--state-settled)' : sc === 1 ? 'var(--state-active)' : sc === 0 ? 'var(--state-disputed)' : 'var(--text-muted)'
  const label = sc === 2 ? 'Fully Met' : sc === 1 ? 'Partly Met' : sc === 0 ? 'Not Met' : 'Pending'

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}
      style={{ padding: '14px 18px', borderRadius: 12, border: `1px solid ${ruling ? color + '40' : 'var(--border-primary)'}`, background: ruling ? color + '08' : 'var(--bg-glass)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, flex: 1 }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 2 }}>{index + 1}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: ruling?.quote ? 8 : 0 }}>{criterion}</div>
            {ruling?.quote && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderLeft: `3px solid ${color}`, padding: '8px 12px', borderRadius: '0 6px 6px 0', fontStyle: 'italic' }}>
                "{ruling.quote}"
              </div>
            )}
          </div>
        </div>
        {ruling && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color, fontSize: 12, fontWeight: 700 }}>
              {sc === 2 ? <CheckCircle size={14}/> : sc === 1 ? <Star size={14}/> : <XCircle size={14}/>} {label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ruling.credit ?? sc}/{2} pts</div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DealDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getDeal, loadDeal } = useDealsStore()
  const { address, isConnected } = useWalletStore()

  const [deal, setDeal] = useState(getDeal(id))
  const [loading, setLoading] = useState(!deal)
  const [tab, setTab] = useState('overview')

  // Load from chain if not cached
  useEffect(() => {
    if (!deal) {
      setLoading(true)
      loadDeal(id)
        .then(d => { setDeal(d); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [id])

  // Refresh deal after an action
  const refreshDeal = async () => {
    setLoading(true)
    const d = await loadDeal(id)
    setDeal(d)
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <CourtSpinner size={64} />
        <div style={{ color: 'var(--text-secondary)' }}>Loading deal from Studionet…</div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <AlertTriangle size={48} style={{ color: 'var(--state-disputed)' }} />
        <div style={{ color: 'var(--text-secondary)' }}>Deal #{id} not found on Studionet</div>
        <Link to="/deals" className="btn-secondary">← Back to Deals</Link>
      </div>
    )
  }

  const state = STATES[deal.state] ?? STATES[0]
  const bondAmount = (parseFloat(deal.price) * deal.bondBps / 10000).toFixed(4)
  const depositAmount = Math.max(parseFloat(deal.price) * 0.03, 0.005).toFixed(4)
  const appealAmount = Math.max(parseFloat(deal.price) * 0.1, 0.02).toFixed(4)

  const isClient = address && deal.client?.toLowerCase() === address.toLowerCase()
  const isProvider = address && deal.provider?.toLowerCase() === address.toLowerCase()

  const tabs = ['overview', 'criteria', 'filings', 'lifecycle']
  const ruling = deal.ruling ?? null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 80 }}>
      <div className="container" style={{ padding: '40px 24px' }}>

        {/* Back */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
          <Link to="/deals" className="btn-ghost"><ArrowLeft size={16} /> Back to Deals</Link>
          <button onClick={refreshDeal} className="btn-ghost" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <a
            href={`https://studio.genlayer.com/address/${deal.client}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-ghost" style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 12 }}
          >
            <ExternalLink size={12} /> Explorer
          </a>
        </div>

        {/* State banner */}
        <div style={{
          background: state.color + '12', border: `1px solid ${state.color}44`,
          borderRadius: 16, padding: '14px 22px', marginBottom: 30,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: state.color, animation: 'pulse 2s infinite' }} />
          <span style={{ fontWeight: 700, color: state.color, fontSize: 14 }}>{state.label}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>· Deal #{deal.id}</span>
          {deal.pinned && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--accent-purple)', padding: '3px 8px', borderRadius: 20, background: 'var(--accent-purple-dim)', border: '1px solid var(--accent-purple)', marginLeft: 4 }}>
              <Pin size={9} /> PINNED
            </span>
          )}
          {deal.completionBps !== null && (
            <span style={{ marginLeft: 'auto', color: state.color, fontWeight: 800, fontSize: 20, fontFamily: 'Orbitron, sans-serif' }}>
              {(deal.completionBps / 100).toFixed(1)}% Complete
            </span>
          )}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>

          {/* ─── LEFT ──────────────────────────────────────────────────────── */}
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}>{deal.title}</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-primary)', marginBottom: 28 }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '10px 18px', borderRadius: '10px 10px 0 0',
                  fontSize: 13, fontWeight: tab === t ? 700 : 500, cursor: 'pointer',
                  border: 'none', borderBottom: tab === t ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                  background: 'transparent',
                  color: tab === t ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
                  textTransform: 'capitalize', transition: 'all 0.2s',
                }}>{t}</button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

                {/* OVERVIEW */}
                {tab === 'overview' && (
                  <div>
                    <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Scope of Work</h3>
                    <div style={{ padding: '18px', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-primary)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                      {deal.scope}
                    </div>

                    {deal.deliveryUrl && (
                      <div style={{ marginBottom: 20 }}>
                        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Deliverable</h3>
                        <a href={deal.deliveryUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--accent-cyan)', borderRadius: 12, textDecoration: 'none', color: 'var(--accent-cyan)', fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          <ExternalLink size={15} style={{ flexShrink: 0 }} />
                          {deal.deliveryUrl}
                        </a>
                      </div>
                    )}

                    {ruling?.summary && (
                      <div style={{ padding: '18px', background: 'var(--accent-purple-dim)', border: '1px solid var(--accent-purple)', borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <Gavel size={15} style={{ color: 'var(--accent-purple)' }} />
                          <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>AI Court Ruling Summary</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{ruling.summary}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* CRITERIA */}
                {tab === 'criteria' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {deal.criteria.length} acceptance criteria · {deal.completionBps !== null ? `${(deal.completionBps / 100).toFixed(1)}% scored` : 'Pending ruling'}
                    </p>
                    {deal.criteria.map((c, i) => {
                      const cr = ruling?.criteria?.[i] ?? null
                      return <CriteriaItem key={i} criterion={c} ruling={cr} index={i} />
                    })}
                  </div>
                )}

                {/* FILINGS */}
                {tab === 'filings' && (
                  <div>
                    {deal.filings.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <MessageSquare size={36} style={{ marginBottom: 10, opacity: 0.5 }} />
                        <div>No filings yet</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {deal.filings.map((f, i) => (
                          <motion.div key={i}
                            initial={{ opacity: 0, x: f.who === 1 ? -16 : 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                            style={{ padding: '16px 18px', borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderLeft: `3px solid ${f.who === 1 ? 'var(--state-disputed)' : 'var(--state-active)'}` }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: f.who === 1 ? 'var(--state-disputed)' : 'var(--state-active)' }}>
                                {f.who === 1 ? '⚠ CLIENT' : '🔷 PROVIDER'} · Stage {f.stage}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.at ? new Date(f.at).toLocaleDateString() : ''}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.text}</p>
                            {f.url && (
                              <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                                <ExternalLink size={10} /> Evidence
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
                    <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-secondary)' }}>
                      Current state: <strong style={{ color: state.color }}>{state.label}</strong>
                    </p>
                    <StateFlow currentState={deal.state} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ─── RIGHT SIDEBAR ────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Price card */}
            <div className="glass-card" style={{ padding: 22, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>DEAL VALUE</div>
              <div style={{ fontSize: 34, fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color: 'var(--accent-cyan)', marginBottom: 4 }}>
                {parseFloat(deal.price).toFixed(3)} GEN
              </div>
              {deal.bondBps > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                  <Shield size={11} /> Bond: {bondAmount} GEN ({deal.bondBps / 100}%)
                </div>
              )}

              {/* ─── Context-aware actions ─── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>

                {/* Provider: accept open deal */}
                {deal.state === 0 && isConnected && !isClient && (
                  <ActionButton
                    label={`Accept Deal (bond: ${bondAmount} GEN)`}
                    icon={CheckCircle}
                    onClick={() => acceptDeal(deal.id, bondAmount).then(refreshDeal)}
                  />
                )}

                {/* Client: withdraw open deal */}
                {deal.state === 0 && isClient && (
                  <ActionButton label="Withdraw Offer" variant="secondary" icon={XCircle}
                    onClick={() => withdrawOffer(deal.id).then(refreshDeal)} />
                )}

                {/* Client: approve or reject delivered deal */}
                {deal.state === 2 && isClient && (
                  <>
                    <ActionButton label="Approve ✓" icon={CheckCircle}
                      onClick={() => approveDeal(deal.id).then(refreshDeal)} />
                    <ActionButton label={`Reject (deposit: ${depositAmount} GEN)`} variant="secondary" icon={XCircle}
                      onClick={() => {
                        const reason = prompt('Rejection reason:')
                        if (reason) return rejectDeal(deal.id, reason, '', depositAmount).then(refreshDeal)
                      }} />
                  </>
                )}

                {/* Provider: deliver */}
                {deal.state === 1 && isProvider && (
                  <ActionButton label="Submit Delivery" icon={FileText}
                    onClick={() => {
                      const url = prompt('URL of your delivered work:')
                      if (url) return deliver(deal.id, url, '').then(refreshDeal)
                    }} />
                )}

                {/* Anyone: ask court to rule */}
                {deal.state === 3 && isConnected && (
                  <ActionButton label="Ask AI Court to Rule" icon={Gavel}
                    onClick={() => ruleDeal(deal.id).then(refreshDeal)} />
                )}

                {/* Anyone: finalize/expire/release */}
                {deal.state === 4 && isConnected && (
                  <ActionButton label="Finalize Ruling" variant="secondary"
                    onClick={() => finalizeDeal(deal.id).then(refreshDeal)} />
                )}

                {/* Claim payout */}
                {deal.state === 6 && isConnected && (isClient || isProvider) && (
                  <ActionButton label="Claim Payout 💰" icon={CheckCircle}
                    onClick={() => claimDeal(deal.id).then(refreshDeal)} />
                )}

                {/* Expire */}
                {(deal.state === 0 || deal.state === 1) && isConnected && (
                  <ActionButton label="Expire (if past deadline)" variant="secondary"
                    onClick={() => expireDeal(deal.id).then(refreshDeal)} />
                )}

                {/* Release (30 days no ruling) */}
                {(deal.state === 3 || deal.state === 5) && isConnected && (
                  <ActionButton label="Release (30-day timeout)" variant="secondary"
                    onClick={() => releaseDeal(deal.id).then(refreshDeal)} />
                )}
              </div>

              {!isConnected && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', padding: '8px', borderRadius: 8, background: 'var(--bg-glass)' }}>
                  Connect wallet to interact with this deal
                </div>
              )}
            </div>

            {/* Deal Details */}
            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 14 }}>DEAL DETAILS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'CLIENT', value: <AddressChip address={deal.client} /> },
                  { label: 'PROVIDER', value: deal.provider ? <AddressChip address={deal.provider} /> : <span style={{ color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 600 }}>Open to all</span> },
                  { label: 'OFFER EXPIRES', value: fmt(deal.offerEnd) },
                  { label: 'WORK DUE', value: fmt(deal.workEnd) },
                  { label: 'REVIEW ENDS', value: fmt(deal.reviewEnd) },
                  { label: 'CRITERIA', value: `${deal.criteria.length} items` },
                  { label: 'PINNED', value: deal.pinned ? '✓ Yes' : 'No' },
                  { label: 'DEAL ID', value: <span style={{ fontFamily: 'monospace', fontSize: 11 }}>#{deal.id}</span> },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Completion / Ruling */}
            {deal.completionBps !== null && (
              <div className="glass-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10 }}>AI COURT SCORE</div>
                <div style={{ fontSize: 30, fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color: state.color, marginBottom: 6 }}>
                  {(deal.completionBps / 100).toFixed(1)}%
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${deal.completionBps / 100}%` }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
                  Provider earns: {(parseFloat(deal.price) * deal.completionBps / 10000).toFixed(4)} GEN
                </div>
              </div>
            )}

            {/* Your role badge */}
            {isConnected && (isClient || isProvider) && (
              <div style={{
                padding: '12px 16px', borderRadius: 12,
                background: isClient ? 'var(--accent-cyan-dim)' : 'var(--accent-purple-dim)',
                border: `1px solid ${isClient ? 'var(--accent-cyan)' : 'var(--accent-purple)'}`,
                fontSize: 13, fontWeight: 600,
                color: isClient ? 'var(--accent-cyan)' : 'var(--accent-purple)',
                textAlign: 'center',
              }}>
                {isClient ? '👤 You are the Client' : '🔷 You are the Provider'}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
