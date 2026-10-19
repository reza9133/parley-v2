// Parley <-> GenLayer Studionet bridge.
// Everything chain-related lives here: config, reads, writes and the mapping from the contract's JSON to the UI's deal shape.
import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { outcome } from './receipt'

const DEPLOYED = '0x5d084E85056Acc332793f34667b8a9890f7B2Bd9' // the Studionet deployment; set VITE_PARLEY_ADDRESS to empty for demo mode
export const CONTRACT = (import.meta.env.VITE_PARLEY_ADDRESS ?? DEPLOYED).trim()
export const LIVE = /^0x[0-9a-fA-F]{40}$/.test(CONTRACT)
export const CHAIN = studionet
export const RPC = (import.meta.env.VITE_RPC_URL || '').trim() || studionet?.rpcUrls?.default?.http?.[0]
export const EXPLORER = (import.meta.env.VITE_EXPLORER_URL || 'https://explorer-studio.genlayer.com').replace(/\/$/, '')

export const STATE_NAMES = ['open', 'active', 'delivered', 'disputed', 'ruled', 'appealed', 'settled', 'cancelled', 'defaulted']

// ---- units ----------------------------------------------------------------------------------------------------------

const WEI = 10n ** 18n
export function formatGen(wei, maxDecimals = 6) {
  let w
  try { w = BigInt(wei ?? 0) } catch { w = 0n }
  const whole = w / WEI
  const frac = (w % WEI).toString().padStart(18, '0').slice(0, maxDecimals).replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : `${whole}`
}
export function parseGen(text) {
  const t = String(text ?? '').trim()
  if (!/^\d+(\.\d{1,18})?$/.test(t)) throw new Error('Enter a valid GEN amount.')
  const [w, f = ''] = t.split('.')
  return BigInt(w) * WEI + BigInt(f.padEnd(18, '0'))
}

// ---- clients --------------------------------------------------------------------------------------------------------

let reader
function getReader() {
  if (!reader) reader = createClient(RPC ? { chain: CHAIN, endpoint: RPC } : { chain: CHAIN })
  return reader
}
function getWriter(account) {
  return createClient({ chain: CHAIN, account, ...(RPC ? { endpoint: RPC } : {}) })
}

async function read(fn, args = []) {
  if (!LIVE) throw new Error('No contract address configured (VITE_PARLEY_ADDRESS).')
  const raw = await getReader().readContract({ address: CONTRACT, functionName: fn, args })
  return JSON.parse(String(raw))
}

// ---- mapping chain rows to the UI shape ----------------------------------------------------------------------------

export function toUiDeal(r) {
  const ms = (s) => (s ? Number(s) * 1000 : null)
  return {
    id: String(r.id),
    state: r.state,
    stateName: STATE_NAMES[r.state] || 'open',
    title: r.title,
    scope: r.scope,
    criteria: r.criteria || [],
    client: r.client,
    provider: r.provider || null,
    openToAny: r.open_to_any,
    pinned: r.pinned,
    price: formatGen(r.price),
    bondBps: r.bond_bps,
    offerEnd: ms(r.offer_until),
    workEnd: ms(r.due),
    reviewEnd: ms(r.review_end),
    deliveryUrl: r.url || null,
    note: r.note || '',
    summary: r.summary || '',
    completionBps: r.state >= 4 && r.state <= 6 ? r.completion : null,
    filings: (r.filings || []).map((f) => ({
      who: f.by === 'client' ? 1 : 2,
      stage: f.stage === 'dispute' ? 1 : 2,
      at: Number(f.at) * 1000,
      text: f.text,
      url: f.url,
    })),
    createdAt: ms(r.created),
    raw: r,
  }
}

export function toUiStats(s, deals) {
  const total = s.total || 0
  const settledDeals = deals.filter((d) => d.state === 6 && d.completionBps !== null)
  const avg = settledDeals.length ? settledDeals.reduce((a, d) => a + d.completionBps, 0) / settledDeals.length / 100 : null
  const providers = new Set(deals.map((d) => d.provider).filter(Boolean))
  return {
    totalDeals: total,
    totalVolume: Number(formatGen(s.volume, 2)).toLocaleString(undefined, { maximumFractionDigits: 2 }),
    settledDeals: s.settled,
    disputeRate: total ? ((s.rulings / total) * 100).toFixed(1) : '0.0',
    avgCompletion: avg === null ? '—' : avg.toFixed(1),
    activeProviders: providers.size,
    contractAddress: CONTRACT,
    network: 'Studionet',
  }
}

