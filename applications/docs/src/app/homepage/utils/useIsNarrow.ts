import { useSyncExternalStore } from 'react'

// Proton's `small` breakpoint, 680px, in em as Proton's media queries use it (packages/styles/scss/lib/_config.scss).
const NARROW_QUERY = '(max-width: 42.5em)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(NARROW_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** As `useActiveBreakpoint().viewportWidth['<=small']` of `@proton/components`. */
export function useIsNarrow() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(NARROW_QUERY).matches)
}
