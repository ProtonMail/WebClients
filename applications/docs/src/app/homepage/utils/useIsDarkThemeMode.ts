import { useSyncExternalStore } from 'react'

// Proton's ThemeProvider sets the theme's mode on <html>; the homepage's dark styles select it too.
const THEME_MODE_ATTRIBUTE = 'data-theme-mode'

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [THEME_MODE_ATTRIBUTE] })
  return () => observer.disconnect()
}

function getSnapshot() {
  return document.documentElement.getAttribute(THEME_MODE_ATTRIBUTE) === 'dark'
}

/** Whether the page shows a dark theme, for what CSS can't switch, such as an image's source. */
export function useIsDarkThemeMode() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
