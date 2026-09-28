import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'theme'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  const themeColorMeta = document.getElementById('theme-color-meta')
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', theme === 'light' ? '#f8fafc' : '#0a0e17')
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore write errors (private browsing, etc.)
  }
}

// Module-level singleton store — every component using useTheme() reads/writes
// the same shared theme, mirroring the Vue composable's module-scoped ref.
let theme: Theme = getInitialTheme()
const listeners = new Set<() => void>()

applyTheme(theme)

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function getSnapshot() {
  return theme
}

function setTheme(next: Theme) {
  theme = next
  applyTheme(theme)
  listeners.forEach((listener) => listener())
}

export function useTheme() {
  const currentTheme = useSyncExternalStore(subscribe, getSnapshot)

  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark')
  }

  return { theme: currentTheme, toggleTheme }
}
