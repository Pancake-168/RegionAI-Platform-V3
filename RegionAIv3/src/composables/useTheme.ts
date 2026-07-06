import { ref, watch } from 'vue'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'pancake-theme'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

let initialized = false

export function useTheme() {
  const theme = ref<Theme>(getInitialTheme())

  if (!initialized) {
    initialized = true
    applyTheme(theme.value)
  }

  watch(theme, (val) => {
    localStorage.setItem(STORAGE_KEY, val)
    applyTheme(val)
  })

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggleTheme }
}
