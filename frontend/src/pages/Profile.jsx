import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User, ExternalLink, Copy, Check, Star, TrendingUp,
  Shield, Clock, XCircle, AlertTriangle, BarChart2,
  Briefcase, CheckCircle, Scale,
} from 'lucide-react'
import useWalletStore from '@store/useWalletStore'
import useDealsStore from '@store/useDealsStore'
import { LIVE, EXPLORER, fetchProfile, fetchDealsOf, toUiProfile, humanError } from '@/lib/chain'
import { mockProfiles, STATES } from '@data/mockData'
import { ParleySpinner } from '@components/spinners/Spinners'
import { useAnimatedCounter } from '@hooks/useAnimatedCounter'

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const EMPTY_PROFILE = {
  opened: 0, taken: 0, settled: 0, delivered: 0, failed: 0, defaulted: 0, cancelled: 0,
  disputesWon: 0, disputesLost: 0, volume: '0', avgCompletion: null,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtAddr(a) {
  if (!a) return '—'
  return a.slice(0, 8) + '…' + a.slice(-6)
}

const same = (a, b) => !!a && !!b && a.toLowerCase() === b.toLowerCase()

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
      <button onClick={copy} aria-label="Copy address" style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--accent-cyan)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0 }}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
      {LIVE && (
        <a href={`${EXPLORER}/address/${address}`} target="_blank" rel="noopener noreferrer" aria-label="Open in explorer" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          <ExternalLink size={12} />
        </a>
      )}
    </span>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
// Whole numbers count up; decimals and text (volume, average completion) are shown exactly as they are.
function StatCard({ icon: Icon, label, value, color = 'var(--accent-cyan)', suffix = '', delay = 0 }) {
  const isWhole = Number.isInteger(Number(value)) && String(value).trim() !== ''
  const animated = useAnimatedCounter(isWhole ? Number(value) : 0, 1400, 0)
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
        {isWhole ? animated : value}{value === '—' ? '' : suffix}
      </div>
    </motion.div>
  )
}

// ─── Deal row ─────────────────────────────────────────────────────────────────
function DealRow({ deal, address }) {
  const state = STATES[deal.state] || STATES[0]
  const isClient = same(deal.client, address)
  const isProvider = same(deal.provider, address)

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
          {deal.price ? `${deal.price} GEN` : '—'}
        </span>
      </motion.div>
    </Link>
  )
}

function DealList({ title, deals, address, empty }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title} ({deals.length})</h3>
      </div>
      {deals.length === 0
        ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>{empty}</div>
        : deals.map(d => <DealRow key={d.id} deal={d} address={address} />)}
    </div>
  )
}

// ─── Settle-rate ring ─────────────────────────────────────────────────────────
function RateRing({ score }) {
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
        <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Orbitron, sans-serif', color }}>{score}%</div>
      </div>
    </div>
  )
}

