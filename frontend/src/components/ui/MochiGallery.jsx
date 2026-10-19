import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const POSES = [
  { src: '/mochi/mochi-welcome.png', label: 'Welcome', line: 'Open hands. Open court. Every deal is welcome.' },
  { src: '/mochi/mochi-arms-crossed.png', label: 'On guard', line: 'Funds are locked. Mochi is watching the escrow.' },
  { src: '/mochi/mochi-thinking.png', label: 'Deliberating', line: 'Validators are weighing the evidence...' },
]

export default function MochiGallery() {
  const [i, setI] = useState(0)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const pose = POSES[i]
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 16, y: ((e.clientY - r.top) / r.height - 0.5) * -12 })
  }
  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 32, color: 'var(--text-primary)' }}>Meet Mochi</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>The GenLayer mascot, guarding every Parley deal.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 32, alignItems: 'center' }}>
        <div
          onMouseMove={onMove}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
          style={{ perspective: 900, display: 'grid', placeItems: 'center', minHeight: 420 }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={pose.src}
              src={pose.src}
              alt={`Mochi — ${pose.label}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateY: tilt.x, rotateX: tilt.y }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 140, damping: 16 }}
              style={{ height: 420, maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 28px rgba(168,85,247,.45))' }}
            />
          </AnimatePresence>
        </div>
        <div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            {POSES.map((p, n) => (
              <button key={p.label} onClick={() => setI(n)} className={n === i ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 18px', fontSize: 13 }}>
                {p.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 20, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 24 }}>{pose.line}</p>
          <img src="/mochi/mochi-sheet.jpg" alt="Mochi turnaround sheet" loading="lazy" style={{ width: '100%', borderRadius: 16, border: '1px solid var(--border, rgba(255,255,255,.1))' }} />
        </div>
      </div>
    </section>
  )
}
