import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Briefcase, PlusCircle, BookOpen,
  Gavel, User, Menu, X, Zap
} from 'lucide-react'
import ParleyLogo from '@components/ui/ParleyLogo'
import ThemeToggle from '@components/ui/ThemeToggle'
import useWalletStore from '@store/useWalletStore'
import { AccountPanel } from '@components/wallet/AccountPanel'
import { useSound } from '@hooks/useSound'

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
  const location = useLocation()
  const wallet = useWalletStore()
  const { play } = useSound()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMobileOpen(false), [location])

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 500,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          transition: 'all 0.3s ease',
          background: scrolled
            ? 'var(--bg-card)'
            : 'transparent',
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            margin: '0 auto',
          }}
          className="hidden-mobile"
        >
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = location.pathname === link.to
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => play('click')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-cyan-dim)' : 'transparent',
                  border: link.highlight
                    ? '1px solid var(--accent-purple)'
                    : isActive
                    ? '1px solid var(--border-accent)'
                    : '1px solid transparent',
                  ...(link.highlight && {
                    background: 'linear-gradient(135deg, var(--accent-cyan-dim), var(--accent-purple-dim))',
                    color: 'var(--accent-purple)',
                    fontWeight: 600,
                  }),
                }}
                onMouseEnter={() => play('hover')}
              >
                <Icon size={15} />
                {link.label}
                {link.highlight && (
                  <Zap size={12} style={{ color: 'var(--accent-pink)' }} />
                )}
              </NavLink>
            )
          })}
        </div>

        {/* Right side: Theme toggle + Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <ThemeToggle />

          {/* Wallet: connect button / address chip + connect & account modal (from Veritas) */}
          <AccountPanel wallet={wallet} />

          {/* Mobile menu toggle */}
          <button
            className="mobile-only"
            onClick={() => setMobileOpen(v => !v)}
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-primary)',
              borderRadius: 10,
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
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
              position: 'fixed',
              top: 64,
              left: 0,
              right: 0,
              zIndex: 499,
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-primary)',
              overflow: 'hidden',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-primary)',
                    background: isActive ? 'var(--accent-cyan-dim)' : 'transparent',
                  })}
                >
                  <Icon size={18} />
                  {link.label}
                </NavLink>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styles for responsive */}
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
        .spinner-sm {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
