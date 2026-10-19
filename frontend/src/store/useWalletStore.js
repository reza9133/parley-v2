import { create } from 'zustand'
import { ethers } from 'ethers'
import {
  switchToStudionet,
  fetchBalance,
} from '@data/parleyService'
import { STUDIONET_CHAIN_ID } from '@data/contract'

/**
 * Wallet Store — real MetaMask connection to GenLayer Studionet.
 *
 * States:
 *  isConnected  — wallet is connected AND on the right network
 *  isConnecting — connection in progress
 *  isWrongNetwork — wallet connected but on wrong chain
 */
const useWalletStore = create((set, get) => ({
  address: null,
  isConnected: false,
  isConnecting: false,
  isWrongNetwork: false,
  balance: null,
  error: null,

  // ─── Connect ──────────────────────────────────────────────────────────────
  connect: async () => {
    set({ isConnecting: true, error: null })
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask (or compatible wallet) not found. Please install it to use Parley.')
      }

      // Request accounts
      const browserProvider = new ethers.BrowserProvider(window.ethereum)
      await browserProvider.send('eth_requestAccounts', [])
      const signer = await browserProvider.getSigner()
      const address = await signer.getAddress()

      // Switch / add Studionet
      await switchToStudionet()

      // Fetch native GEN balance
      const balance = await fetchBalance(address)

      set({
        address,
        isConnected: true,
        isConnecting: false,
        isWrongNetwork: false,
        balance,
        error: null,
      })

      // Listen for account/chain changes
      get()._attachListeners()
    } catch (err) {
      set({
        isConnecting: false,
        error: err.message ?? 'Connection failed',
      })
    }
  },

  // ─── Disconnect ───────────────────────────────────────────────────────────
  disconnect: () => {
    get()._removeListeners()
    set({ address: null, isConnected: false, balance: null, isWrongNetwork: false, error: null })
  },

  // ─── Refresh balance ──────────────────────────────────────────────────────
  refreshBalance: async () => {
    const { address } = get()
    if (!address) return
    try {
      const balance = await fetchBalance(address)
      set({ balance })
    } catch {/* silent */}
  },

  // ─── Formatted short address ─────────────────────────────────────────────
  shortAddress: () => {
    const { address } = get()
    if (!address) return null
    return `${address.slice(0, 6)}…${address.slice(-4)}`
  },

  // ─── Internal: event listeners ───────────────────────────────────────────
  _handleAccountsChanged: (accounts) => {
    if (!accounts || accounts.length === 0) {
      get().disconnect()
    } else {
      set({ address: accounts[0] })
      get().refreshBalance()
    }
  },

  _handleChainChanged: (chainId) => {
    const id = parseInt(chainId, 16)
    if (id !== STUDIONET_CHAIN_ID) {
      set({ isWrongNetwork: true, isConnected: false })
    } else {
      set({ isWrongNetwork: false, isConnected: true })
      get().refreshBalance()
    }
  },

  _attachListeners: () => {
    if (!window.ethereum) return
    window.ethereum.on('accountsChanged', get()._handleAccountsChanged)
    window.ethereum.on('chainChanged', get()._handleChainChanged)
  },

  _removeListeners: () => {
    if (!window.ethereum) return
    window.ethereum.removeListener('accountsChanged', get()._handleAccountsChanged)
    window.ethereum.removeListener('chainChanged', get()._handleChainChanged)
  },

  // ─── Auto-reconnect on page load ─────────────────────────────────────────
  autoConnect: async () => {
    if (!window.ethereum) return
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts && accounts.length > 0) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        const id = parseInt(chainId, 16)
        const balance = await fetchBalance(accounts[0])
        set({
          address: accounts[0],
          isConnected: id === STUDIONET_CHAIN_ID,
          isWrongNetwork: id !== STUDIONET_CHAIN_ID,
          balance,
        })
        get()._attachListeners()
      }
    } catch {/* silent */}
  },
}))

export default useWalletStore
