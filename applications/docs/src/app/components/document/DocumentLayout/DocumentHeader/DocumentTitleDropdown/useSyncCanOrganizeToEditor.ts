import { useEffect } from 'react'

import type { DocumentState, PublicDocumentState } from '@proton/docs-core/State/DocumentState'
import type { SyncedEditorState } from '@proton/docs-shared/State/SyncedEditorState'

/**
 * Tells the editor `canOrganize`, for a spreadsheet's own file menu to offer Move to trash by it. It is sent again
 * whenever the editor becomes ready, since the editor misses what is sent before it listens.
 */
export function useSyncCanOrganizeToEditor(
  documentState: DocumentState | PublicDocumentState,
  syncedEditorState: SyncedEditorState,
  canOrganize: boolean,
) {
  // `subscribeToProperty` also calls back at once, with the current value
  useEffect(
    () =>
      documentState.subscribeToProperty('editorReady', (ready) => {
        if (ready) {
          syncedEditorState.setProperty('canOrganize', canOrganize)
        }
      }),
    [documentState, syncedEditorState, canOrganize],
  )
}
