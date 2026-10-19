import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import useWalletStore from '@store/useWalletStore'
import useDealsStore from '@store/useDealsStore'
import { ParleySpinner, CourtSpinner } from '@components/spinners/Spinners'
import { useSound } from '@hooks/useSound'
import { LIVE, EXPLORER, send, humanError, fetchOwed, formatGen } from '@/lib/chain'

const T = { text: 'text', area: 'area', num: 'num' }

// Each action: which contract method, what the user must type, and how much GEN travels with it.
const ACTIONS = {
  take: { label: 'Take This Deal', fn: 'accept_deal', primary: true, fields: [], value: (d) => BigInt(d.raw.bond), valueNote: 'bond' },
  withdraw: { label: 'Withdraw Offer', fn: 'withdraw_offer', fields: [] },
  deliver: {
    label: 'Deliver Work', fn: 'deliver', primary: true,
    fields: [
      { k: 'url', label: 'Deliverable link', type: T.text, ph: 'https://github.com/... (commit-pinned if required)' },
      { k: 'note', label: 'Note (optional)', type: T.area, ph: 'What was delivered and how to check it' },
    ],
    args: (v) => [v.url.trim(), v.note.trim()],
  },
  extend: {
    label: 'Ask for More Time', fn: 'request_extension',
    fields: [
      { k: 'hours', label: 'Extra hours', type: T.num, ph: '24' },
      { k: 'reason', label: 'Reason', type: T.area, ph: 'Why more time is needed' },
    ],
    args: (v) => [Math.round(Number(v.hours) * 3600), v.reason.trim()],
  },
  grant: { label: 'Grant Extension', fn: 'answer_extension', fields: [], args: () => [true] },
  deny: { label: 'Deny Extension', fn: 'answer_extension', fields: [], args: () => [false], danger: true },
  approve: { label: 'Approve & Pay', fn: 'approve', primary: true, fields: [] },
  reject: {
    label: 'Reject Work', fn: 'reject', danger: true,
    fields: [
      { k: 'reason', label: 'What is missing?', type: T.area, ph: 'Explain which criteria were not met' },
      { k: 'url', label: 'Evidence link (optional)', type: T.text, ph: 'https://...' },
    ],
    args: (v) => [v.reason.trim(), v.url.trim()],
    value: (d) => BigInt(d.raw.deposit_due), valueNote: 'dispute deposit',
  },
  reply: {
    label: 'File Statement', fn: 'reply',
    fields: [
      { k: 'statement', label: 'Your statement', type: T.area, ph: 'Your side of the dispute' },
      { k: 'url', label: 'Evidence link (optional)', type: T.text, ph: 'https://...' },
    ],
    args: (v) => [v.statement.trim(), v.url.trim()],
  },
  split: {
    label: 'Propose Split', fn: 'propose_split',
    fields: [{ k: 'bps', label: "Provider's share (%)", type: T.num, ph: '70' }],
    args: (v) => [Math.round(Number(v.bps) * 100)],
  },
  acceptSplit: { label: 'Accept Standing Split', fn: 'accept_split', fields: [], args: (_v, d, ctx) => [ctx.splitBps] },
  rule: { label: 'Convene AI Court', fn: 'rule', primary: true, fields: [], slow: true },
  appeal: {
    label: 'Appeal Ruling', fn: 'appeal', danger: true,
    fields: [
      { k: 'statement', label: 'Why the ruling is wrong', type: T.area, ph: 'Your appeal statement' },
      { k: 'url', label: 'Evidence link (optional)', type: T.text, ph: 'https://...' },
    ],
    args: (v) => [v.statement.trim(), v.url.trim()],
    value: (d) => BigInt(d.raw.appeal_due), valueNote: 'appeal bond', slow: true,
  },
  finalize: { label: 'Finalize', fn: 'finalize', primary: true, fields: [] },
  expire: { label: 'Close Expired Deal', fn: 'expire', fields: [] },
  claim: { label: 'Claim Funds', fn: 'claim', primary: true, fields: [] },
}

const input = {
  width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 13,
  background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', outline: 'none',
}

