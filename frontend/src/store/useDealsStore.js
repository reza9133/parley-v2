import { create } from 'zustand'
import {
  fetchDeals,
  fetchDeal,
  fetchStats,
  normalizeChainDeal,
} from '@data/parleyService'
import { mockDeals, mockStats } from '@data/mockData'

/**
 * Deals Store
 *
 * Tries to load real data from the Parley contract on Studionet.
 * Falls back to mock data if the RPC is unreachable (e.g. during development
 * without a network connection).
 *
 * The `source` field is set to 'chain' or 'mock' so the UI can show a banner.
 */
const useDealsStore = create((set, get) => ({
  deals: [],
  stats: null,
  isLoading: false,
  error: null,
  source: null,   // 'chain' | 'mock'
  filter: 'all',
  search: '',
  // Track which deal IDs we've loaded from chain in detail
  detailCache: {},

  // ─── Filters ──────────────────────────────────────────────────────────────
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),

  filteredDeals: () => {
    const { deals, filter, search } = get()
    let result = deals
    if (filter !== 'all') {
      result = result.filter(d => d.stateName === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(d =>
        d.title?.toLowerCase().includes(q) ||
        d.scope?.toLowerCase().includes(q) ||
        d.client?.toLowerCase().includes(q) ||
        d.provider?.toLowerCase().includes(q)
      )
    }
    return result
  },

  // ─── Load all deals from chain ────────────────────────────────────────────
  loadDeals: async () => {
    set({ isLoading: true, error: null })
    try {
      // Fetch up to 100 deals; the contract paginates
      const [rawDeals, rawStats] = await Promise.all([
        fetchDeals(0, 100),
        fetchStats(),
      ])

      const deals = Array.isArray(rawDeals)
        ? rawDeals.map(normalizeChainDeal)
        : []

      set({
        deals,
        stats: rawStats,
        isLoading: false,
        source: 'chain',
        error: null,
      })
    } catch (err) {
      console.warn('[Parley] Chain unavailable, using mock data:', err.message)
      set({
        deals: mockDeals,
        stats: mockStats,
        isLoading: false,
        source: 'mock',
        error: null,
      })
    }
  },

  // ─── Refresh (alias) ──────────────────────────────────────────────────────
  refreshDeals: () => get().loadDeals(),

  // ─── Get a single deal (with cache) ──────────────────────────────────────
  getDeal: (id) => {
    // First try the already-loaded list
    const fromList = get().deals.find(d => d.id === String(id))
    if (fromList) return fromList
    // Then try detail cache
    return get().detailCache[String(id)] ?? null
  },

  // ─── Load a single deal from chain and cache it ───────────────────────────
  loadDeal: async (id) => {
    try {
      const raw = await fetchDeal(id)
      const deal = normalizeChainDeal(raw)
      set(s => ({
        detailCache: { ...s.detailCache, [String(id)]: deal },
        // Also update in list if present
        deals: s.deals.map(d => d.id === String(id) ? deal : d),
      }))
      return deal
    } catch (err) {
      // Fall back to mock
      const mock = mockDeals.find(d => d.id === String(id))
      if (mock) return mock
      throw err
    }
  },
}))

export default useDealsStore
