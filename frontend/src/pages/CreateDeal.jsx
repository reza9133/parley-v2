import useDealsStore from '@store/useDealsStore'
import { LIVE, send, parseGen, humanError } from '@/lib/chain'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Plus, Minus, Info, Zap, AlertCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import useWalletStore from '@store/useWalletStore'
import { ParleySpinner } from '@components/spinners/Spinners'

const STEPS = ['Basics', 'Criteria', 'Timeline', 'Payment', 'Review']

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 48 }}>
      {STEPS.map((step, i) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <motion.div
              animate={{
                background: i < current
                  ? 'var(--state-settled)'
                  : i === current
                  ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))'
                  : 'var(--bg-tertiary)',
                scale: i === current ? 1.15 : 1,
              }}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                color: i <= current ? '#fff' : 'var(--text-muted)',
                border: i === current ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                boxShadow: i === current ? '0 0 16px var(--accent-cyan-glow)' : 'none',
              }}
            >
              {i < current ? <Check size={16} /> : i + 1}
            </motion.div>
            <span style={{ fontSize: 11, color: i === current ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: i === current ? 700 : 400 }}>
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              width: 60, height: 2, marginBottom: 18,
              background: i < current
                ? 'var(--state-settled)'
                : 'linear-gradient(90deg, var(--border-primary) 50%, transparent)',
              transition: 'background 0.4s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

function FormField({ label, hint, children, error }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</label>
        {hint && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{hint}</span>}
      </div>
      {children}
      {error && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
          <AlertCircle size={12} style={{ color: 'var(--state-disputed)' }} />
          <span style={{ fontSize: 12, color: 'var(--state-disputed)' }}>{error}</span>
        </div>
      )}
    </div>
  )
}