export default function DealActions({ deal }) {
  const { address, isConnected, connect, isConnecting, error: walletError } = useWalletStore()
  const { loadDeal, refreshDeals } = useDealsStore()
  const { play } = useSound()
  const [active, setActive] = useState(null)
  const [vals, setVals] = useState({})
  const [busy, setBusy] = useState(false)
  const [hash, setHash] = useState(null)
  const [msg, setMsg] = useState(null) // { ok, text }
  const [owed, setOwed] = useState(null)

  const me = (address || '').toLowerCase()
  const isClient = me && deal.client?.toLowerCase() === me
  const isProvider = me && deal.provider?.toLowerCase() === me
  const r = deal.raw || {}
  const now = Date.now()

  useEffect(() => {
    setOwed(null)
    if (LIVE && me && deal.state >= 6) fetchOwed(deal.id, address).then(setOwed).catch(() => {})
  }, [deal.id, deal.state, me])

  const list = useMemo(() => {
    const a = []
    const s = deal.state
    if (s === 0) {
      if (isClient) a.push('withdraw')
      else if (!deal.provider || isProvider) a.push('take')
    }
    if (s === 1) {
      if (isProvider) a.push('deliver', 'extend')
      if (isClient && r.ext_ask > 0) a.push('grant', 'deny')
      if (r.due && now / 1000 > r.due) a.push('expire')
    }
    if (s === 2) {
      if (isClient) a.push('approve', 'reject')
      if (isClient || isProvider) a.push('split')
      if (r.review_end && now / 1000 > r.review_end) a.push('expire')
    }
    if (s === 3) {
      if (isClient || isProvider) a.push('reply', 'split')
      a.push('rule')
    }
    if (s === 4) {
      if (isClient || isProvider) a.push('appeal')
      a.push('finalize')
    }
    if (s === 5) a.push('finalize')
    return a
  }, [deal.state, isClient, isProvider, r.ext_ask, r.due, r.review_end])

  // A standing offer from the other side can be accepted as-is.
  const otherOffer = isClient ? r.offers?.provider : isProvider ? r.offers?.client : null
  const splitBps = otherOffer ?? null
  const actions = [...list]
  if ((deal.state === 2 || deal.state === 3) && splitBps !== null && splitBps !== undefined) actions.unshift('acceptSplit')
  if (deal.state >= 6 && owed && owed.amount !== '0' && !owed.claimed) actions.push('claim')

  const open = (key) => { setActive(key); setVals({}); setMsg(null); setHash(null); play('click') }
  const cfg = active ? ACTIONS[active] : null

  const run = async () => {
    setBusy(true); setMsg(null)
    try {
      for (const f of cfg.fields) {
        if (f.label.includes('optional')) continue
        if (!String(vals[f.k] ?? '').trim()) throw new Error(`${f.label} is required.`)
      }
      const args = cfg.args ? cfg.args(vals, deal, { splitBps }) : [Number(deal.id)]
      const full = cfg.fields.length || cfg.args ? [Number(deal.id), ...args] : args
      const value = cfg.value ? cfg.value(deal) : 0n
      await send(address, cfg.fn, full, value, setHash)
      play('success')
      setMsg({ ok: true, text: `${cfg.label} confirmed on Studionet.` })
      setActive(null)
      await Promise.all([loadDeal(deal.id), refreshDeals()])
    } catch (e) {
      play('error')
      setMsg({ ok: false, text: humanError(e) })
    } finally {
      setBusy(false)
    }
  }

  if (!LIVE) {
    return <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>Demo mode: transactions are disabled.</div>
  }
  if (!isConnected) {
    return (
      <div style={{ marginTop: 16 }}>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={connect} disabled={isConnecting}>
          {isConnecting ? 'Connecting…' : 'Connect Wallet to Act'}
        </button>
        {walletError && <div style={{ color: 'var(--state-disputed)', fontSize: 12, marginTop: 8 }}>{walletError}</div>}
      </div>
    )
  }

  return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {owed && owed.amount !== '0' && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          You are owed <strong style={{ color: 'var(--accent-cyan)' }}>{formatGen(owed.amount)} GEN</strong> {owed.claimed ? '(claimed)' : ''}
        </div>
      )}

      {!active && actions.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No actions available for your account right now.</div>
      )}

      {!active && actions.map((k) => {
        const a = ACTIONS[k]
        return (
          <button
            key={k}
            className={a.primary ? 'btn-primary' : 'btn-secondary'}
            style={{ width: '100%', justifyContent: 'center', fontSize: 13, ...(a.danger ? { color: 'var(--state-disputed)', borderColor: 'var(--state-disputed)' } : {}) }}
            onClick={() => open(k)}
          >
            {a.label}
          </button>
        )
      })}

      <AnimatePresence>
        {cfg && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{cfg.label}</div>
            {cfg.fields.map((f) => (
              <label key={f.k} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {f.label}
                {f.type === T.area ? (
                  <textarea rows={3} style={input} placeholder={f.ph} value={vals[f.k] || ''} onChange={(e) => setVals((v) => ({ ...v, [f.k]: e.target.value }))} />
                ) : (
                  <input style={input} type={f.type === T.num ? 'number' : 'text'} placeholder={f.ph} value={vals[f.k] || ''} onChange={(e) => setVals((v) => ({ ...v, [f.k]: e.target.value }))} />
                )}
              </label>
            ))}
            {cfg.value && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                This sends <strong style={{ color: 'var(--accent-cyan)' }}>{formatGen(cfg.value(deal))} GEN</strong> ({cfg.valueNote}).
              </div>
            )}
            {cfg.slow && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>The AI court can take a few minutes. Keep this tab open.</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }} onClick={run} disabled={busy}>
                {busy ? (cfg.slow ? <CourtSpinner size={18} /> : <ParleySpinner size={18} />) : 'Confirm'}
                {busy ? ' Waiting…' : ''}
              </button>
              {!busy && <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setActive(null)}>Cancel</button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hash && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-all' }}>
          tx{' '}
          <a href={`${EXPLORER}/transactions/${hash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>
            {hash.slice(0, 12)}… <ExternalLink size={10} />
          </a>
        </div>
      )}
      {msg && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12, textAlign: 'left', color: msg.ok ? 'var(--state-settled)' : 'var(--state-disputed)' }}>
          {msg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />} <span>{msg.text}</span>
        </div>
      )}
    </div>
  )
}