const centered = { minHeight: '100vh', paddingTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Profile() {
  const { address: paramAddress } = useParams()
  const walletAddress = useWalletStore(s => s.address)
  const storeDeals = useDealsStore(s => s.deals)

  const address = paramAddress || walletAddress
  const validAddress = !LIVE || ADDRESS_RE.test(address || '')
  const isOwnProfile = same(address, walletAddress)

  const [chainProfile, setChainProfile] = useState(null)
  const [chainDeals, setChainDeals] = useState([])
  const [loading, setLoading] = useState(LIVE)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('overview')

  // Live mode: read the profile and the deal list straight from the contract.
  useEffect(() => {
    if (!LIVE || !address || !validAddress) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([fetchProfile(address), fetchDealsOf(address)])
      .then(([p, d]) => {
        if (cancelled) return
        setChainProfile(toUiProfile(p))
        setChainDeals(d)
      })
      .catch(e => { if (!cancelled) setError(humanError(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [address, validAddress])

  // Demo mode (no contract address configured): sample data only.
  const demoDeals = useMemo(
    () => (LIVE || !address ? [] : storeDeals.filter(d => same(d.client, address) || same(d.provider, address))),
    [storeDeals, address],
  )
  const profile = LIVE ? chainProfile : (mockProfiles[address] || EMPTY_PROFILE)
  const deals = LIVE ? chainDeals : demoDeals

  const totalDeals = (profile?.opened || 0) + (profile?.taken || 0)
  const settleRate = totalDeals > 0 ? Math.min(100, Math.round(((profile?.settled || 0) / totalDeals) * 100)) : 0
  const won = profile?.disputesWon || 0
  const lost = profile?.disputesLost || 0

  const clientDeals = deals.filter(d => same(d.client, address))
  const providerDeals = deals.filter(d => same(d.provider, address))
  const activeDeals = deals.filter(d => [0, 1, 2, 3, 4, 5].includes(Number(d.state)))
  const closedDeals = deals.filter(d => [6, 7, 8].includes(Number(d.state)))

  if (!address) {
    return (
      <div style={centered}>
        <User size={48} style={{ color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Connect your wallet to view your profile.</p>
        <Link to="/" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>← Go Home</Link>
      </div>
    )
  }

  if (!validAddress) {
    return (
      <div style={centered}>
        <AlertTriangle size={48} style={{ color: '#F59E0B' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>That is not a valid wallet address.</p>
        <Link to="/deals" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>← Browse deals</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={centered}>
        <ParleySpinner size={64} />
        <p style={{ color: 'var(--text-muted)' }}>Loading profile…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={centered}>
        <AlertTriangle size={48} style={{ color: '#EF4444' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 480, textAlign: 'center' }}>Could not load this profile: {error}</p>
        <Link to="/deals" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>← Browse deals</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 80 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 24, padding: '32px 36px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3, pointerEvents: 'none' }} />
          {isOwnProfile && (
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(0,245,255,0.12), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          )}

          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap' }}>
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
              <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{totalDeals} deals total</span>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profile?.volume || '0'} GEN volume</span>
                {isOwnProfile && (
                  <>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <Link to="/my-deals" style={{ fontSize: 13, color: 'var(--accent-cyan)', textDecoration: 'none' }}>My Deals →</Link>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <RateRing score={settleRate} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>SETTLE RATE</span>
            </div>
          </div>
        </motion.div>

        {/* ─── Stats ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          <StatCard icon={Briefcase}     label="Deals Opened"   value={profile?.opened || 0}    color="var(--accent-cyan)"   delay={0} />
          <StatCard icon={CheckCircle}   label="Taken"          value={profile?.taken || 0}     color="var(--accent-purple)" delay={80} />
          <StatCard icon={Star}          label="Settled"        value={profile?.settled || 0}   color="#10B981"              delay={160} />
          <StatCard icon={TrendingUp}    label="Delivered"      value={profile?.delivered || 0} color="var(--accent-cyan)"   delay={240} />
          <StatCard icon={XCircle}       label="Failed"         value={profile?.failed || 0}    color="#EF4444"              delay={320} />
          <StatCard icon={AlertTriangle} label="Disputes Won"   value={won}                     color="#10B981"              delay={400} />
          <StatCard icon={Shield}        label="Disputes Lost"  value={lost}                    color="#EF4444"              delay={480} />
          <StatCard icon={BarChart2}     label="Volume (GEN)"   value={profile?.volume || '0'}  color="var(--accent-purple)" delay={560} />
          <StatCard icon={Clock}         label="Avg Completion" value={profile?.avgCompletion == null || profile?.avgCompletion === '' ? '—' : String(profile.avgCompletion)} color="#F59E0B" delay={640} suffix="%" />
        </div>

        {/* ─── Tabs ─── */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4, marginBottom: 24, border: '1px solid var(--border)', width: 'fit-content', maxWidth: '100%', flexWrap: 'wrap' }}>
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

        {/* ─── Tab content ─── */}
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Activity Breakdown</h3>
                {[
                  { label: 'As Client', value: clientDeals.length, color: 'var(--accent-cyan)' },
                  { label: 'As Provider', value: providerDeals.length, color: 'var(--accent-purple)' },
                  { label: 'Active Deals', value: activeDeals.length, color: '#F59E0B' },
                  { label: 'Closed Deals', value: closedDeals.length, color: '#10B981' },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span>{item.label}</span>
                      <span style={{ fontWeight: 700, color: item.color }}>{item.value}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${deals.length > 0 ? (item.value / deals.length) * 100 : 0}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        style={{ height: '100%', background: item.color, borderRadius: 3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Dispute Record</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Won</span>
                    <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Orbitron, sans-serif', color: '#10B981' }}>{won}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Lost</span>
                    <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Orbitron, sans-serif', color: '#EF4444' }}>{lost}</span>
                  </div>
                  {won + lost > 0 && (
                    <div style={{ textAlign: 'center', padding: '10px 16px', background: 'var(--bg-tertiary)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                      Win Rate: <strong style={{ color: 'var(--text-primary)' }}>{Math.round((won / (won + lost)) * 100)}%</strong>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ gridColumn: '1/-1', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Deals</h3>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{deals.length} total</span>
                </div>
                {deals.length === 0
                  ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No deals found for this address</div>
                  : deals.slice(0, 8).map(d => <DealRow key={d.id} deal={d} address={address} />)}
                {deals.length > 8 && (
                  <div style={{ padding: '14px 24px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                    <button onClick={() => setTab(clientDeals.length >= providerDeals.length ? 'client' : 'provider')} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: 13 }}>
                      View all {deals.length} deals →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'client' && <DealList title="Deals as Client" deals={clientDeals} address={address} empty="No deals as client found" />}
          {tab === 'provider' && <DealList title="Deals as Provider" deals={providerDeals} address={address} empty="No deals as provider found" />}
          {tab === 'active' && <DealList title="Active Deals" deals={activeDeals} address={address} empty="No active deals" />}
        </motion.div>
      </div>
    </div>
  )
}