export default function CreateDeal() {
  const navigate = useNavigate()
  const { isConnected, connect } = useWalletStore()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    title: '',
    scope: '',
    criteria: ['', '', ''],
    provider: '',
    openToAny: true,
    pinned: false,
    offerDays: 7,
    workDays: 30,
    reviewDays: 7,
    price: '',
    bondBps: 1000,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addCriterion = () => {
    if (form.criteria.length < 6) set('criteria', [...form.criteria, ''])
  }
  const removeCriterion = (i) => {
    if (form.criteria.length > 1) set('criteria', form.criteria.filter((_, j) => j !== i))
  }

  const [error, setError] = useState(null)
  const { address } = useWalletStore()
  const refreshDeals = useDealsStore(s => s.refreshDeals)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      if (!LIVE) {
        await new Promise(r => setTimeout(r, 1500))
      } else {
        const criteria = form.criteria.map(c => c.trim()).filter(Boolean)
        if (form.title.trim().length < 4) throw new Error('The title needs at least 4 characters.')
        if (criteria.length < 1) throw new Error('Add at least one acceptance criterion.')
        const day = 86400
        await send(address, 'open_deal', [
          form.title.trim(),
          form.scope.trim(),
          criteria.join('\n'),
          form.provider.trim(),
          Math.round(form.offerDays * day),
          Math.round(form.workDays * day),
          Math.round(form.reviewDays * day),
          form.bondBps,
          Boolean(form.pinned),
        ], parseGen(form.price))
        await refreshDeals()
      }
      setSubmitted(true)
      setTimeout(() => navigate('/deals'), 2000)
    } catch (e) {
      setError(humanError(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card"
          style={{ padding: 48, maxWidth: 480, textAlign: 'center' }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔗</div>
          <h2 style={{ margin: '0 0 12px', fontFamily: 'Orbitron, sans-serif', fontSize: 22 }}>Connect to Post a Deal</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>You need a wallet to post a deal and lock funds.</p>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px' }} onClick={connect}>
            Connect Wallet
          </button>
        </motion.div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          style={{ textAlign: 'center' }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.8 }}
            style={{ fontSize: 80, marginBottom: 20 }}
          >⚖️</motion.div>
          <h2 className="gradient-text" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 28, margin: '0 0 12px' }}>Deal Posted!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Redirecting to deals...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 80 }}>
      <div className="container" style={{ padding: '40px 24px', maxWidth: 700 }}>

        <Link to="/deals" className="btn-ghost" style={{ display: 'inline-flex', marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back
        </Link>

        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, fontFamily: 'Orbitron, sans-serif' }}>
          <span className="gradient-text">Post a Deal</span>
        </h1>
        <p style={{ margin: '0 0 40px', color: 'var(--text-secondary)' }}>Define your project, criteria, and payment terms</p>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 0: Basics */}
            {step === 0 && (
              <div>
                <FormField label="Title" hint="4–100 characters">
                  <input className="input-field" placeholder="e.g. Build a landing page for our SaaS" maxLength={100}
                    value={form.title} onChange={e => set('title', e.target.value)} />
                </FormField>
                <FormField label="Scope of Work" hint="10–600 characters">
                  <textarea className="input-field" rows={5}
                    placeholder="Describe exactly what the provider should deliver. Be specific — this is the contract."
                    value={form.scope} onChange={e => set('scope', e.target.value)} />
                </FormField>
                <FormField label="Specific Provider" hint="Leave empty to open to anyone">
                  <input className="input-field" placeholder="0x... (optional)"
                    value={form.provider} onChange={e => { set('provider', e.target.value); set('openToAny', !e.target.value) }} />
                </FormField>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { key: 'openToAny', label: 'Open to anyone', desc: 'Any provider can take this deal' },
                    { key: 'pinned', label: 'Pinned delivery', desc: 'Deliverable must be a commit or IPFS link' },
                  ].map(({ key, label, desc }) => (
                    <button
                      key={key}
                      onClick={() => set(key, !form[key])}
                      style={{
                        flex: 1, padding: '14px', borderRadius: 14,
                        border: `1px solid ${form[key] ? 'var(--accent-cyan)' : 'var(--border-primary)'}`,
                        background: form[key] ? 'var(--accent-cyan-dim)' : 'var(--bg-glass)',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: form[key] ? 'var(--accent-cyan)' : 'transparent',
                          border: '2px solid var(--accent-cyan)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {form[key] && <Check size={11} color="white" />}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: form[key] ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>{label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', paddingLeft: 26 }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Criteria */}
            {step === 1 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Info size={16} style={{ color: 'var(--accent-cyan)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    The AI court can only judge criteria listed here. Be specific and verifiable — the court reads the delivered page.
                  </span>
                </div>
                <div style={{ height: 1, background: 'var(--border-primary)', margin: '16px 0 24px' }} />

                {form.criteria.map((c, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <FormField label={`Criterion ${i + 1}`} hint={`${c.length}/160`}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          className="input-field"
                          placeholder="e.g. Page loads under 3 seconds (Lighthouse score >90)"
                          maxLength={160}
                          value={c}
                          onChange={e => {
                            const nc = [...form.criteria]
                            nc[i] = e.target.value
                            set('criteria', nc)
                          }}
                        />
                        {form.criteria.length > 1 && (
                          <button
                            onClick={() => removeCriterion(i)}
                            style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, cursor: 'pointer', color: 'var(--state-disputed)' }}
                          >
                            <Minus size={16} />
                          </button>
                        )}
                      </div>
                    </FormField>
                  </motion.div>
                ))}

                {form.criteria.length < 6 && (
                  <button
                    onClick={addCriterion}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Plus size={16} /> Add Criterion ({form.criteria.length}/6)
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Timeline */}
            {step === 2 && (
              <div>
                {[
                  { key: 'offerDays', label: 'Offer open for', min: 1, max: 90, desc: 'How long providers can accept your deal' },
                  { key: 'workDays', label: 'Work deadline', min: 1, max: 365, desc: 'Days the provider has to deliver after accepting' },
                  { key: 'reviewDays', label: 'Review window', min: 1, max: 30, desc: 'Days you have to approve or reject the delivery' },
                ].map(({ key, label, min, max, desc }) => (
                  <FormField key={key} label={label} hint={`${form[key]} days`}>
                    <div style={{ marginBottom: 6 }}>
                      <input
                        type="range" min={min} max={max} value={form[key]}
                        onChange={e => set(key, parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{min}d</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{max}d</span>
                    </div>
                  </FormField>
                ))}
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div>
                <FormField label="Price (GEN)" hint="Minimum: 0.1 GEN">
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input-field"
                      type="number" min="0.1" step="0.1"
                      placeholder="e.g. 5.0"
                      value={form.price}
                      onChange={e => set('price', e.target.value)}
                      style={{ paddingRight: 60 }}
                    />
                    <span style={{
                      position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                      fontFamily: 'Orbitron, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)',
                    }}>GEN</span>
                  </div>
                </FormField>

                <FormField label={`Provider Bond: ${form.bondBps / 100}% (${form.price ? (parseFloat(form.price) * form.bondBps / 10000).toFixed(3) : '0.000'} GEN)`}
                  hint="0–30%">
                  <input
                    type="range" min={0} max={3000} step={100} value={form.bondBps}
                    onChange={e => set('bondBps', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-pink)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>0% (no bond)</span>
                    <span>30% (max security)</span>
                  </div>
                </FormField>

                {form.price && parseFloat(form.price) >= 0.1 && (
                  <div style={{
                    padding: '16px 20px', borderRadius: 14,
                    background: 'var(--accent-cyan-dim)', border: '1px solid var(--accent-cyan)',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: 10 }}>💰 Payment Summary</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        ['You lock:', `${parseFloat(form.price).toFixed(3)} GEN`],
                        ['Provider bonds:', `${(parseFloat(form.price) * form.bondBps / 10000).toFixed(3)} GEN`],
                        ['Dispute deposit (client):', `${Math.max(parseFloat(form.price) * 0.03, 0.005).toFixed(3)} GEN`],
                        ['Appeal bond:', `${Math.max(parseFloat(form.price) * 0.1, 0.02).toFixed(3)} GEN`],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                          <span style={{ fontWeight: 700, fontFamily: 'Orbitron, sans-serif', color: 'var(--accent-cyan)' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div>
                <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>{form.title || '(No title)'}</h3>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {form.scope || '(No scope)'}
                  </p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>PRICE</span><div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'Orbitron, sans-serif' }}>{form.price} GEN</div></div>
                    <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CRITERIA</span><div style={{ fontWeight: 700 }}>{form.criteria.filter(Boolean).length}</div></div>
                    <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>WORK TIME</span><div style={{ fontWeight: 700 }}>{form.workDays}d</div></div>
                    <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>BOND</span><div style={{ fontWeight: 700 }}>{form.bondBps / 100}%</div></div>
                  </div>
                </div>
                <div style={{
                  padding: '14px 18px', borderRadius: 12,
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                  fontSize: 13, color: 'var(--text-secondary)',
                }}>
                  ⚠️ Once posted, the price is locked until the deal ends. Review carefully before submitting.
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
          <button
            className="btn-secondary"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            style={{ opacity: step === 0 ? 0.3 : 1 }}
          >
            <ArrowLeft size={16} /> Previous
          </button>

          {step < STEPS.length - 1 ? (
            <button className="btn-primary" onClick={() => setStep(s => s + 1)}>
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <><ParleySpinner size={20} /> Submitting...</>
              ) : (
                <><Zap size={16} /> Post Deal</>
              )}
            </button>
          )}
        </div>
        {error && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center', color: 'var(--state-disputed)', fontSize: 13 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>
    </div>
  )
}
