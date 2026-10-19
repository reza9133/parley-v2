import { Link } from 'react-router-dom'
import { Github, Twitter, Globe, ExternalLink } from 'lucide-react'
import ParleyLogo from '@components/ui/ParleyLogo'
import GenLayerBadge from '@components/ui/GenLayerBadge'

const CONTRACT = '0x5d084E85056Acc332793f34667b8a9890f7B2Bd9'

const footerLinks = {
  Platform: [
    { label: 'Explore Deals', to: '/deals' },
    { label: 'Post a Deal', to: '/create' },
    { label: 'My Deals', to: '/my-deals' },
    { label: 'AI Court', to: '/court' },
  ],
  Resources: [
    { label: 'Documentation', to: '/docs' },
    { label: 'How It Works', to: '/docs#how-it-works' },
    { label: 'Contract Source', href: 'https://github.com/parley/parley/blob/main/contracts/parley.py' },
    { label: 'E2E Test Report', href: '#', label2: 'View Report' },
  ],
  Network: [
    { label: 'GenLayer', href: 'https://genlayer.com' },
    { label: 'Studionet Explorer', href: 'https://studio.genlayer.com' },
    { label: `Contract: ${CONTRACT.slice(0, 10)}...`, href: `https://studio.genlayer.com/address/${CONTRACT}` },
  ],
}

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-primary)',
        marginTop: 'auto',
      }}
    >
      {/* Gradient top line */}
      <div className="divider-glow" />

      <div className="container" style={{ padding: '60px 24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 48, flexWrap: 'wrap' }}>
          {/* Brand column */}
          <div style={{ minWidth: 240 }}>
            <ParleyLogo size={36} showText={true} />
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 14,
              lineHeight: 1.7,
              marginTop: 16,
              maxWidth: 280,
            }}>
              Trustless escrow for freelance work on GenLayer. AI-powered dispute resolution — no middlemen, no trust required.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <a href="https://github.com/parley" target="_blank" rel="noopener noreferrer"
                className="btn-ghost" style={{ padding: '8px', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                <Github size={16} />
              </a>
              <a href="https://twitter.com/parley_genlayer" target="_blank" rel="noopener noreferrer"
                className="btn-ghost" style={{ padding: '8px', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                <Twitter size={16} />
              </a>
              <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer"
                className="btn-ghost" style={{ padding: '8px', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                <Globe size={16} />
              </a>
            </div>

            {/* Contract address */}
            <div style={{
              marginTop: 20,
              padding: '10px 14px',
              background: 'var(--bg-primary)',
              borderRadius: 10,
              border: '1px solid var(--border-primary)',
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'var(--text-tertiary)',
            }}>
              <div style={{ color: 'var(--accent-green)', fontSize: 10, marginBottom: 3 }}>● LIVE ON STUDIONET</div>
              {CONTRACT}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} style={{ minWidth: 140 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}>
                {category}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((link) => (
                  link.to ? (
                    <Link
                      key={link.label}
                      to={link.to}
                      style={{
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontSize: 14,
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.target.style.color = 'var(--accent-cyan)'}
                      onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      {link.label}
                      <ExternalLink size={10} />
                    </a>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="divider" style={{ margin: '40px 0 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            © 2024 Parley. Built on{' '}
            <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent-purple)', textDecoration: 'none' }}>
              GenLayer
            </a>
            . Open source.
          </div>

          {/* GenLayer powered badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              POWERED BY
            </span>
            <GenLayerBadge size={22} showText={true} />
          </div>
        </div>
      </div>
    </footer>
  )
}
