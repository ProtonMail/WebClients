import { useState, useEffect, useRef, useCallback } from 'react'
import { useIsAlpha } from '../../Hooks/useIsAlpha'

const LOCAL_STORAGE_KEY = 'new-ui-enabled-new-key'
const EVENT_NAME = 'konami-time'
function isEnabled() {
  const value = localStorage.getItem(LOCAL_STORAGE_KEY) ?? 'true'
  return value === 'true'
}
const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
  'Enter',
]
const KONAMI_SEQUENCE_JOINED = KONAMI_SEQUENCE.join(',')

export function useNewUIEnabled() {
  const isAlpha = useIsAlpha()
  const [enabled, setEnabled] = useState(() => isEnabled())

  useEffect(() => {
    const handler = () => setEnabled(isEnabled())
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [])

  const inputRef = useRef<string[]>([])

  const updateLocalStorage = useCallback((enabled: boolean) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, String(enabled))
    window.dispatchEvent(new Event('konami-time'))
  }, [])

  useEffect(() => {
    if (!isAlpha) {
      if (!isEnabled()) {
        updateLocalStorage(true) // Force enable the new UI if not in dev or alpha
      }
      return
    }

    const handleKeydown = (event: KeyboardEvent) => {
      inputRef.current = [...inputRef.current, event.key].slice(-KONAMI_SEQUENCE.length)
      if (inputRef.current.join(',') === KONAMI_SEQUENCE_JOINED) {
        updateLocalStorage(!isEnabled())
        inputRef.current = []
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [isAlpha, updateLocalStorage])

  return enabled
}
