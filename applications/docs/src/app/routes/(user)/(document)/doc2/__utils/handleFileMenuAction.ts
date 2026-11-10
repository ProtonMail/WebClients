import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import { getStaticURL } from '@proton/shared/lib/helpers/url'
import type { LoggerInterface } from '@proton/shared/lib/logs'

import type { DocumentFileActions } from './useDocumentFileActions'

export type FileMenuHandlers = Pick<
  DocumentFileActions,
  'newDocument' | 'newSpreadsheet' | 'moveToFolder' | 'moveToTrash' | 'openProtonDrive'
> & { openHelp: () => void; toggleDebugMode: () => void }

export function openHelp() {
  window.open(getStaticURL('/support/drive'), '_blank')
}

/**
 * Runs a docs file menu action, from the title menu or from the editor, as /doc's `DocumentTitleDropdown.tsx` does.
 * The actions still waiting for their doc2 ticket do nothing, like their disabled menu items, and the sheets-only ones
 * never come from a text document. The handlers check the role and flags themselves.
 */
export function handleFileMenuAction(action: FileMenuAction, handlers: FileMenuHandlers, logger: LoggerInterface) {
  switch (action.type) {
    case 'help':
      return handlers.openHelp()
    case 'toggle-debug-mode':
      return handlers.toggleDebugMode()
    case 'new-document':
      return handlers.newDocument()
    case 'new-spreadsheet':
      return handlers.newSpreadsheet()
    case 'move-to-folder':
      return handlers.moveToFolder()
    case 'move-to-trash':
      return handlers.moveToTrash()
    case 'open-proton-drive':
      return handlers.openProtonDrive()
    // Stubs until their doc2 tickets: T7 download, print and export, T13 make a copy.
    // Version history has no ticket: it is kept for later.
    case 'print':
    case 'download':
    case 'make-a-copy':
    case 'see-version-history':
      logger.debug('File menu action not available in doc2 yet', { type: action.type })
      return
    case 'import':
    case 'view-recent-spreadsheets':
      logger.debug('Sheets file menu action ignored', { type: action.type })
      return
  }
}
