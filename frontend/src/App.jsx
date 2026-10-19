import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from '@components/layout/Navbar'
import Footer from '@components/layout/Footer'
import Landing from '@pages/Landing'
import Dashboard from '@pages/Dashboard'
import Deals from '@pages/Deals'
import DealDetail from '@pages/DealDetail'
import CreateDeal from '@pages/CreateDeal'
import MyDeals from '@pages/MyDeals'
import Profile from '@pages/Profile'
import Docs from '@pages/Docs'
import Court from '@pages/Court'
import useThemeStore from '@store/useThemeStore'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -12 },
}
const pageTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] }

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/deals/:id" element={<DealDetail />} />
          <Route path="/create" element={<CreateDeal />} />
          <Route path="/my-deals" element={<MyDeals />} />
          <Route path="/profile/:address" element={<Profile />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/court" element={<Court />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', paddingTop: 80,
    }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>⚖️</div>
      <h1 className="gradient-text" style={{ fontFamily: 'Orbitron, sans-serif', margin: '0 0 12px' }}>404</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This page doesn't exist on Studionet.</p>
      <a href="/" className="btn-primary">Back to Home</a>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function AppShell() {
  const isLanding = useLocation().pathname === '/'
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <AnimatedRoutes />
      </main>
      {!isLanding && <Footer />}
    </div>
  )
}

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('[Parley] App error intercepted:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#050714',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚖️</div>
          <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 26, margin: '0 0 12px', color: '#00F5FF' }}>
            Parley Escrow
          </h1>
          <p style={{ color: '#94A3B8', maxWidth: 460, margin: '0 0 24px', lineHeight: 1.6 }}>
            An unexpected error occurred. Click below to refresh and load cleanly.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #00F5FF, #8B5CF6)',
              border: 'none',
              color: '#050714',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: 15,
            }}
          >
            Refresh App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const { initTheme } = useThemeStore()
  useEffect(() => { initTheme() }, [])

  return (
    <RootErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <AppShell />
      </BrowserRouter>
    </RootErrorBoundary>
  )
}

