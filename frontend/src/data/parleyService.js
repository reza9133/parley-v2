/**
 * parleyService.js
 *
 * All real blockchain interactions with the Parley contract on GenLayer Studionet.
 * Uses ethers.js v6.
 *
 * GenLayer Studionet RPC: https://studio.genlayer.com/api
 * Contract:               0x5d084E85056Acc332793f34667b8a9890f7B2Bd9
 *
 * View calls are read-only and work without a wallet (uses a JsonRpcProvider).
 * Write calls require a signer (MetaMask or compatible injected wallet).
 */

import { ethers } from 'ethers'
import {
  PARLEY_ADDRESS,
  PARLEY_ABI,
  STUDIONET_RPC,
  STUDIONET_CHAIN_ID,
  STUDIONET_NETWORK,
} from './contract.js'

export {
  PARLEY_ADDRESS,
  PARLEY_ABI,
  STUDIONET_RPC,
  STUDIONET_CHAIN_ID,
  STUDIONET_NETWORK,
} from './contract.js'

// ─── Read-only provider (no wallet required) ─────────────────────────────────
const readProvider = new ethers.JsonRpcProvider(STUDIONET_RPC)

function readContract() {
  return new ethers.Contract(PARLEY_ADDRESS, PARLEY_ABI, readProvider)
}

function writeContract(signer) {
  return new ethers.Contract(PARLEY_ADDRESS, PARLEY_ABI, signer)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse a JSON string returned by a view method. */
function parseJson(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/** Convert wei to GEN string (18 decimals). */
export function weiToGen(wei) {
  return ethers.formatEther(BigInt(wei))
}

/** Convert GEN amount string to wei BigInt. */
export function genToWei(gen) {
  return ethers.parseEther(String(gen))
}

// ─── Network helpers ──────────────────────────────────────────────────────────

/**
 * Switch MetaMask to GenLayer Studionet.
 * Adds the network if it doesn't exist yet.
 */
export async function switchToStudionet() {
  if (!window.ethereum) throw new Error('No injected wallet found. Please install MetaMask.')

  const chainHex = '0x' + STUDIONET_CHAIN_ID.toString(16)
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainHex }],
    })
  } catch (err) {
    // 4902 = chain not added yet
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainHex,
          chainName: STUDIONET_NETWORK.chainName,
          nativeCurrency: STUDIONET_NETWORK.nativeCurrency,
          rpcUrls: STUDIONET_NETWORK.rpcUrls,
          blockExplorerUrls: STUDIONET_NETWORK.blockExplorerUrls,
        }],
      })
    } else {
      throw err
    }
  }
}

/**
 * Get a signer from MetaMask.
 * Also ensures we are on Studionet.
 */
export async function getSigner() {
  if (!window.ethereum) throw new Error('No injected wallet found.')

  await switchToStudionet()

  const browserProvider = new ethers.BrowserProvider(window.ethereum)
  await browserProvider.send('eth_requestAccounts', [])
  return browserProvider.getSigner()
}

// ─── READ methods ─────────────────────────────────────────────────────────────

/** Fetch protocol-wide stats. */
export async function fetchStats() {
  const c = readContract()
  const raw = await c.stats()
  return parseJson(raw)
}

/**
 * Fetch a paginated list of deals.
 * Returns an array of deal objects.
 */
export async function fetchDeals(offset = 0, limit = 50) {
  const c = readContract()
  const raw = await c.list_deals(offset, limit)
  return parseJson(raw)
}

/** Fetch a single deal by numeric ID. */
export async function fetchDeal(dealId) {
  const c = readContract()
  const raw = await c.get_deal(dealId)
  return parseJson(raw)
}

/** Fetch all deals for a given wallet address. */
export async function fetchDealsOf(address, offset = 0, limit = 50) {
  const c = readContract()
  const raw = await c.deals_of(address, offset, limit)
  return parseJson(raw)
}

/** Fetch how much an address is owed from a settled deal. */
export async function fetchOwed(dealId, address) {
  const c = readContract()
  const raw = await c.owed_of(dealId, address)
  return parseJson(raw)
}

