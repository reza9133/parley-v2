// Network helpers for the wallet UI (ported from Veritas): chain checks, add/switch network, address formatting.
// Contract reads/writes stay in lib/chain.js; wallet discovery lives in lib/eip6963.js.
import { CHAIN, RPC, EXPLORER } from '@/lib/chain'

export function getNetworkLabel() {
  const name = CHAIN?.name || 'Studionet'
  return name.replace(/^genlayer\s+/i, '')
}

export function shortenAddress(address) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''
}

const chainIdHex = () => `0x${Number(CHAIN.id).toString(16)}`

export function isTargetChainId(idHex) {
  try {
    return Boolean(idHex) && parseInt(String(idHex), 16) === Number(CHAIN.id)
  } catch {
    return false
  }
}

export async function readChainId(provider) {
  try {
    return String(await provider.request({ method: 'eth_chainId' }))
  } catch {
    return null
  }
}

function errorCode(err) {
  if (!err || typeof err !== 'object') return undefined
  if (typeof err.code === 'number') return err.code
  return errorCode(err.cause)
}

/**
 * Switches the wallet to the configured GenLayer network, adding it first if the wallet has never seen it.
 * Returns true on success and false if the person rejected it or the wallet can't do it — never throws.
 */
export async function switchToNetwork(provider) {
  if (isTargetChainId(await readChainId(provider))) return true
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainIdHex() }] })
    return true
  } catch (err) {
    const missing = errorCode(err) === 4902 || /unrecognized|unknown chain|not added/i.test(String(err?.message || ''))
    if (!missing) return false
  }
  try {
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: chainIdHex(),
        chainName: CHAIN.name || 'GenLayer Studionet',
        rpcUrls: [RPC, ...(CHAIN.rpcUrls?.default?.http || [])].filter((u, i, a) => u && a.indexOf(u) === i),
        nativeCurrency: CHAIN.nativeCurrency || { name: 'GEN', symbol: 'GEN', decimals: 18 },
        blockExplorerUrls: [CHAIN.blockExplorers?.default?.url || EXPLORER].filter(Boolean),
      }],
    })
    return true
  } catch {
    return false
  }
}

export function describeWalletError(err, fallback) {
  if (err?.code === 4001) return 'Request cancelled in your wallet.'
  if (err?.code === -32002) return 'A request is already pending in your wallet — open the extension to continue.'
  return err?.shortMessage || err?.message || fallback
}
