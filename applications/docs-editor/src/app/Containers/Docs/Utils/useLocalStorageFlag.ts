import { useCallback, useState } from 'react'

function readFlag(key: string) {
  try {
    return localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

/** A flag that, once set, stays set across sessions. It stores JSON `true`, as Proton's `useLocalState` does. */
export function useLocalStorageFlag(key: string) {
  const [isSet, setIsSet] = useState(() => readFlag(key))

  const set = useCallback(() => {
    setIsSet(true)
    try {
      localStorage.setItem(key, 'true')
    } catch {
      // Browser storage can be unavailable in private browsing or when full.
    }
  }, [key])

  return [isSet, set] as const
}
