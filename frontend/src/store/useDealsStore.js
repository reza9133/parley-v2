import { create } from 'zustand'
import { mockDeals, mockStats, volumeData as mockVolume } from '@data/mockData'
import { LIVE, fetchAll, fetchDeal } from '@/lib/chain'

const useDealsStore = create((set, get) => ({
  deals: LIVE ? [] : mockDeals,
  stats: LIVE ? { ...mockStats, totalDeals: 0, totalVolume: '0', settledDeals: 0, disputeRate: '0.0', avgCompletion: '—', activeProviders: 0 } : mockStats,
  volumeData: mockVolume,
  isLive: LIVE,
  isLoading: false,
  loaded: !LIVE,
  error: null,
  filter: 'all',
  search: '',

  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),

  filteredDeals: () => {
    const { deals, filter, search } = get()
    let result = deals
    if (filter !== 'all') result = result.filter((d) => d.stateName.toLowerCase() === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.scope.toLowerCase().includes(q) ||
          d.client.toLowerCase().includes(q) ||
          d.provider?.toLowerCase().includes(q)
      )
    }
    return result
  },

  getDeal: (id) => get().deals.find((d) => String(d.id) === String(id)),

  refreshDeals: async () => {
    if (!LIVE) return
    set({ isLoading: true, error: null })
    try {
      const { deals, stats, volumeData } = await fetchAll()
      set({ deals, stats, volumeData, isLoading: false, loaded: true })
    } catch (e) {
      set({ isLoading: false, loaded: true, error: String(e?.message || e) })
    }
  },

  loadDeal: async (id) => {
    if (!LIVE) return
    try {
      const d = await fetchDeal(id)
      set((s) => {
        const exists = s.deals.some((x) => x.id === d.id)
        return { deals: exists ? s.deals.map((x) => (x.id === d.id ? d : x)) : [d, ...s.deals], loaded: true }
      })
    } catch (e) {
      set({ loaded: true, error: String(e?.message || e) })
    }
  },
}))

export default useDealsStore
