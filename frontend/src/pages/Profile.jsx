import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User, ExternalLink, Copy, Check, Star, TrendingUp,
  Shield, Award, Clock, XCircle, AlertTriangle, BarChart2,
  Briefcase, CheckCircle, Scale,
} from 'lucide-react'
import useWalletStore from '@store/useWalletStore'
import useDealsStore from '@store/useDealsStore'
import { fetchProfile, fetchDealsOf, normalizeChainDeal, weiToGen } from '@data/parleyService'
import { mockProfiles, STATES } from '@data/mockData'
import { ParleySpinner } from '@components/spinners/Spinners'
import { useAnimatedCounter } from '@hooks/useAnimatedCounter'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtAddr(a) {
  if (!a) return '—'
  return a.slice(0, 8) + '…' + a.slice(-6)
}

function AddressChip({ address }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(address).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', color: 'var(--text-secondary)' }}>
      {fmtAddr(address)}
      <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--accent-cyan)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0 }}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
      <a href={`https://studio.genlayer.com/address/${address}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
        <ExternalLink size={12} />
      </a>
    </span>
  )
}

// ─── Animated Stat Card ───────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'var(--accent-cyan)', suffix = '', delay = 0 }) {
  const animated = useAnimatedCounter(Number(value) || 0, 1400, delay)
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.5 }}
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}
      className="card-hover"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
        <Icon size={15} style={{ color }} />
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Orbitron, sans-serif', color }}>
        {isNaN(Number(value)) ? value : animated}{suffix}
      </div>
    </motion.div>
  )
}

// ─── Deal Row ─────────────────────────────────────────────────────────────────
function DealRow({ deal, address }) {
  const state = STATES[deal.state] || STATES[0]
  const isClient = deal.client?.toLowerCase() === address?.toLowerCase()
  const isProvider = deal.provider?.toLowerCase() === address?.toLowerCase()

  return (
    <Link to={`/deals/${deal.id}`} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ x: 4, background: 'var(--bg-tertiary)' }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
      >
        <span style={{ background: state.bg, color: state.color, border: `1px solid ${state.color}`, borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {state.label}
        </span>
        <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {deal.title || `Deal #${deal.id}`}
        </span>
        {isClient && (
          <span style={{ fontSize: 11, color: 'var(--accent-cyan)', background: 'rgba(0,245,255,0.1)', border: '1px solid var(--accent-cyan)', borderRadius: 6, padding: '2px 6px' }}>Client</span>
        )}
        {isProvider && (
          <span style={{ fontSize: 11, color: 'var(--accent-purple)', background: 'rgba(139,92,246,0.1)', border: '1px solid var(--accent-purple)', borderRadius: 6, padding: '2px 6px' }}>Provider</span>
        )}
        <span style={{ color: 'var(--accent-cyan)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
          {deal.price ? `${weiToGen(deal.price)} GEN` : '—'}
        </span>
      </motion.div>
    </Link>
  )
}

// ─── Reputation Ring ──────────────────────────────────────────────────────────
function ReputationRing({ score }) {
  // score 0-100
  const r = 44
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="120" height="120" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease' }}
        />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Orbitron, sans-serif', color }}>{score}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>SCORE</div>
      </div>
    </div>
  )
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function Profile() {
  const { address: paramAddress } = useParams()
  const { address: walletAddress } = useWalletStore()
  const { deals: allDeals } = useDealsStore()

  const address = paramAddress || walletAddress

  const [profile, setProfile] = useState(null)
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('overview')

  const isOwnProfile = address?.toLowerCase() === walletAddress?.toLowerCase()

  // ─── Load profile + deals ────────────────────────────────────────────────
  useEffect(() => {
    if (!address) { setLoading(false); return }
    setLoading(true)
    setError(null)

    const fallbackProfile = mockProfiles?.[address] || {
      address,
      opened: 0, taken: 0, settled: 0, delivered: 0,
      failed: 0, defaulted: 0, cancelled: 0,
      disputesWon: 0, disputesLost: 0,
      volume: '0', avgCompletion: '0',
    }

    // Try real chain first, fall back to mock
    fetchProfile(address)
      .then(p => setProfile(p && p.address ? p : fallbackProfile))
      .catch(() => setProfile(fallbackProfile))
      .finally(() => {})

    // Load deals for this address
    fetchDealsOf(address)
      .then(raw => {
        const normalized = Array.isArray(raw) ? raw.map(normalizeChainDeal) : []
        setDeals(normalized.length ? normalized : (allDeals || []).filter(d =>
          d.client?.toLowerCase() === address.toLowerCase() ||
          d.provider?.toLowerCase() === address.toLowerCase()
        ))
      })
      .catch(() => {
        setDeals((allDeals || []).filter(d =>
          d.client?.toLowerCase() === address?.toLowerCase() ||
          d.provider?.toLowerCase() === address?.toLowerCase()
        ))
      })
      .finally(() => setLoading(false))
  }, [address, allDeals])

  // ─── Derived stats ────────────────────────────────────────────────────────
  const reputation = profile ? Math.min(100, Math.round(
    ((profile.settled || 0) / Math.max(1, (profile.opened || 0) + (profile.taken || 0))) * 100
  )) : 0

  const totalDeals = (profile?.opened || 0) + (profile?.taken || 0)
  const successRate = totalDeals > 0
    ? Math.round((profile.settled / totalDeals) * 100)
    : 0

  const clientDeals = deals.filter(d => d.client?.toLowerCase() === address?.toLowerCase())
  const providerDeals = deals.filter(d => d.provider?.toLowerCase() === address?.toLowerCase())
  const activeDeals = deals.filter(d => [0, 1, 2, 3, 4, 5].includes(Number(d.state)))
  const closedDeals = deals.filter(d => [6, 7, 8].includes(Number(d.state)))

  if (!address) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <User size={48} style={{ color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>No wallet connected — please connect your wallet to view a profile.</p>
        <Link to="/" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>← Go Home</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <ParleySpinner size={64} />
        <p style={{ color: 'var(--text-muted)' }}>Loading profile…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 24, padding: '32px 36px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}
      >
        {/* Grid background */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3, pointerEvents: 'none' }} />

        {/* Own profile glow */}
        {isOwnProfile && (
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(0,245,255,0.12), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isOwnProfile ? '0 0 24px rgba(0,245,255,0.4)' : 'none' }}>
              <User size={36} style={{ color: '#fff' }} />
            </div>
            {isOwnProfile && (
              <div style={{ position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, background: '#10B981', borderRadius: '50%', border: '2px solid var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={10} style={{ color: '#fff' }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: 'Orbitron, sans-serif', color: 'var(--text-primary)' }}>
                {isOwnProfile ? 'My Profile' : fmtAddr(address)}
              </h1>
              {isOwnProfile && (
                <span style={{ fontSize: 11, background: 'rgba(0,245,255,0.15)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', borderRadius: 20, padding: '2px 10px', fontWeight: 700 }}>YOU</span>
              )}
            </div>
            <AddressChip address={address} />
            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{totalDeals} deals total</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profile?.volume || '0'} GEN volume</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span style={{ fontSize: 13, color: successRate >= 70 ? '#10B981' : '#F59E0B' }}>{successRate}% success rate</span>
            </div>
          </div>

          {/* Reputation Ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <ReputationRing score={reputation} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>REPUTATION</span>
          </div>
        </div>
      </motion.div>

      {/* ─── Stats Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard icon={Briefcase}   label="Deals Opened"    value={profile?.opened || 0}        color="var(--accent-cyan)"   delay={0}   />
        <StatCard icon={CheckCircle} label="Taken"           value={profile?.taken || 0}          color="var(--accent-purple)" delay={80}  />
        <StatCard icon={Star}        label="Settled"         value={profile?.settled || 0}        color="#10B981"              delay={160} />
        <StatCard icon={TrendingUp}  label="Delivered"       value={profile?.delivered || 0}      color="var(--accent-cyan)"   delay={240} />
        <StatCard icon={XCircle}     label="Failed"          value={profile?.failed || 0}         color="#EF4444"              delay={320} />
        <StatCard icon={AlertTriangle} label="Disputes Won"  value={profile?.disputesWon || 0}    color="#10B981"              delay={400} />
        <StatCard icon={Shield}      label="Disputes Lost"   value={profile?.disputesLost || 0}   color="#EF4444"              delay={480} />
        <StatCard icon={BarChart2}   label="Volume (GEN)"    value={profile?.volume || '0'}       color="var(--accent-purple)" delay={560} suffix="" />
        <StatCard icon={Clock}       label="Avg Completion"  value={profile?.avgCompletion || '0'} color="#F59E0B"             delay={640} suffix="%" />
      </div>

      {/* ─── Tabs ─── */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4, marginBottom: 24, border: '1px solid var(--border)', width: 'fit-content' }}>
        {[
          { id: 'overview', label: 'Overview', icon: BarChart2 },
          { id: 'client', label: `As Client (${clientDeals.length})`, icon: Briefcase },
          { id: 'provider', label: `As Provider (${providerDeals.length})`, icon: Scale },
          { id: 'active', label: `Active (${activeDeals.length})`, icon: Clock },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: tab === t.id ? 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))' : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-muted)' }}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Activity Breakdown */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Activity Breakdown</h3>
              {[
                { label: 'As Client', value: clientDeals.length, total: deals.length, color: 'var(--accent-cyan)' },
                { label: 'As Provider', value: providerDeals.length, total: deals.length, color: 'var(--accent-purple)' },
                { label: 'Active Deals', value: activeDeals.length, total: deals.length, color: '#F59E0B' },
                { label: 'Closed Deals', value: closedDeals.length, total: deals.length, color: '#10B981' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      style={{ height: '100%', background: item.color, borderRadius: 3 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Dispute Record */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Dispute Record</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Won</span>
                  <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Orbitron, sans-serif', color: '#10B981' }}>{profile?.disputesWon || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Lost</span>
                  <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Orbitron, sans-serif', color: '#EF4444' }}>{profile?.disputesLost || 0}</span>
                </div>
                {(profile?.disputesWon || 0) + (profile?.disputesLost || 0) > 0 && (
                  <div style={{ textAlign: 'center', padding: '10px 16px', background: 'var(--bg-tertiary)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                    Win Rate: <strong style={{ color: 'var(--text-primary)' }}>
                      {Math.round(((profile?.disputesWon || 0) / ((profile?.disputesWon || 0) + (profile?.disputesLost || 0))) * 100)}%
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ gridColumn: '1/-1', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Deals</h3>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{deals.length} total</span>
              </div>
              {deals.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No deals found for this address</div>
              ) : (
                deals.slice(0, 8).map(d => <DealRow key={d.id} deal={d} address={address} />)
              )}
              {deals.length > 8 && (
                <div style={{ padding: '14px 24px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => setTab('client')} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: 13 }}>
                    View all {deals.length} deals →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'client' && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Deals as Client ({clientDeals.length})</h3>
            </div>
            {clientDeals.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No deals as client found</div>
            ) : (
              clientDeals.map(d => <DealRow key={d.id} deal={d} address={address} />)
            )}
          </div>
        )}

        {tab === 'provider' && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Deals as Provider ({providerDeals.length})</h3>
            </div>
            {providerDeals.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No deals as provider found</div>
            ) : (
              providerDeals.map(d => <DealRow key={d.id} deal={d} address={address} />)
            )}
          </div>
        )}

        {tab === 'active' && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Active Deals ({activeDeals.length})</h3>
            </div>
            {activeDeals.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No active deals</div>
            ) : (
              activeDeals.map(d => <DealRow key={d.id} deal={d} address={address} />)
            )}
          </div>
        )}
      </motion.div>

    </div>
  )
}
