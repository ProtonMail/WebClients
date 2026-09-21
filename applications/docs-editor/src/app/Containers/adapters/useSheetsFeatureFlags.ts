import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { isDevOrBlack } from '@proton/shared/lib/env'
import { useEffect, useMemo, useState } from 'react'

import type { SheetsFeatureFlags } from '../Spreadsheet/public'

type FeatureFlagName = Parameters<EditorRequiresClientMethods['checkIfFeatureFlagIsEnabled']>[0]
const areFeatureFlagsEnabledByEnvironment = isDevOrBlack()

function useFeatureFlag(clientInvoker: EditorRequiresClientMethods, featureFlag: FeatureFlagName) {
  const [enabled, setEnabled] = useState(areFeatureFlagsEnabledByEnvironment)

  useEffect(() => {
    if (areFeatureFlagsEnabledByEnvironment) {
      return
    }

    let cancelled = false

    void clientInvoker
      .checkIfFeatureFlagIsEnabled(featureFlag)
      .then((isEnabled) => {
        if (!cancelled) {
          setEnabled(isEnabled)
        }
      })
      .catch(console.error)

    return () => {
      cancelled = true
    }
  }, [clientInvoker, featureFlag])

  return enabled
}

/** Resolves Proton rollout flags at the production shell boundary. */
export function useSheetsFeatureFlags(clientInvoker: EditorRequiresClientMethods): SheetsFeatureFlags {
  const SheetsActionsStorageEnabled = useFeatureFlag(clientInvoker, 'SheetsActionsStorageEnabled')
  const SheetsCustomDateTimeFormatEnabled = useFeatureFlag(clientInvoker, 'SheetsCustomDateTimeFormatEnabled')
  const SheetsCustomNumberFormatEnabled = useFeatureFlag(clientInvoker, 'SheetsCustomNumberFormatEnabled')
  const SheetsDriftDetectionEnabled = useFeatureFlag(clientInvoker, 'SheetsDriftDetectionEnabled')
  const SheetsODSExportEnabled = useFeatureFlag(clientInvoker, 'SheetsODSExportEnabled')
  const SheetsPatchesStorageEnabled = useFeatureFlag(clientInvoker, 'SheetsPatchesStorageEnabled')
  const SheetsStatusBarEnabled = useFeatureFlag(clientInvoker, 'SheetsStatusBarEnabled')
  const SheetsTablesEnabled = useFeatureFlag(clientInvoker, 'SheetsTablesEnabled')

  return useMemo(
    () => ({
      SheetsActionsStorageEnabled,
      SheetsCustomDateTimeFormatEnabled,
      SheetsCustomNumberFormatEnabled,
      SheetsDriftDetectionEnabled,
      SheetsODSExportEnabled,
      SheetsPatchesStorageEnabled,
      SheetsStatusBarEnabled,
      SheetsTablesEnabled,
    }),
    [
      SheetsActionsStorageEnabled,
      SheetsCustomDateTimeFormatEnabled,
      SheetsCustomNumberFormatEnabled,
      SheetsDriftDetectionEnabled,
      SheetsODSExportEnabled,
      SheetsPatchesStorageEnabled,
      SheetsStatusBarEnabled,
      SheetsTablesEnabled,
    ],
  )
}
