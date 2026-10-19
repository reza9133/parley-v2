import useThemeStore from '@store/useThemeStore'
import { useSound } from '@hooks/useSound'

const themes = [
  { id: 'dark', icon: '🌑', label: 'Dark' },
  { id: 'dim', icon: '🌙', label: 'Dim' },
  { id: 'light', icon: '☀️', label: 'Light' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()
  const { play } = useSound()

  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '12px',
        padding: '3px',
        gap: '2px',
      }}
      role="radiogroup"
      aria-label="Color theme"
    >
      {themes.map((t) => (
        <button
          key={t.id}
          role="radio"
          aria-checked={theme === t.id}
          onClick={() => {
            play('click')
            setTheme(t.id)
          }}
          title={t.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 28,
            borderRadius: '9px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            background: theme === t.id
              ? 'linear-gradient(135deg, var(--accent-cyan-dim), var(--accent-purple-dim))'
              : 'transparent',
            boxShadow: theme === t.id ? 'inset 0 0 0 1px var(--border-accent)' : 'none',
            transform: theme === t.id ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {t.icon}
        </button>
      ))}
    </div>
  )
}
