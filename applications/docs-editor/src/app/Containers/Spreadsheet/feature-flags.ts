import type { FeatureFlag } from '@proton/unleash/Flags'
import { useEffect, useState } from 'react'

import { useSheetsDependencies } from './SheetsDependenciesProvider'

export function useFeatureFlag(featureFlag: FeatureFlag) {
  const { isDevOrBlack, isFeatureFlagEnabled } = useSheetsDependencies()
  const [enabled, setEnabled] = useState(isDevOrBlack())

  useEffect(() => {
    let cancelled = false

    void isFeatureFlagEnabled(featureFlag)
      .then((isEnabled) => {
        if (!cancelled) {
          setEnabled(isEnabled || isDevOrBlack())
        }
      })
      .catch(console.error)

    return () => {
      cancelled = true
    }
  }, [featureFlag, isDevOrBlack, isFeatureFlagEnabled])

  return enabled
}
