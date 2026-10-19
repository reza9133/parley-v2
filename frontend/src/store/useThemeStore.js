import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark', // 'dark' | 'dim' | 'light'
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
      initTheme: () => {
        const stored = useThemeStore.getState().theme
        document.documentElement.setAttribute('data-theme', stored)
      },
    }),
    { name: 'parley-theme' }
  )
)

export default useThemeStore