export function buildVolumeData(deals) {
  const now = new Date()
  const buckets = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString('en', { month: 'short' }), volume: 0, deals: 0, settled: 0 })
  }
  for (const deal of deals) {
    if (!deal.createdAt) continue
    const d = new Date(deal.createdAt)
    const b = buckets.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`)
    if (!b) continue
    b.deals += 1
    b.volume = Math.round((b.volume + parseFloat(deal.price)) * 100) / 100
    if (deal.state === 6) b.settled += 1
  }
  return buckets
}

// ---- reads ----------------------------------------------------------------------------------------------------------

export async function fetchAll() {
  const [stats, ...pages] = await Promise.all([
    read('stats'),
    ...[0, 60, 120].map((offset) => read('list_deals', [offset, 60]).catch(() => [])),
  ])
  const rows = pages.flat()
  const deals = rows.map(toUiDeal)
  return { deals, stats: toUiStats(stats, deals), volumeData: buildVolumeData(deals) }
}
export async function fetchDeal(id) {
  return toUiDeal(await read('get_deal', [Number(id)]))
}
export async function fetchOwed(id, who) {
  return read('owed_of', [Number(id), who])
}
export async function fetchProfile(who) {
  return read('profile_of', [who])
}
/** Every deal an address takes part in (newest first), read page by page. */
export async function fetchDealsOf(who) {
  const rows = []
  for (let offset = 0; offset < 300; offset += 60) {
    const page = await read('deals_of', [who, offset, 60])
    rows.push(...page)
    if (page.length < 60) break
  }
  return rows.map(toUiDeal)
}
/** Maps the contract's profile_of() JSON to the shape the profile page uses. */
export function toUiProfile(p) {
  return {
    opened: p.opened,
    taken: p.taken,
    settled: p.settled,
    delivered: p.delivered,
    failed: p.failed,
    defaulted: p.defaults,
    cancelled: p.cancelled,
    disputesWon: p.won,
    disputesLost: p.lost,
    volume: formatGen(p.volume, 4),
    avgCompletion: p.average_completion == null ? null : Math.round(p.average_completion / 10) / 10,
  }
}

// ---- writes ---------------------------------------------------------------------------------------------------------

async function quoteFees(client, call) {
  if (typeof client.estimateTransactionFeesForWrite !== 'function') return undefined
  try {
    const e = await client.estimateTransactionFeesForWrite(call)
    return e?.distribution && !e.gasless ? { distribution: e.distribution, feeValue: e.feeValue } : undefined
  } catch {
    return undefined
  }
}

/** Sends one transaction from the connected wallet and waits until the network has decided it. Throws if it failed. */
export async function send(account, fn, args = [], value = 0n, onHash) {
  if (!LIVE) throw new Error('Demo mode: set VITE_PARLEY_ADDRESS to send real transactions.')
  if (!account) throw new Error('Connect your wallet first.')
  const client = getWriter(account)
  const call = { address: CONTRACT, functionName: fn, args, ...(value ? { value } : {}) }
  const fees = await quoteFees(client, call)
  const hash = await client.writeContract(fees ? { ...call, fees } : call)
  onHash?.(hash)
  const opts = { hash, retries: 400, interval: 3000 }
  const receipt =
    typeof client.waitForDecision === 'function'
      ? await client.waitForDecision(opts)
      : await client.waitForTransactionReceipt({ ...opts, status: 'ACCEPTED' })
  const out = outcome(receipt)
  if (!out.ok) throw new Error(`The contract refused this action (${out.status}).`)
  return { hash, receipt }
}

export function humanError(err) {
  const m = String(err?.shortMessage || err?.message || err)
  if (/user rejected|denied|4001/i.test(m)) return 'You rejected the request in your wallet.'
  return m.length > 220 ? m.slice(0, 220) + '…' : m
}
