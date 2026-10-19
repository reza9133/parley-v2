import { create } from 'zustand'
import { LIVE, CHAIN, RPC, formatGen } from '@/lib/chain'

const hexId = () => '0x' + Number(CHAIN.id).toString(16)

async function ensureChain(eth) {
  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId() }] })
  } catch (e) {
    if (e?.code === 4902 || /unrecognized|not added/i.test(String(e?.message))) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: hexId(),
          chainName: CHAIN.name || 'GenLayer Studionet',
          nativeCurrency: CHAIN.nativeCurrency || { name: 'GEN', symbol: 'GEN', decimals: 18 },
          rpcUrls: [RPC],
        }],
      })
    } else throw e
  }
}

async function readBalance(address) {
  try {
    const res = await fetch(RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }),
    })
    const j = await res.json()
    return formatGen(BigInt(j.result), 4)
  } catch {
    return null
  }
}

const useWalletStore = create((set, get) => ({
  address: null,
  isConnected: false,
  isConnecting: false,
  network: 'studionet',
  balance: null,
  error: null,

  apply: async (address) => {
    if (!address) return set({ address: null, isConnected: false, balance: null })
    set({ address, isConnected: true, isConnecting: false, error: null, balance: await readBalance(address) })
  },

  // Re-attach silently if the wallet is already authorised for this site.
  init: async () => {
    if (!LIVE || !window.ethereum) return
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts?.[0]) await get().apply(accounts[0])
      window.ethereum.on?.('accountsChanged', (a) => get().apply(a?.[0] || null))
    } catch { /* ignore */ }
  },

  connect: async () => {
    set({ isConnecting: true, error: null })
    if (!LIVE) {
      // Demo mode: no contract configured, so use a throwaway address.
      await new Promise((r) => setTimeout(r, 800))
      const mock = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      return set({ address: mock, isConnected: true, isConnecting: false, balance: (Math.random() * 5 + 0.5).toFixed(4) })
    }
    if (!window.ethereum) {
      return set({ isConnecting: false, error: 'No wallet found. Install MetaMask to connect.' })
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      await ensureChain(window.ethereum)
      await get().apply(accounts[0])
      window.ethereum.on?.('accountsChanged', (a) => get().apply(a?.[0] || null))
    } catch (e) {
      set({ isConnecting: false, error: e?.code === 4001 ? 'Connection request was rejected.' : String(e?.message || e) })
    }
  },

  disconnect: () => set({ address: null, isConnected: false, balance: null }),

  shortAddress: () => {
    const { address } = get()
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null
  },
}))

export default useWalletStore
