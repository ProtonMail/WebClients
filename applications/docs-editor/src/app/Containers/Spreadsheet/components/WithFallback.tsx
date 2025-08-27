import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

const LOCAL_STORAGE_KEY = 'new-ui-enabled'
const EVENT_NAME = 'konami-time'
function isEnabled() {
  return localStorage.getItem(LOCAL_STORAGE_KEY) === 'true'
}

export type NewUITogglerProps = {
  fallback: ReactNode
  children: ReactNode
}

export function WithFallback({ fallback, children }: NewUITogglerProps) {
  const [enabled, setEnabled] = useState(() => isEnabled())

  useEffect(() => {
    const handler = () => setEnabled(isEnabled())
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [])

  return enabled ? children : fallback
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

/**
 * Use the konami code to toggle between the new UI and a fallback. Stored in localStorage.
 */
export function useSetupWithFallback() {
  const inputRef = useRef<string[]>([])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      inputRef.current = [...inputRef.current, event.key].slice(-KONAMI_SEQUENCE.length)
      if (inputRef.current.join(',') === KONAMI_SEQUENCE_JOINED) {
        localStorage.setItem(LOCAL_STORAGE_KEY, String(!isEnabled()))
        window.dispatchEvent(new Event('konami-time'))
        inputRef.current = []
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])
}
