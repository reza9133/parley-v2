import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ChevronDown, ChevronRight, ExternalLink, Copy, Check, Code, Terminal, Zap, Scale, Brain, Lock } from 'lucide-react'

const CONTRACT = '0x5d084E85056Acc332793f34667b8a9890f7B2Bd9'

function Section({ id, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div id={id} style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
          borderRadius: open ? '14px 14px 0 0' : 14,
          cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
        {open ? <ChevronDown size={18} style={{ color: 'var(--accent-cyan)' }} /> : <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            padding: '20px 24px',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-primary)', borderTop: 'none',
            borderRadius: '0 0 14px 14px',
          }}
        >
          {children}
        </motion.div>
      )}
    </div>
  )
}

function CodeBlock({ code, lang = 'bash' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <pre style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 12,
        padding: '16px 20px',
        overflow: 'auto',
        fontSize: 13,
        fontFamily: 'JetBrains Mono, monospace',
        color: 'var(--accent-cyan)',
        lineHeight: 1.6,
        margin: 0,
      }}>
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        style={{
          position: 'absolute', top: 10, right: 10,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
          borderRadius: 8, padding: '4px 8px', cursor: 'pointer',
          color: copied ? 'var(--state-settled)' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
        }}
      >
        {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
      </button>
    </div>
  )
}

function MethodRow({ method, who, desc }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-primary)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-cyan)' }}>{method}</td>
      <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--accent-purple)' }}>{who}</td>
      <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</td>
    </tr>
  )
}

