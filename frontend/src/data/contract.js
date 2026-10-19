/**
 * GenLayer Studionet Configuration
 *
 * Parley contract is deployed at:
 * 0x5d084E85056Acc332793f34667b8a9890f7B2Bd9
 *
 * GenLayer Studionet is an EVM-compatible chain.
 * We use ethers.js v6 to interact with MetaMask/injected wallets.
 *
 * The contract exposes:
 *  - View methods (return JSON strings): get_deal, list_deals, deals_of, owed_of, profile_of, stats
 *  - Write methods: open_deal, accept_deal, deliver, approve, reject, reply,
 *                   propose_split, accept_split, rule, appeal, finalize, expire,
 *                   release, claim, withdraw_offer, request_extension, answer_extension
 */

// ─── Network ────────────────────────────────────────────────────────────────
export const STUDIONET_CHAIN_ID = 0xC0C0  // 49344 decimal — GenLayer Studionet
export const STUDIONET_RPC = 'https://studio.genlayer.com/api'

export const STUDIONET_NETWORK = {
  chainId: '0xC0C0',
  chainName: 'GenLayer Studionet',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: [STUDIONET_RPC],
  blockExplorerUrls: ['https://studio.genlayer.com'],
}

// ─── Contract ────────────────────────────────────────────────────────────────
export const PARLEY_ADDRESS = '0x5d084E85056Acc332793f34667b8a9890f7B2Bd9'

/**
 * Minimal ABI for the Parley intelligent contract.
 *
 * GenLayer contracts are called exactly like EVM contracts via the JSON-RPC API.
 * View methods are eth_call; write methods are eth_sendTransaction.
 *
 * All view methods return ABI-encoded bytes that decode to a single `string`
 * containing the JSON payload.
 */
export const PARLEY_ABI = [
  // ─── View methods ───────────────────────────────────────────────────────
  {
    "type": "function",
    "name": "get_deal",
    "stateMutability": "view",
    "inputs": [{ "name": "deal_id", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "string" }]
  },
  {
    "type": "function",
    "name": "list_deals",
    "stateMutability": "view",
    "inputs": [
      { "name": "offset", "type": "uint256" },
      { "name": "limit", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "string" }]
  },
  {
    "type": "function",
    "name": "deals_of",
    "stateMutability": "view",
    "inputs": [
      { "name": "address", "type": "address" },
      { "name": "offset", "type": "uint256" },
      { "name": "limit", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "string" }]
  },
  {
    "type": "function",
    "name": "owed_of",
    "stateMutability": "view",
    "inputs": [
      { "name": "deal_id", "type": "uint256" },
      { "name": "address", "type": "address" }
    ],
    "outputs": [{ "name": "", "type": "string" }]
  },
  {
    "type": "function",
    "name": "profile_of",
    "stateMutability": "view",
    "inputs": [{ "name": "address", "type": "address" }],
    "outputs": [{ "name": "", "type": "string" }]
  },
  {
    "type": "function",
    "name": "stats",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string" }]
  },

  // ─── Write methods ──────────────────────────────────────────────────────
  {
    "type": "function",
    "name": "open_deal",
    "stateMutability": "payable",
    "inputs": [
      { "name": "title", "type": "string" },
      { "name": "scope", "type": "string" },
      { "name": "criteria", "type": "string" },
      { "name": "provider", "type": "address" },
      { "name": "offer_for", "type": "uint256" },
      { "name": "work_for", "type": "uint256" },
      { "name": "review_for", "type": "uint256" },
      { "name": "bond_bps", "type": "uint256" },
      { "name": "pinned", "type": "bool" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "withdraw_offer",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "deal_id", "type": "uint256" }],
    "outputs": []
  },
  {
    "type": "function",
    "name": "accept_deal",
    "stateMutability": "payable",
    "inputs": [{ "name": "deal_id", "type": "uint256" }],
    "outputs": []
  },
  {
    "type": "function",
    "name": "request_extension",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "deal_id", "type": "uint256" },
      { "name": "extra_seconds", "type": "uint256" },
      { "name": "reason", "type": "string" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "answer_extension",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "deal_id", "type": "uint256" },
      { "name": "grant", "type": "bool" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "deliver",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "deal_id", "type": "uint256" },
      { "name": "url", "type": "string" },
      { "name": "note", "type": "string" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "approve",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "deal_id", "type": "uint256" }],
    "outputs": []
  },
  {
    "type": "function",
    "name": "reject",
    "stateMutability": "payable",
    "inputs": [
      { "name": "deal_id", "type": "uint256" },
      { "name": "reason", "type": "string" },
      { "name": "url", "type": "string" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "reply",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "deal_id", "type": "uint256" },
      { "name": "statement", "type": "string" },
      { "name": "url", "type": "string" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "propose_split",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "deal_id", "type": "uint256" },
      { "name": "provider_bps", "type": "uint256" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "accept_split",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "deal_id", "type": "uint256" },
      { "name": "provider_bps", "type": "uint256" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "rule",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "deal_id", "type": "uint256" }],
    "outputs": []
  },
  {
    "type": "function",
    "name": "appeal",
    "stateMutability": "payable",
    "inputs": [
      { "name": "deal_id", "type": "uint256" },
      { "name": "statement", "type": "string" },
      { "name": "url", "type": "string" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "finalize",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "deal_id", "type": "uint256" }],
    "outputs": []
  },
  {
    "type": "function",
    "name": "expire",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "deal_id", "type": "uint256" }],
    "outputs": []
  },
  {
    "type": "function",
    "name": "release",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "deal_id", "type": "uint256" }],
    "outputs": []
  },
  {
    "type": "function",
    "name": "claim",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "deal_id", "type": "uint256" }],
    "outputs": []
  }
]
