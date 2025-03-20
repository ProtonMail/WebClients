import { useEffect, useRef } from 'react'

export function useStateRef<T>(value: T) {
  const ref = useRef<T>(value)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref
}
