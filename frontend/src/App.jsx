import { useEffect } from 'react'
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

export default function App() {
  const { initTheme } = useThemeStore()
  useEffect(() => { initTheme() }, [])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppShell />
    </BrowserRouter>
  )
}
