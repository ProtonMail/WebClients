import type { EditorRequiresClientMethods } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import { useEffect, useState } from 'react'

import { reportErrorToSentry } from '../../../../Utils/errorMessage'
import { loadSheetsEditorPackage, type SheetsEditorSource } from '../sheets-editor-source'

/** The Sheets editor, loaded before a sheet mounts. A failed load is irrecoverable: nothing else can render the sheet. */
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

    loadSheetsEditorPackage()
      .then((source) => {
        if (!disposed) {
          setSheetsEditor(source)
        }
      })
      .catch((error) => {
        reportErrorToSentry(error)
        void clientInvoker.reportUserInterfaceError(error, { irrecoverable: true })
      })

    return () => {
      disposed = true
    }
  }, [clientInvoker, enabled])

  return sheetsEditor
}