/** Fetch a user profile. */
export async function fetchProfile(address) {
  const c = readContract()
  const raw = await c.profile_of(address)
  return parseJson(raw)
}

/** Fetch native GEN balance for an address. */
export async function fetchBalance(address) {
  const balance = await readProvider.getBalance(address)
  return weiToGen(balance)
}

// ─── WRITE methods ────────────────────────────────────────────────────────────

/**
 * Post a new deal.
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.scope
 * @param {string[]} params.criteria  - array, joined with '|'
 * @param {string} params.provider   - address or zero address
 * @param {number} params.offerFor   - seconds
 * @param {number} params.workFor    - seconds
 * @param {number} params.reviewFor  - seconds
 * @param {number} params.bondBps    - 0–3000
 * @param {boolean} params.pinned
 * @param {string} params.priceGen   - GEN amount as string e.g. "2.5"
 */
export async function openDeal(params) {
  const signer = await getSigner()
  const c = writeContract(signer)

  const criteria = Array.isArray(params.criteria)
    ? params.criteria.filter(Boolean).join('|')
    : params.criteria

  const ZERO = '0x0000000000000000000000000000000000000000'
  const provider = params.provider || ZERO

  const tx = await c.open_deal(
    params.title,
    params.scope,
    criteria,
    provider,
    BigInt(params.offerFor),
    BigInt(params.workFor),
    BigInt(params.reviewFor),
    BigInt(params.bondBps),
    params.pinned,
    { value: genToWei(params.priceGen) }
  )
  return tx.wait()
}

/** Withdraw an open offer (client only, before anyone accepts). */
export async function withdrawOffer(dealId) {
  const signer = await getSigner()
  const tx = await writeContract(signer).withdraw_offer(BigInt(dealId))
  return tx.wait()
}

/**
 * Accept a deal as provider. Sends the bond amount.
 * @param {string|number} dealId
 * @param {string} bondGen  - exact bond amount in GEN
 */
export async function acceptDeal(dealId, bondGen) {
  const signer = await getSigner()
  const tx = await writeContract(signer).accept_deal(
    BigInt(dealId),
    { value: genToWei(bondGen) }
  )
  return tx.wait()
}

/** Deliver work (provider). */
export async function deliver(dealId, url, note = '') {
  const signer = await getSigner()
  const tx = await writeContract(signer).deliver(BigInt(dealId), url, note)
  return tx.wait()
}

/** Approve delivery (client). */
export async function approveDeal(dealId) {
  const signer = await getSigner()
  const tx = await writeContract(signer).approve(BigInt(dealId))
  return tx.wait()
}

/**
 * Reject delivery (client). Sends the dispute deposit.
 * @param {string} depositGen - exact deposit in GEN
 */
export async function rejectDeal(dealId, reason, url = '', depositGen) {
  const signer = await getSigner()
  const tx = await writeContract(signer).reject(
    BigInt(dealId), reason, url,
    { value: genToWei(depositGen) }
  )
  return tx.wait()
}

/** File a reply in a hearing (either party). */
export async function replyDeal(dealId, statement, url = '') {
  const signer = await getSigner()
  const tx = await writeContract(signer).reply(BigInt(dealId), statement, url)
  return tx.wait()
}

/** Propose a split settlement. */
export async function proposeSplit(dealId, providerBps) {
  const signer = await getSigner()
  const tx = await writeContract(signer).propose_split(BigInt(dealId), BigInt(providerBps))
  return tx.wait()
}

/** Accept a proposed split. */
export async function acceptSplit(dealId, providerBps) {
  const signer = await getSigner()
  const tx = await writeContract(signer).accept_split(BigInt(dealId), BigInt(providerBps))
  return tx.wait()
}

/** Ask the AI court to rule on a disputed deal. */
export async function ruleDeal(dealId) {
  const signer = await getSigner()
  const tx = await writeContract(signer).rule(BigInt(dealId))
  return tx.wait()
}

/**
 * Appeal a ruling.
 * @param {string} appealGen - exact appeal bond in GEN
 */
export async function appealDeal(dealId, statement, url = '', appealGen) {
  const signer = await getSigner()
  const tx = await writeContract(signer).appeal(
    BigInt(dealId), statement, url,
    { value: genToWei(appealGen) }
  )
  return tx.wait()
}

