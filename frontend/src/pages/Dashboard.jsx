import { useState } from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, TrendingUp, Briefcase, Scale, Clock, ArrowRight, Activity, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { mockDeals, volumeData, mockStats, STATES } from '@data/mockData'
import { useAnimatedCounter } from '@hooks/useAnimatedCounter'
import DealCard from '@components/deals/DealCard'
import useWalletStore from '@store/useWalletStore'

function StatCard({ label, value, change, icon: Icon, color, prefix = '', suffix = '' }) {
  const count = useAnimatedCounter(value)
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-card"
      style={{ padding: 24 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: color + '22', border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
        {change && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: change > 0 ? 'var(--state-settled)' : 'var(--state-disputed)',
            background: change > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            padding: '3px 8px', borderRadius: 20,
          }}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color, marginBottom: 4 }}>
        {prefix}{count}{suffix}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{label}</div>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
      borderRadius: 10, padding: '12px 16px', backdropFilter: 'blur(20px)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ fontSize: 13, color: p.color, display: 'flex', gap: 8 }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{p.value}{p.name === 'volume' ? ' GEN' : ''}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { isConnected, connect, shortAddress } = useWalletStore()
  const [activeTab, setActiveTab] = useState('volume')

  const stateCounts = Object.entries(STATES).map(([k, v]) => ({
    state: v.label,
    count: mockDeals.filter(d => d.state === parseInt(k)).length,
    color: v.color,
  })).filter(s => s.count > 0)

  const recentDeals = mockDeals.slice(0, 4)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 80 }}>
      <div className="container" style={{ padding: '40px 24px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 40 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent-cyan-dim), var(--accent-purple-dim))',
              border: '1px solid var(--border-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LayoutDashboard size={20} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, fontFamily: 'Orbitron, sans-serif' }}>Dashboard</h1>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>Parley Protocol Overview</p>
            </div>
          </div>

          {!isConnected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: 'var(--accent-purple-dim)', border: '1px solid var(--accent-purple)',
                borderRadius: 14, padding: '16px 20px', marginTop: 20,
              }}
            >
              <Wallet size={20} style={{ color: 'var(--accent-purple)' }} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>Connect your wallet to see your deals</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>View personalized stats, create deals, and track earnings</div>
              </div>
              <button className="btn-primary" style={{ marginLeft: 'auto', padding: '10px 20px', fontSize: 13, whiteSpace: 'nowrap' }} onClick={connect}>
                Connect Wallet
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
          <StatCard label="Total Deals" value={847} change={12} icon={Briefcase} color="var(--accent-cyan)" />
          <StatCard label="Volume (GEN)" value="2341" prefix="" suffix=" GEN" icon={TrendingUp} color="var(--accent-purple)" change={8} />
          <StatCard label="Settled Deals" value={712} change={5} icon={Scale} color="var(--state-settled)" />
          <StatCard label="Avg Completion" value={91} suffix="%" icon={Activity} color="var(--accent-pink)" change={2} />
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 40 }}>
          {/* Volume Chart */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Protocol Volume</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {['volume', 'deals'].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: '1px solid var(--border-primary)',
                      background: activeTab === t ? 'var(--accent-cyan-dim)' : 'transparent',
                      color: activeTab === t ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={activeTab}
                  stroke="var(--accent-cyan)"
                  strokeWidth={2}
                  fill="url(#volumeGrad)"
                  dot={{ fill: 'var(--accent-cyan)', r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* State Distribution */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Deal States</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stateCounts.map(({ state, count, color }) => (
                <div key={state}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{state}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{count}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div style={{
                      height: '100%', width: `${(count / mockDeals.length) * 100}%`,
                      background: color, borderRadius: 3,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Deals */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Recent Deals</h2>
            <Link to="/deals" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-cyan)' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {recentDeals.map((deal, i) => <DealCard key={deal.id} deal={deal} index={i} />)}
          </div>
        </div>

        {/* Contract info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass-card"
          style={{ padding: 24, marginTop: 40 }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CONTRACT ADDRESS</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--accent-cyan)' }}>
                {mockStats.contractAddress}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>NETWORK</div>
              <div style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{mockStats.network}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>STATUS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--state-settled)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--state-settled)', animation: 'pulse 2s infinite' }} />
                Live
              </div>
            </div>
            <a
              href={`https://studio.genlayer.com/address/${mockStats.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ marginLeft: 'auto', fontSize: 13, padding: '8px 16px' }}
            >
              View on Explorer
            </a>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
      `}</style>
    </div>
  )
}