export default function Docs() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 80 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 'calc(100vh - 80px)' }}>

        {/* Sidebar */}
        <div style={{
          borderRight: '1px solid var(--border-primary)',
          padding: '32px 20px',
          position: 'sticky',
          top: 64,
          height: 'calc(100vh - 80px)',
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 16 }}>DOCUMENTATION</div>
          {[
            { id: 'overview', label: '📋 Overview' },
            { id: 'how-it-works', label: '⚙️ How It Works' },
            { id: 'deal-lifecycle', label: '🔄 Deal Lifecycle' },
            { id: 'ai-court', label: '⚖️ AI Court' },
            { id: 'interface', label: '🔌 Interface / API' },
            { id: 'parameters', label: '📊 Parameters' },
            { id: 'payouts', label: '💰 Payouts' },
            { id: 'security', label: '🔒 Security' },
            { id: 'deploy', label: '🚀 Deploy & Run' },
          ].map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              style={{
                display: 'block', padding: '8px 12px',
                borderRadius: 8, fontSize: 14,
                color: 'var(--text-secondary)', textDecoration: 'none',
                transition: 'all 0.2s', marginBottom: 4,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '40px 48px', maxWidth: 900 }}>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'var(--accent-cyan-dim)', border: '1px solid var(--accent-cyan)', marginBottom: 16 }}>
              <BookOpen size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)' }}>DOCUMENTATION</span>
            </div>
            <h1 id="overview" style={{ margin: '0 0 12px', fontSize: 36, fontWeight: 900, fontFamily: 'Orbitron, sans-serif' }}>
              <span className="gradient-text">Parley</span> Docs
            </h1>
            <p style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Parley is an escrow for freelance-style work, written as a GenLayer intelligent contract for Studionet. A client locks the price and writes down acceptance criteria. A provider takes the job and posts a bond. The AI court reads the delivered page and scores it.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
              <a href={`https://studio.genlayer.com/address/${CONTRACT}`} target="_blank" rel="noopener noreferrer"
                className="btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }}>
                <ExternalLink size={13} /> View Contract
              </a>
              <a href="https://github.com/parley/parley" target="_blank" rel="noopener noreferrer"
                className="btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }}>
                <Code size={13} /> Source Code
              </a>
            </div>
          </motion.div>

          <Section id="how-it-works" title="⚙️ How It Works" defaultOpen={true}>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
              A client locks the price and writes down acceptance criteria. A provider takes the job and posts a bond. When the provider hands in a link to the work, the client can approve it, ignore it (silence counts as approval), or reject it.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
              A rejection opens a hearing, and an AI court reads the delivered page and scores it against the agreed criteria, one by one. The provider earns the share of the price that matches the score, the rest goes back to the client.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { icon: Scale, text: 'No trust required', color: 'var(--accent-cyan)' },
                { icon: Brain, text: 'AI decides disputes', color: 'var(--accent-purple)' },
                { icon: Lock, text: 'Pull payments only', color: 'var(--accent-pink)' },
              ].map(({ icon: I, text, color }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: color + '10', border: `1px solid ${color}33`, fontSize: 13, color }}>
                  <I size={14} /> {text}
                </div>
              ))}
            </div>
          </Section>

          <Section id="deal-lifecycle" title="🔄 Deal Lifecycle">
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.7 }}>
              Deals move through states: OPEN → ACTIVE → DELIVERED → DISPUTED/SETTLED → RULED → APPEALED → SETTLED
            </p>
            <CodeBlock code={`OPEN ──────────────────> CANCELLED  (client withdraws or expires)
  │
  │ accept_deal
  ▼
ACTIVE ──────────────> DEFAULTED  (provider missed deadline)
  │
  │ deliver
  ▼
DELIVERED ───────────> SETTLED    (approve / silent finalize)
  │
  │ reject
  ▼
DISPUTED ────────────> SETTLED    (accept_split / 30-day release)
  │
  │ rule
  ▼
RULED ───────────────> SETTLED    (finalize after window)
  │
  │ appeal
  ▼
APPEALED ────────────> SETTLED    (final rule / release)`} lang="text" />
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
              Money is never pushed to anyone. When a deal is over, each party calls <code style={{ color: 'var(--accent-cyan)' }}>claim()</code> once and the contract sends them what the outcome says they are owed.
            </p>
          </Section>

          <Section id="ai-court" title="⚖️ AI Court">
            <h4 style={{ margin: '0 0 12px', color: 'var(--accent-purple)' }}>Scoring</h4>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20, marginBottom: 16 }}>
              <li>Every criterion gets a status: <strong style={{ color: 'var(--state-settled)' }}>2</strong> = fully met, <strong style={{ color: 'var(--state-active)' }}>1</strong> = partly met, <strong style={{ color: 'var(--state-disputed)' }}>0</strong> = not met</li>
              <li>A status above 0 needs a quote copied word for word from the delivered page</li>
              <li>The contract checks that the quote really appears in the text of the page</li>
              <li>Completion = credit given ÷ credit possible (in basis points)</li>
            </ul>
            <h4 style={{ margin: '0 0 12px', color: 'var(--accent-purple)' }}>Validator Consensus</h4>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 0 }}>
              Each validator reads the pages and rules independently. It accepts the leader's ruling when both rulings are of the same kind, no criterion differs by two levels, total differs by at most half as many levels as criteria, and every quote of the leader appears on the validator's own copy.
            </p>
          </Section>

          <Section id="interface" title="🔌 Interface / API">
            <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>Write Methods</h4>
            <div style={{ overflowX: 'auto', marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    {['Method', 'Who', 'Description'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <MethodRow method="open_deal(...)" who="client" desc="Locks the price. An empty provider lets anyone take the deal." />
                  <MethodRow method="accept_deal(deal_id)" who="provider" desc="Takes the deal and posts exactly the bond amount." />
                  <MethodRow method="deliver(deal_id, url, note)" who="provider" desc="Hands in the work before the due date." />
                  <MethodRow method="approve(deal_id)" who="client" desc="Accepts the work, releases full payment." />
                  <MethodRow method="reject(deal_id, reason, url)" who="client" desc="Opens a hearing with exactly the dispute deposit." />
                  <MethodRow method="reply(deal_id, statement, url)" who="either" desc="One reply per hearing in the filing window." />
                  <MethodRow method="propose_split(deal_id, bps)" who="either" desc="Propose a split settlement without the court." />
                  <MethodRow method="rule(deal_id)" who="anyone" desc="Asks the AI court. Available after reply or window end." />
                  <MethodRow method="appeal(deal_id, ...)" who="either" desc="Appeals the first ruling with the appeal bond." />
                  <MethodRow method="finalize(deal_id)" who="anyone" desc="Closes a delivery nobody answered, or ruling nobody appealed." />
                  <MethodRow method="claim(deal_id)" who="client/provider" desc="Pays out what the closed deal owes the caller. Once per party." />
                </tbody>
              </table>
            </div>
            <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>View Methods</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              All return JSON text: <code style={{ color: 'var(--accent-cyan)' }}>get_deal</code>, <code style={{ color: 'var(--accent-cyan)' }}>list_deals(offset, limit)</code>, <code style={{ color: 'var(--accent-cyan)' }}>deals_of(address, offset, limit)</code>, <code style={{ color: 'var(--accent-cyan)' }}>owed_of(deal_id, address)</code>, <code style={{ color: 'var(--accent-cyan)' }}>profile_of(address)</code>, <code style={{ color: 'var(--accent-cyan)' }}>stats()</code>
            </p>
          </Section>

          <Section id="parameters" title="📊 Parameters">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    {['Parameter', 'Value'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Minimum price', '0.1 GEN'],
                    ['Maximum bond', '30% of price'],
                    ['Dispute deposit', '3% of price (min 0.005 GEN)'],
                    ['Appeal bond', '10% of price (min 0.02 GEN)'],
                    ['Offer window', '5 minutes to 90 days'],
                    ['Work window', '5 minutes to 1 year'],
                    ['Review window', '5 minutes to 30 days'],
                    ['Hearing window', 'Review time, clamped to 10min–7days'],
                    ['Acceptance criteria', '1 to 6 items (6–160 chars each)'],
                    ['Release after', '30 days without a ruling'],
                    ['Appeals', '1 per deal; final ruling after appeal'],
                  ].map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid var(--border-primary)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{k}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="payouts" title="💰 Payouts">
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
              <code style={{ color: 'var(--accent-cyan)' }}>earned = price × completion / 10000</code>. The client always gets <code style={{ color: 'var(--accent-pink)' }}>price − earned</code>.
            </p>
            <CodeBlock code={`| Completion | Client Gets              | Provider Gets                    |
|------------|--------------------------|----------------------------------|
| ≥ 80%      | Price - Earned           | Earned + Bond + Client Deposit   |
| 30-80%     | Price - Earned + Deposit | Earned + Bond                    |
| ≤ 30%      | Price - Earned + P.Bond + Deposit | Earned                  |
| Approved   | 0                        | Full Price + Bond                |
| Default    | Price + Bond             | 0                                |
| Cancelled  | Price                    | 0                                |`} lang="text" />
          </Section>

          <Section id="security" title="🔒 Security Design">
            {[
              { title: 'Pull Payments', desc: 'Claims are marked before transfer. No reentrancy — a second claim finds nothing.' },
              { title: 'Criteria Fixed at Open', desc: 'The client cannot raise the bar after delivery. The court ignores anything not on the list.' },
              { title: 'URL Validation', desc: 'Deliverable must be a real public domain — no IP literals, no credentials, no custom ports.' },
              { title: 'Pinned Deliverables', desc: 'When pinned, deliverable must be a commit-hash GitHub link or IPFS CID — immutable.' },
              { title: 'Quote Verification', desc: 'The contract checks that every quote literally appears on the delivered page text.' },
              { title: 'No Stuck Funds', desc: 'Every state has an exit: expire, finalize, release, or agreement. 30-day neutral release.' },
            ].map(({ title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)', flexShrink: 0, marginTop: 7 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </Section>

          <Section id="deploy" title="🚀 Deploy & Run">
            <h4 style={{ margin: '0 0 10px', color: 'var(--text-primary)' }}>Quick Start</h4>
            <CodeBlock code={`pip install -r requirements.txt

# Static checks
genvm-lint check contracts/parley.py

# Deploy to Studionet
genlayer network set studionet
genlayer deploy --contract contracts/parley.py

# Run tests (in-memory, mocked web and AI)
pytest`} />
            <h4 style={{ margin: '16px 0 10px', color: 'var(--text-primary)' }}>Live E2E Tests</h4>
            <CodeBlock code={`npm install
export CLIENT_KEY=0x... PROVIDER_KEY=0x...
node scripts/e2e.mjs   # All scenarios
PARLEY_ADDRESS=${CONTRACT} node scripts/e2e.mjs --only approve,court`} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
              Reports are written to <code style={{ color: 'var(--accent-cyan)' }}>reports/parley-e2e-&lt;time&gt;.html</code>, <code style={{ color: 'var(--accent-cyan)' }}>.md</code> and <code style={{ color: 'var(--accent-cyan)' }}>.json</code>; the HTML page auto-refreshes while the run is in progress.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