/** Finalize a delivered deal nobody answered, or a ruling nobody appealed. */
export async function finalizeDeal(dealId) {
  const signer = await getSigner()
  const tx = await writeContract(signer).finalize(BigInt(dealId))
  return tx.wait()
}

/** Expire a lapsed offer or a deal past its due date. */
export async function expireDeal(dealId) {
  const signer = await getSigner()
  const tx = await writeContract(signer).expire(BigInt(dealId))
  return tx.wait()
}

/** Release a dispute that had no ruling for 30 days. */
export async function releaseDeal(dealId) {
  const signer = await getSigner()
  const tx = await writeContract(signer).release(BigInt(dealId))
  return tx.wait()
}

/** Claim payout from a settled deal. */
export async function claimDeal(dealId) {
  const signer = await getSigner()
  const tx = await writeContract(signer).claim(BigInt(dealId))
  return tx.wait()
}

/** Request a deadline extension (provider). */
export async function requestExtension(dealId, extraSeconds, reason) {
  const signer = await getSigner()
  const tx = await writeContract(signer).request_extension(
    BigInt(dealId), BigInt(extraSeconds), reason
  )
  return tx.wait()
}

/** Grant or deny an extension request (client). */
export async function answerExtension(dealId, grant) {
  const signer = await getSigner()
  const tx = await writeContract(signer).answer_extension(BigInt(dealId), grant)
  return tx.wait()
}

// ─── Normalizer: chain data → UI shape ────────────────────────────────────────
/**
 * Normalise a deal object coming from the contract (snake_case, BigInt timestamps)
 * into the shape expected by DealCard / DealDetail.
 */
export function normalizeChainDeal(raw) {
  // raw fields from contract JSON:
  // id, state, title, scope, criteria ("|"-separated string), client, provider,
  // open_to_any, pinned, price (wei string), bond_bps, offer_end (unix s),
  // work_end, review_end, delivery_url, completion_bps, filings[], ...
  const STATE_NAMES = [
    'open','active','delivered','disputed','ruled','appealed',
    'settled','cancelled','defaulted',
  ]
  const id = String(raw.id ?? raw.deal_id ?? '?')
  const state = Number(raw.state ?? 0)
  const criteriaRaw = raw.criteria ?? ''
  const criteria = typeof criteriaRaw === 'string'
    ? criteriaRaw.split('|').filter(Boolean)
    : (Array.isArray(criteriaRaw) ? criteriaRaw : [])

  const toMs = (val) => val ? Number(val) * 1000 : null

  return {
    id,
    state,
    stateName: STATE_NAMES[state] ?? 'open',
    title: raw.title ?? '',
    scope: raw.scope ?? '',
    criteria,
    client: raw.client ?? '',
    provider: raw.provider === '0x0000000000000000000000000000000000000000' ? null : (raw.provider ?? null),
    openToAny: Boolean(raw.open_to_any ?? raw.openToAny ?? true),
    pinned: Boolean(raw.pinned ?? false),
    price: weiToGen(raw.price ?? '0'),
    bondBps: Number(raw.bond_bps ?? raw.bondBps ?? 0),
    offerEnd: toMs(raw.offer_end ?? raw.offerEnd),
    workEnd: toMs(raw.work_end ?? raw.workEnd),
    reviewEnd: toMs(raw.review_end ?? raw.reviewEnd),
    deliveryUrl: raw.delivery_url ?? raw.deliveryUrl ?? null,
    completionBps: raw.completion_bps != null ? Number(raw.completion_bps) : null,
    filings: (raw.filings ?? []).map(f => ({
      who: Number(f.who),
      stage: Number(f.stage),
      at: toMs(f.at),
      text: f.text ?? '',
      url: f.url ?? '',
    })),
    ruling: raw.ruling ?? null,
    createdAt: toMs(raw.created_at ?? raw.createdAt) ?? Date.now(),
    path: Number(raw.path ?? 0),
    clientClaimed: Boolean(raw.client_claimed),
    providerClaimed: Boolean(raw.provider_claimed),
  }
}
