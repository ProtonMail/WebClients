// Copy of packages/hooks/useToggle.ts, without the forcedState parameter the homepage never passes

import { useCallback, useState } from 'react'

export function useToggle() {
  const [state, setState] = useState(false)

  const toggle = useCallback(() => {
    setState((prev) => !prev)
  }, [])

  return { state, toggle, set: setState }
}
