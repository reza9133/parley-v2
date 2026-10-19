import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Briefcase, Star, TrendingUp, Scale, Award } from 'lucide-react'
import { mockDeals, STATES } from '@data/mockData'
import DealCard from '@components/deals/DealCard'
import useWalletStore from '@store/useWalletStore'

const MOCK_ADDR = '0xAlice4f3B9aE72f7C8d5E1239Ab4567DEF0123456'

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px', borderRadius: '10px 10px 0 0',
        fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
        border: 'none', borderBottom: active ? '2px solid var(--accent-cyan)' : '2px solid transparent',
        background: 'transparent',
        color: active ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  )
}

export default function MyDeals() {
  const { isConnected, connect, address } = useWalletStore()
  const [tab, setTab] = useState('client')

  const myAddr = address || MOCK_ADDR
  const asClient = mockDeals.filter(d => d.client === myAddr || !address)
  const asProvider = mockDeals.filter(d => d.provider === myAddr)
  const active = asClient.filter(d => [0,1,2,3,4,5].includes(d.state))
  const closed = asClient.filter(d => [6,7,8].includes(d.state))

  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: 48, maxWidth: 440, textAlign: 'center' }}>
          <User size={48} style={{ color: 'var(--accent-purple)', marginBottom: 16 }} />
          <h2 style={{ margin: '0 0 12px', fontFamily: 'Orbitron, sans-serif' }}>Connect to view your deals</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Your deal history, earnings, and active contracts are tied to your wallet address.</p>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} onClick={connect}>
            Connect Wallet
          </button>
        </motion.div>
      </div>
    )
  }

  const deals = tab === 'client' ? asClient : asProvider
  const activeDls = deals.filter(d => [0,1,2,3,4,5].includes(d.state))
  const closedDls = deals.filter(d => [6,7,8].includes(d.state))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 80 }}>
      <div className="container" style={{ padding: '40px 24px' }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, fontFamily: 'Orbitron, sans-serif' }}>My Deals</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Your deal history as client and provider</p>
        </motion.div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'As Client', value: asClient.length, icon: Briefcase, color: 'var(--accent-cyan)' },
            { label: 'As Provider', value: asProvider.length, icon: Scale, color: 'var(--accent-purple)' },
            { label: 'Settled', value: [...asClient, ...asProvider].filter(d => d.state === 6).length, icon: Star, color: 'var(--state-settled)' },
            { label: 'In Dispute', value: [...asClient, ...asProvider].filter(d => [3,4,5].includes(d.state)).length, icon: TrendingUp, color: 'var(--state-disputed)' },
          ].map(({ label, value, icon: I, color }) => (
            <motion.div key={label} whileHover={{ scale: 1.03 }} className="glass-card" style={{ padding: '18px 20px' }}>
              <I size={20} color={color} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Orbitron, sans-serif', color }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid var(--border-primary)', marginBottom: 32 }}>
          <Tab label={`As Client (${asClient.length})`} active={tab === 'client'} onClick={() => setTab('client')} />
          <Tab label={`As Provider (${asProvider.length})`} active={tab === 'provider'} onClick={() => setTab('provider')} />
        </div>

        {/* Active deals */}
        {activeDls.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>Active Deals</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {activeDls.map((deal, i) => <DealCard key={deal.id} deal={deal} index={i} />)}
            </div>
          </div>
        )}

        {/* Closed deals */}
        {closedDls.length > 0 && (
          <div>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>Closed Deals</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {closedDls.map((deal, i) => <DealCard key={deal.id} deal={deal} index={i} />)}
            </div>
          </div>
        )}

        {deals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Award size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>No deals yet</div>
            <p style={{ color: 'var(--text-tertiary)', marginBottom: 24 }}>
              {tab === 'client' ? 'Post your first deal to get started.' : 'Browse open deals to find work.'}
            </p>
            <a href={tab === 'client' ? '/create' : '/deals'} className="btn-primary">
              {tab === 'client' ? 'Post a Deal' : 'Browse Deals'}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
