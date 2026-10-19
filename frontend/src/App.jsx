import { useEffect, useState, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import useThemeStore from '@store/useThemeStore'
import useWalletStore from '@store/useWalletStore'
import useDealsStore from '@store/useDealsStore'
import Navbar from '@components/layout/Navbar'
import Footer from '@components/layout/Footer'
import { ParleySpinner } from '@components/spinners/Spinners'
import ErrorBoundary from '@components/ui/ErrorBoundary'
import ParleyLogo from '@components/ui/ParleyLogo'
import Landing from '@pages/Landing'
import Dashboard from '@pages/Dashboard'
import Deals from '@pages/Deals'
import DealDetail from '@pages/DealDetail'
import CreateDeal from '@pages/CreateDeal'
import MyDeals from '@pages/MyDeals'
import Profile from '@pages/Profile'
import Court from '@pages/Court'
import Docs from '@pages/Docs'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
      }, 120)
      return () => clearTimeout(t)
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

function NotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center', padding: 24 }}>
      <img src="/mochi/mochi-thinking.png" alt="Mochi thinking" style={{ height: 260, objectFit: 'contain' }} />
      <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 40, color: 'var(--text-primary)' }}>404</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 380 }}>Mochi searched the whole court and could not find this page.</p>
      <Link to="/" className="btn-primary">Back to Parley</Link>
    </div>
  )
}

function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-primary, #050714)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}
    >
      <ParleyLogo size={72} showText />
      <ParleySpinner size={48} />
    </motion.div>
  )
}

function Shell() {
  const location = useLocation()
  return (
    <>
      <ScrollManager />
      <Navbar />
      <main style={{ minHeight: '100vh', paddingTop: 72 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Suspense fallback={<div style={{ display: 'grid', placeItems: 'center', height: '60vh' }}><ParleySpinner size={56} /></div>}>
              <ErrorBoundary fallback={<div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>Something went wrong loading this page. Please refresh.</div>}>
              <Routes location={location}>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/deals/:id" element={<DealDetail />} />
                <Route path="/create" element={<CreateDeal />} />
                <Route path="/my-deals" element={<MyDeals />} />
                <Route path="/profile/:address" element={<Profile />} />
                <Route path="/court" element={<Court />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </ErrorBoundary>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  const initTheme = useThemeStore((s) => s.initTheme)
  const [splash, setSplash] = useState(() => {
    try { return !sessionStorage.getItem('parley-splash') } catch { return true }
  })
  useEffect(() => {
    initTheme()
    useWalletStore.getState().init()
    useDealsStore.getState().refreshDeals()
    const t = setInterval(() => useDealsStore.getState().refreshDeals(), 60000)
    return () => clearInterval(t)
  }, [initTheme])
  const done = () => {
    try { sessionStorage.setItem('parley-splash', '1') } catch {}
    setSplash(false)
  }
  return (
    <BrowserRouter>
      <AnimatePresence>{splash && <Splash key="splash" onDone={done} />}</AnimatePresence>
      <Shell />
    </BrowserRouter>
  )
}
