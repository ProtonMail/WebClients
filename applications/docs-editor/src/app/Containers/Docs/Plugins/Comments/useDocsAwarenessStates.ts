import { useEffect, useState } from 'react'
import type { SafeDocsUserState } from '../../contract/Awareness'
import { useDocsDependencies } from '../../DocsDependenciesProvider'

export function useDocsAwarenessStates() {
  const { subscribeToAwarenessStates } = useDocsDependencies().comments
  const [states, setStates] = useState<SafeDocsUserState[]>([])
  useEffect(() => subscribeToAwarenessStates(setStates), [subscribeToAwarenessStates])
  return states
}
