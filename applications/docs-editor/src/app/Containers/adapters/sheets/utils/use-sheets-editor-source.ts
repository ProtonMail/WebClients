import type { EditorRequiresClientMethods } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import { useEffect, useState } from 'react'

import { reportErrorToSentry } from '../../../../Utils/errorMessage'
import { loadSheetsEditorPackage, sheetsContainerSource, type SheetsEditorSource } from '../sheets-editor-source'

/** The editor `SheetsEditorPackageEnabled` picks, resolved before a sheet mounts. */
export function useSheetsEditorSource(
  clientInvoker: EditorRequiresClientMethods,
  enabled: boolean,
): SheetsEditorSource | undefined {
  const [sheetsEditor, setSheetsEditor] = useState<SheetsEditorSource>()

  useEffect(() => {
    if (!enabled) {
      return
    }

    let disposed = false

    void clientInvoker
      .checkIfFeatureFlagIsEnabled('SheetsEditorPackageEnabled')
      .then((isEnabled) => (isEnabled ? loadSheetsEditorPackage() : sheetsContainerSource))
      .catch((error) => {
        reportErrorToSentry(error)
        return sheetsContainerSource
      })
      .then((source) => {
        if (!disposed) {
          setSheetsEditor(source)
        }
      })

    return () => {
      disposed = true
    }
  }, [clientInvoker, enabled])

  return sheetsEditor
}
