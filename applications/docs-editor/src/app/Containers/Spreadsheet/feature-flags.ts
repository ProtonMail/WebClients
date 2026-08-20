import { useEffect, useState } from 'react'
import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import type { FeatureFlag } from '@proton/unleash/Flags'
import { useSheetsDependencies } from './SheetsDependenciesProvider'

function useFeatureFlag(clientInvoker: EditorRequiresClientMethods, featureFlag: FeatureFlag) {
  const { isDevOrBlack } = useSheetsDependencies()
  const [enabled, setEnabled] = useState(isDevOrBlack())

  useEffect(() => {
    let cancelled = false

    void clientInvoker
      .checkIfFeatureFlagIsEnabled(featureFlag)
      .then((isEnabled) => {
        if (!cancelled) {
          setEnabled(isEnabled || isDevOrBlack())
        }
      })
      .catch(console.error)

    return () => {
      cancelled = true
    }
  }, [clientInvoker, featureFlag, isDevOrBlack])

  return enabled
}

export function useIsSheetsStatusBarEnabled(clientInvoker: EditorRequiresClientMethods) {
  return useFeatureFlag(clientInvoker, 'SheetsStatusBarEnabled')
}

export function useIsSheetsCustomNumberFormatEnabled(clientInvoker: EditorRequiresClientMethods) {
  return useFeatureFlag(clientInvoker, 'SheetsCustomNumberFormatEnabled')
}

export function useIsSheetsCustomDateTimeFormatEnabled(clientInvoker: EditorRequiresClientMethods) {
  return useFeatureFlag(clientInvoker, 'SheetsCustomDateTimeFormatEnabled')
}
