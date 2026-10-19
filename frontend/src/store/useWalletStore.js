// Wallet state for the whole app. The connect flow (EIP-6963 wallet picker, remembered wallet, real disconnect,
// switch account / network) is the one from Veritas, kept behind Parley's existing store API
// (address, isConnected, isConnecting, connect, disconnect, shortAddress, balance, error, init).
import { create } from 'zustand'
import { LIVE, RPC, formatGen } from '@/lib/chain'
import { discoverWallets, getActiveProvider, setActiveProvider, subscribeToWallets } from '@/lib/eip6963'
import { describeWalletError, getNetworkLabel, isTargetChainId, readChainId, switchToNetwork } from '@/lib/wallet'

const SELECTED_KEY = 'parley_wallet_rdns'
const DISCONNECT_FLAG = 'parley_wallet_disconnected'

// localStorage can throw (private mode, blocked storage) — never let that break the wallet flow.
function store(action, key, value) {
  try {
    if (typeof window === 'undefined') return null
    if (action === 'get') return window.localStorage.getItem(key)
    if (action === 'set') window.localStorage.setItem(key, value)
    if (action === 'remove') window.localStorage.removeItem(key)
  } catch { /* ignore */ }
  return null
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

let listenersOn = null // provider the event listeners are attached to
let unsubscribeDiscovery = null

const useWalletStore = create((set, get) => {
  // Follow account / chain changes made inside the wallet.
  function listen(provider) {
    if (!provider?.on || listenersOn === provider) return
    unlisten()
    const onAccounts = async (accounts) => {
      const next = accounts?.[0] ?? null
      if (next) store('remove', DISCONNECT_FLAG)
      const id = await readChainId(provider)
      await get().apply(next)
      if (id) set({ chainId: id, chainOk: isTargetChainId(id) })
    }
    const onChain = (id) => set({ chainId: String(id), chainOk: isTargetChainId(String(id)) })
    const onDisconnect = () => get().apply(null)
    provider.on('accountsChanged', onAccounts)
    provider.on('chainChanged', onChain)
    provider.on('disconnect', onDisconnect)
    listenersOn = provider
    unlisten.current = () => {
      provider.removeListener?.('accountsChanged', onAccounts)
      provider.removeListener?.('chainChanged', onChain)
      provider.removeListener?.('disconnect', onDisconnect)
    }
  }
  function unlisten() {
    unlisten.current?.()
    unlisten.current = null
    listenersOn = null
  }

  return {
    address: null,
    isConnected: false,
    isConnecting: false,
    initializing: true,
    switching: false,
    network: 'studionet',
    chainId: null,
    chainOk: true,
    balance: null,
    error: null,

    availableWallets: [],
    selectedWalletRdns: null,
    hasWallet: false,
    modalOpen: false,

    apply: async (address) => {
      if (!address) return set({ address: null, isConnected: false, balance: null })
      set({ address, isConnected: true, isConnecting: false, error: null })
      set({ balance: await readBalance(address) })
    },

    openModal: () => set({ modalOpen: true, error: null }),
    closeModal: () => set({ modalOpen: false }),
    clearError: () => set({ error: null }),

    // Discover wallets and silently re-attach to the previous session (no popup).
    init: async () => {
      if (!unsubscribeDiscovery) {
        unsubscribeDiscovery = subscribeToWallets((list) =>
          set({ availableWallets: list, hasWallet: list.length > 0 || Boolean(getActiveProvider()) }),
        )
        set({ hasWallet: Boolean(getActiveProvider()) })
      }
      if (!LIVE || store('get', DISCONNECT_FLAG) === 'true') return set({ initializing: false })

      try {
        let rdns = store('get', SELECTED_KEY)
        if (rdns) {
          const match = (await discoverWallets()).find((w) => w.info.rdns === rdns)
          if (match) setActiveProvider(match.provider)
          else { rdns = null; store('remove', SELECTED_KEY) }
        }
        const active = getActiveProvider()
        if (!active) return
        // eth_accounts (not eth_requestAccounts): only returns an account if this site was already authorised.
        const accounts = await active.request({ method: 'eth_accounts' })
        const id = await readChainId(active)
        set({ selectedWalletRdns: rdns, chainId: id, chainOk: isTargetChainId(id) })
        if (accounts?.[0]) { listen(active); await get().apply(accounts[0]) }
      } catch { /* wallet locked / not ready — stay disconnected */ }
      finally { set({ initializing: false }) }
    },

    /**
     * connect(walletDetail) connects that specific wallet (what the picker does).
     * Called with no wallet (e.g. wired straight to onClick elsewhere in the app) it opens the connect modal instead.
     */
    connect: async (walletDetail) => {
      const detail = walletDetail?.info && walletDetail?.provider ? walletDetail : null

      if (!LIVE) {
        // Demo mode: no contract configured, so use a throwaway address.
        set({ isConnecting: true, error: null })
        await new Promise((r) => setTimeout(r, 800))
        const mock = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        return set({ address: mock, isConnected: true, isConnecting: false, chainOk: true, balance: (Math.random() * 5 + 0.5).toFixed(4), modalOpen: false })
      }

      const target = detail ? detail.provider : getActiveProvider()
      if (!detail && !(target && get().availableWallets.length === 0)) {
        // Nothing explicit chosen: let the person pick in the modal.
        return set({ modalOpen: true, error: null })
      }
      if (!target) {
        const message = 'No wallet extension detected. Install MetaMask (or another EIP-1193 wallet) to continue.'
        set({ error: message })
        throw new Error(message)
      }

      set({ isConnecting: true, error: null })
      try {
        const accounts = await target.request({ method: 'eth_requestAccounts' })
        if (!accounts?.[0]) throw new Error('No account returned by wallet.')
        // Commit the choice only now, so cancelling the popup leaves nothing half-selected.
        if (detail) {
          setActiveProvider(detail.provider)
          store('set', SELECTED_KEY, detail.info.rdns)
          set({ selectedWalletRdns: detail.info.rdns })
        }
        store('remove', DISCONNECT_FLAG)

        const switched = await switchToNetwork(target)
        const id = await readChainId(target)
        listen(target)
        set({ chainId: id, chainOk: isTargetChainId(id) })
        await get().apply(accounts[0])
        if (switched) set({ modalOpen: false })
        else set({ error: `Connected, but your wallet is not on GenLayer ${getNetworkLabel()}. Switch network to continue.` })
        return accounts[0]
      } catch (err) {
        const message = describeWalletError(err, 'Failed to connect wallet.')
        set({ isConnecting: false, error: message })
        throw new Error(message)
      }
    },

    // Also revokes this site's permission in the wallet so the next connect shows a real consent prompt.
    disconnect: async () => {
      const active = getActiveProvider()
      if (active && LIVE) {
        try { await active.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] }) } catch { /* not supported */ }
      }
      unlisten()
      setActiveProvider(null)
      store('remove', SELECTED_KEY)
      store('set', DISCONNECT_FLAG, 'true')
      set({ address: null, isConnected: false, balance: null, chainId: null, chainOk: true, selectedWalletRdns: null, error: null, modalOpen: false })
    },

    // Opens the wallet's own account picker, even when already connected.
    switchAccount: async () => {
      const active = getActiveProvider()
      if (!active) return null
      set({ switching: true, error: null })
      try {
        await active.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] })
        const accounts = await active.request({ method: 'eth_accounts' })
        if (!accounts?.[0]) throw new Error('No account selected.')
        await get().apply(accounts[0])
        return accounts[0]
      } catch (err) {
        set({ error: describeWalletError(err, 'Failed to switch account.') })
        return null
      } finally {
        set({ switching: false })
      }
    },

    switchNetwork: async () => {
      const active = getActiveProvider()
      if (!active) return
      set({ switching: true, error: null })
      try {
        const ok = await switchToNetwork(active)
        const id = await readChainId(active)
        if (id) set({ chainId: id, chainOk: isTargetChainId(id) })
        if (!ok) set({ error: `Switch your wallet to GenLayer ${getNetworkLabel()} to continue.` })
      } finally {
        set({ switching: false })
      }
    },

    shortAddress: () => {
      const { address } = get()
      return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null
    },
  }
})

export default useWalletStore
