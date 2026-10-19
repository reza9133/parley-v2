import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Shield, Zap, Globe, Lock, Scale, Brain, Star, CheckCircle, TrendingUp, Users } from 'lucide-react'
import { useAnimatedCounter } from '@hooks/useAnimatedCounter'
import { useScrollReveal } from '@hooks/useScrollReveal'
import MochiCanvas from '@components/3d/MochiCanvas'
import DealCard from '@components/deals/DealCard'
import { mockDeals, mockStats } from '@data/mockData'
import { ParleySpinner, MochiSpinner, HexSpinner, CourtSpinner, OrbitSpinner } from '@components/spinners/Spinners'

// ============================================================
// Stat Counter
// ============================================================
function StatItem({ label, value, prefix = '', suffix = '', color = 'var(--accent-cyan)' }) {
  const ref = useScrollReveal()
  const count = useAnimatedCounter(value)
  return (
    <div ref={ref} style={{ textAlign: 'center', opacity: 0, transition: 'opacity 0.6s ease' }}
      className="reveal-target">
      <div style={{ fontSize: 40, fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color, lineHeight: 1 }}>
        {prefix}{count}{suffix}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 6, letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

// ============================================================
// Feature Card
// ============================================================
function FeatureCard({ icon: Icon, title, desc, color, delay = 0 }) {
  const ref = useScrollReveal()
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="glass-card"
      style={{ padding: 28, flex: 1, minWidth: 240 }}
    >
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: color + '22',
        border: `1px solid ${color}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
      }}>
        <Icon size={24} color={color} />
      </div>
      <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
    </motion.div>
  )
}

// ============================================================
// How It Works Step
// ============================================================
function Step({ num, title, desc, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: num % 2 === 0 ? 40 : -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}
    >
      <div style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}, #8B5CF6)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 800,
        fontFamily: 'Orbitron, sans-serif',
        color: '#fff',
        flexShrink: 0,
        boxShadow: `0 4px 20px ${color}44`,
      }}>
        {num}
      </div>
      <div>
        <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h4>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
      </div>
    </motion.div>
  )
}

// ============================================================
// Spinning particles in hero
// ============================================================
function FloatingOrbs() {
  return (
    <>
      <div className="hero-orb" style={{
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(0,245,255,0.15) 0%, transparent 70%)',
        top: '-100px', left: '-100px',
        animationDelay: '0s',
      }} />
      <div className="hero-orb" style={{
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
        top: '100px', right: '-50px',
        animationDelay: '-3s',
        animationDuration: '10s',
      }} />
      <div className="hero-orb" style={{
        width: 200, height: 200,
        background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',
        bottom: '50px', left: '30%',
        animationDelay: '-6s',
        animationDuration: '7s',
      }} />
    </>
  )
}

// ============================================================
// Landing Page
// ============================================================
export default function Landing() {
  const heroRef = useRef()
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const heroY = useTransform(scrollY, [0, 400], [0, -80])

  const recentDeals = mockDeals.slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ====================================================
          HERO SECTION
      ==================================================== */}
      <section
        ref={heroRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background grid */}
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />

        {/* Gradient orbs */}
        <FloatingOrbs />

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 120, paddingBottom: 80 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 60,
            alignItems: 'center',
          }}>
            {/* Left: Text */}
            <motion.div style={{ opacity: heroOpacity, y: heroY }}>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 16px',
                  borderRadius: 20,
                  background: 'var(--accent-cyan-dim)',
                  border: '1px solid var(--accent-cyan)',
                  marginBottom: 24,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--accent-cyan)',
                  letterSpacing: '0.05em',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'pulse 2s infinite' }} />
                LIVE ON GENLAYER STUDIONET
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  margin: '0 0 20px',
                  fontSize: 'clamp(36px, 4.5vw, 64px)',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  fontFamily: 'Orbitron, sans-serif',
                }}
              >
                <span className="gradient-text">Trustless</span>{' '}
                <span style={{ color: 'var(--text-primary)' }}>Freelance</span>
                <br />
                <span style={{ color: 'var(--text-primary)' }}>Escrow — </span>
                <span className="gradient-text-purple-pink">AI Decided</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                style={{
                  margin: '0 0 32px',
                  fontSize: 18,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  maxWidth: 480,
                }}
              >
                Lock funds, deliver work, let AI settle disputes. No middlemen, no trust required.
                The GenLayer intelligent contract reads the page and scores it against agreed criteria.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
              >
                <Link to="/create" className="btn-primary" style={{ fontSize: 15, padding: '14px 32px' }}>
                  <Zap size={16} />
                  Post a Deal
                  <ArrowRight size={16} />
                </Link>
                <Link to="/deals" className="btn-secondary" style={{ fontSize: 15, padding: '14px 28px' }}>
                  <Globe size={16} />
                  Explore Deals
                </Link>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{ display: 'flex', gap: 20, marginTop: 32, flexWrap: 'wrap' }}
              >
                {[
                  { icon: Shield, text: 'Non-custodial' },
                  { icon: Brain, text: 'AI Court' },
                  { icon: Lock, text: 'Open Source' },
                ].map(({ icon: I, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-tertiary)' }}>
                    <I size={14} style={{ color: 'var(--accent-purple)' }} />
                    {text}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: 3D Mochi */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* Glow behind canvas */}
              <div style={{
                position: 'absolute',
                width: 360,
                height: 360,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(0,245,255,0.1) 50%, transparent 70%)',
                filter: 'blur(40px)',
                animation: 'float 6s ease-in-out infinite',
              }} />

              <MochiCanvas size={420} />

              {/* Floating labels */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: 60,
                  left: -10,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  backdropFilter: 'blur(20px)',
                  zIndex: 2,
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>AI COURT RULING</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'Orbitron, sans-serif' }}>87.5% ✓</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                style={{
                  position: 'absolute',
                  bottom: 80,
                  right: -10,
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(16,185,129,0.4)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  backdropFilter: 'blur(20px)',
                  zIndex: 2,
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>DEAL SETTLED</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981', fontFamily: 'Orbitron, sans-serif' }}>+5.0 GEN</div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-muted)',
            fontSize: 11,
            letterSpacing: '0.1em',
          }}
        >
          SCROLL
          <div style={{
            width: 1,
            height: 40,
            background: 'linear-gradient(to bottom, var(--accent-cyan), transparent)',
          }} />
        </motion.div>
      </section>

      {/* ====================================================
          STATS SECTION
      ==================================================== */}
      <section style={{ padding: '80px 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 40 }}
          >
            <StatItem label="Total Deals" value={847} color="var(--accent-cyan)" />
            <StatItem label="GEN Escrowed" value="2,341" suffix=" GEN" color="var(--accent-purple)" />
            <StatItem label="Deals Settled" value={712} color="var(--state-settled)" />
            <StatItem label="Avg Completion" value="91" suffix="%" color="var(--accent-pink)" />
            <StatItem label="Active Providers" value={234} color="var(--state-active)" />
          </motion.div>
        </div>
      </section>

      {/* ====================================================
          HOW IT WORKS
      ==================================================== */}
      <section className="section" style={{ background: 'var(--bg-primary)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <div style={{
              display: 'inline-block',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.15em',
              color: 'var(--accent-cyan)', marginBottom: 12,
              padding: '5px 16px', borderRadius: 20,
              background: 'var(--accent-cyan-dim)',
              border: '1px solid var(--accent-cyan)',
            }}>
              HOW IT WORKS
            </div>
            <h2 style={{ margin: '0 0 16px', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, fontFamily: 'Orbitron, sans-serif', color: 'var(--text-primary)' }}>
              No middlemen. No trust. <span className="gradient-text">Just code.</span>
            </h2>
            <p style={{ margin: 0, fontSize: 16, color: 'var(--text-secondary)', maxWidth: 540, marginInline: 'auto' }}>
              Every step is enforced by the GenLayer intelligent contract. The AI court reads the actual delivered page and scores it against agreed criteria.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start', maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <Step num="1" title="Client posts a deal" color="var(--accent-cyan)"
                desc="Lock the price in the contract. Write acceptance criteria (up to 6 items). Set the work deadline and review window." />
              <Step num="2" title="Provider takes it" color="var(--accent-purple)"
                desc="Provider posts a bond (up to 30% of price) and starts the work. Missing the deadline forfeits the bond." />
              <Step num="3" title="Work is delivered" color="var(--accent-pink)"
                desc="Provider submits a link to the completed work. Client has the review window to approve or reject." />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <Step num="4" title="Client can approve or reject" color="#F59E0B"
                desc="Approval (or silence after review time) releases the full payment. Rejection opens a hearing and requires a small deposit." />
              <Step num="5" title="AI Court reads the page" color="var(--state-ruled)"
                desc="The GenLayer AI reads the delivered page and scores each criterion: fully met (2), partly met (1), or not met (0). Quotes must appear in the page." />
              <Step num="6" title="Funds are distributed" color="var(--state-settled)"
                desc="Provider earns the percentage matching their score. Both parties call claim() — money is never pushed automatically." />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          FEATURES
      ==================================================== */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 800, fontFamily: 'Orbitron, sans-serif' }}>
              <span className="gradient-text">Built Different</span>
            </h2>
          </motion.div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            <FeatureCard icon={Scale} title="Partial Credit" delay={0.0}
              color="var(--accent-cyan)"
              desc="A page meeting 3 of 4 criteria earns 3/4 of the price. No all-or-nothing cliff — fair payment for partial work." />
            <FeatureCard icon={Brain} title="AI Court" delay={0.1}
              color="var(--accent-purple)"
              desc="GenLayer validators read the delivered page independently. Quotes must appear verbatim. Model bias is caught by validator consensus." />
            <FeatureCard icon={Shield} title="Skin in the Game" delay={0.2}
              color="var(--accent-pink)"
              desc="Provider's bond deters default. Client's deposit deters frivolous rejections. Appeal bond makes appealing a real bet." />
            <FeatureCard icon={CheckCircle} title="Silence = Approval" delay={0.3}
              color="var(--state-settled)"
              desc="A client who never responds approves the work after the review time. A provider who never replies loses on what the page shows." />
            <FeatureCard icon={Lock} title="Pull Payments" delay={0.4}
              color="#F59E0B"
              desc="Claims are marked before transfer. No reentrancy. Every wei that comes in leaves again — the contract keeps deposited & paid counters." />
            <FeatureCard icon={TrendingUp} title="No Funds Get Stuck" delay={0.5}
              color="var(--state-active)"
              desc="Every state has an exit: expire, finalize, release, or agreement. 30-day release for disputes without a ruling." />
          </div>
        </div>
      </section>

      {/* ====================================================
          RECENT DEALS
      ==================================================== */}
      <section className="section" style={{ background: 'var(--bg-primary)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, fontFamily: 'Orbitron, sans-serif' }}>
                Recent Deals
              </h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>Live on Studionet</p>
            </motion.div>
            <Link to="/deals" className="btn-secondary">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {recentDeals.map((deal, i) => (
              <DealCard key={deal.id} deal={deal} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================
          SPINNERS SHOWCASE
      ==================================================== */}
      <section style={{ padding: '60px 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ color: 'var(--text-tertiary)', fontSize: 11, letterSpacing: '0.15em', marginBottom: 28 }}
          >
            PARLEY LOADING INDICATORS
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ display: 'flex', gap: 48, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <ParleySpinner size={52} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Scales</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <MochiSpinner size={52} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mochi</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <HexSpinner size={52} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hex</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <CourtSpinner size={52} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Court</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <OrbitSpinner size={52} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Orbit</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====================================================
          CTA
      ==================================================== */}
      <section style={{
        padding: '100px 24px',
        background: 'var(--bg-primary)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.15) 0%, rgba(0,245,255,0.08) 40%, transparent 70%)',
        }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}
        >
          <div style={{
            fontSize: 64,
            marginBottom: 16,
            filter: 'drop-shadow(0 0 20px rgba(0,245,255,0.4))',
          }}>⚖️</div>
          <h2 style={{
            margin: '0 0 16px',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 900,
            fontFamily: 'Orbitron, sans-serif',
          }}>
            Ready to <span className="gradient-text">Parley?</span>
          </h2>
          <p style={{ margin: '0 0 36px', fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            Post a deal, take a deal, or just browse. No account needed — just a wallet.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/create" className="btn-primary" style={{ fontSize: 16, padding: '16px 40px' }}>
              <Zap size={18} />
              Post Your First Deal
            </Link>
            <Link to="/docs" className="btn-secondary" style={{ fontSize: 16, padding: '16px 32px' }}>
              Read the Docs
            </Link>
          </div>
        </motion.div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
        .reveal-target.revealed { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
