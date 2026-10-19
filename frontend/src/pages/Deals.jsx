import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, SlidersHorizontal, RefreshCw, Briefcase } from 'lucide-react'
import useDealsStore from '@store/useDealsStore'
import DealCard from '@components/deals/DealCard'
import { STATES } from '@data/mockData'
import { HexSpinner } from '@components/spinners/Spinners'

const filterOptions = [
  { value: 'all', label: 'All States' },
  ...Object.values(STATES).map(s => ({ value: s.name.toLowerCase(), label: s.label })),
]

export default function Deals() {
  const { deals, filter, search, setFilter, setSearch, filteredDeals, isLoading, refreshDeals, source } = useDealsStore()
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState('newest')

  const results = filteredDeals()

  const sorted = [...results].sort((a, b) => {
    if (sort === 'newest') return b.createdAt - a.createdAt
    if (sort === 'price-high') return parseFloat(b.price) - parseFloat(a.price)
    if (sort === 'price-low') return parseFloat(a.price) - parseFloat(b.price)
    return 0
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 80 }}>
      <div className="container" style={{ padding: '40px 24px' }}>

        {/* Mock data warning banner */}
        {source === 'mock' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 12, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, color: '#F59E0B', fontSize: 14 }}
          >
            <span style={{ fontSize: 18 }}>⚠</span>
            <span><strong>Demo data</strong> — Connect your wallet to Studionet to see live deals from the chain.</span>
            <button onClick={refreshDeals} style={{ marginLeft: 'auto', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 8, padding: '4px 12px', color: '#F59E0B', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Retry
            </button>
          </motion.div>
        )}

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 800, fontFamily: 'Orbitron, sans-serif' }}>
            <span className="gradient-text">Explore</span> Deals
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15 }}>
            {source === 'chain' ? '🟢 Live from Studionet · ' : ''}{deals.length} deals · {results.length} matching
          </p>
        </motion.div>

        {/* Search + Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search
              size={16}
              style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
              }}
            />
            <input
              className="input-field"
              style={{ paddingLeft: 42 }}
              placeholder="Search by title, scope, or address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              padding: '10px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 12,
              color: 'var(--text-primary)',
              fontSize: 14,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="newest">Newest First</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
          </select>

          {/* Refresh */}
          <button
            onClick={refreshDeals}
            className="btn-secondary"
            style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            disabled={isLoading}
          >
            <RefreshCw size={15} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </motion.div>

        {/* State filter pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}
        >
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid',
                ...(filter === opt.value ? {
                  background: 'linear-gradient(135deg, var(--accent-cyan-dim), var(--accent-purple-dim))',
                  borderColor: 'var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                } : {
                  background: 'transparent',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-tertiary)',
                }),
              }}
            >
              {opt.label}
              {opt.value !== 'all' && (
                <span style={{ marginLeft: 6, opacity: 0.6 }}>
                  {deals.filter(d => d.stateName === opt.value).length}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <HexSpinner size={64} />
          </div>
        ) : sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '80px 0' }}
          >
            <Briefcase size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>No deals found</div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Try adjusting your search or filters</div>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {sorted.map((deal, i) => <DealCard key={deal.id} deal={deal} index={i} />)}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
