import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Briefcase, PlusCircle, BookOpen,
  Gavel, User, Menu, X, Wallet, ChevronDown, Zap,
  AlertTriangle, RefreshCw, ExternalLink
} from 'lucide-react'
import ParleyLogo from '@components/ui/ParleyLogo'
import ThemeToggle from '@components/ui/ThemeToggle'
import useWalletStore from '@store/useWalletStore'
import { useSound } from '@hooks/useSound'
import { switchToStudionet } from '@data/parleyService'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/deals', label: 'Explore', icon: Briefcase },
  { to: '/my-deals', label: 'My Deals', icon: User },
  { to: '/create', label: 'Post Deal', icon: PlusCircle, highlight: true },
  { to: '/court', label: 'Court', icon: Gavel },
  { to: '/docs', label: 'Docs', icon: BookOpen },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [walletDropdown, setWalletDropdown] = useState(false)
  const location = useLocation()
  const {
    address, isConnected, isConnecting, isWrongNetwork,
    connect, disconnect, shortAddress, balance, error, refreshBalance
  } = useWalletStore()
  const { play } = useSound()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMobileOpen(false), [location])

  return (
    <>
      {/* Wrong network banner */}
      <AnimatePresence>
        {isWrongNetwork && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 600,
              background: 'linear-gradient(90deg, #B45309, #92400E)',
              padding: '10px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              fontSize: 13, color: '#fff',
            }}
          >
            <AlertTriangle size={15} />
            <span>Wrong network — Parley runs on GenLayer Studionet</span>
            <button
              onClick={switchToStudionet}
              style={{
                padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                color: '#fff', cursor: 'pointer',
              }}
            >
              Switch Network
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: isWrongNetwork ? 44 : 0,
          left: 0, right: 0,
          zIndex: 500,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          transition: 'all 0.3s ease',
          background: scrolled ? 'var(--bg-card)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border-primary)' : '1px solid transparent',
          boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
        }}
      >
        {/* Logo */}
        <Link to="/" onClick={() => play('click')} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <ParleyLogo size={32} showText={true} />
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto' }} className="hidden-mobile">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = location.pathname === link.to
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => play('click')}
                onMouseEnter={() => play('hover')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: '10px',
                  fontSize: 14, fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none', transition: 'all 0.2s ease',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-cyan-dim)' : 'transparent',
                  border: link.highlight
                    ? '1px solid var(--accent-purple)'
                    : isActive ? '1px solid var(--border-accent)' : '1px solid transparent',
                  ...(link.highlight && {
                    background: 'linear-gradient(135deg, var(--accent-cyan-dim), var(--accent-purple-dim))',
                    color: 'var(--accent-purple)', fontWeight: 600,
                  }),
                }}
              >
                <Icon size={15} />
                {link.label}
                {link.highlight && <Zap size={12} style={{ color: 'var(--accent-pink)' }} />}
              </NavLink>
            )
          })}
        </div>

        {/* Right: Theme + Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <ThemeToggle />

          {/* Wallet Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                play('click')
                if (!isConnected) connect()
                else setWalletDropdown(v => !v)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 12, border: '1px solid',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                transition: 'all 0.3s ease',
                ...(isConnected ? {
                  background: 'var(--accent-cyan-dim)',
                  borderColor: 'var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                } : isWrongNetwork ? {
                  background: 'rgba(245,158,11,0.15)',
                  borderColor: '#F59E0B',
                  color: '#F59E0B',
                } : {
                  background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                  borderColor: 'transparent',
                  color: '#fff',
                }),
              }}
            >
              <Wallet size={14} />
              {isConnecting ? (
                <><SpinnerDot /> Connecting…</>
              ) : isWrongNetwork ? (
                <><AlertTriangle size={13} /> Wrong Network</>
              ) : isConnected ? (
                <>{typeof shortAddress === 'function' ? shortAddress() : (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '')} <ChevronDown size={12} /></>
              ) : (
                'Connect Wallet'
              )}
            </button>

            {/* Wallet Dropdown */}
            <AnimatePresence>
              {walletDropdown && isConnected && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 260,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 16, padding: 18,
                    boxShadow: 'var(--shadow-lg)', zIndex: 999,
                  }}
                  onMouseLeave={() => setWalletDropdown(false)}
                >
                  {/* Network indicator */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
                    padding: '6px 10px', borderRadius: 8,
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    fontSize: 11, color: 'var(--state-settled)',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--state-settled)', animation: 'pulse 2s infinite' }} />
                    GenLayer Studionet
                  </div>

                  {/* Address */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>WALLET ADDRESS</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1.4 }}>
                      {address}
                    </div>
                  </div>

                  {/* Balance */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>BALANCE</div>
                      <div style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: 20, fontFamily: 'Orbitron, sans-serif' }}>
                        {balance ? parseFloat(balance).toFixed(4) : '…'} GEN
                      </div>
                    </div>
                    <button onClick={refreshBalance} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                      <RefreshCw size={14} />
                    </button>
                  </div>

                  {/* Explorer link */}
                  <a
                    href={`https://studio.genlayer.com/address/${address}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                      color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 14,
                    }}
                  >
                    <ExternalLink size={11} /> View on Studionet Explorer
                  </a>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link
                      to={`/profile/${address}`}
                      style={{ flex: 1 }}
                      onClick={() => setWalletDropdown(false)}
                    >
                      <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: 13 }}>
                        My Profile
                      </button>
                    </Link>
                    <button
                      className="btn-ghost"
                      style={{ color: 'var(--state-disputed)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, padding: '8px 12px' }}
                      onClick={() => { disconnect(); setWalletDropdown(false) }}
                    >
                      Disconnect
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="mobile-only"
            onClick={() => setMobileOpen(v => !v)}
            style={{
              background: 'var(--bg-glass)', border: '1px solid var(--border-primary)',
              borderRadius: 10, padding: '8px', cursor: 'pointer',
              color: 'var(--text-primary)', display: 'flex',
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed', top: isWrongNetwork ? 108 : 64, left: 0, right: 0, zIndex: 499,
              background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)',
              overflow: 'hidden', padding: '16px 24px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => { play('click'); setMobileOpen(false) }}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 12, fontSize: 15,
                    fontWeight: 500, textDecoration: 'none',
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-primary)',
                    background: isActive ? 'var(--accent-cyan-dim)' : 'transparent',
                  })}
                >
                  <Icon size={18} />
                  {link.label}
                </NavLink>
              )
            })}

            {error && (
              <div style={{
                marginTop: 8, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                fontSize: 13, color: 'var(--state-disputed)',
              }}>
                {error}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) { .hidden-mobile { display: none !important; } }
        @media (min-width: 769px) { .mobile-only { display: none !important; } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.5); } }
      `}</style>
    </>
  )
}

function SpinnerDot() {
  return (
    <div style={{
      width: 12, height: 12, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
      animation: 'spin 0.8s linear infinite', display: 'inline-block',
    }} />
  )
}
