import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared/ExportableDataType'
import { getStaticURL } from '@proton/shared/lib/helpers/url'
import type { LoggerInterface } from '@proton/shared/lib/logs'

import type { DocumentFileActions } from './useDocumentFileActions'

export type FileMenuHandlers = Pick<
  DocumentFileActions,
  'newDocument' | 'newSpreadsheet' | 'makeACopy' | 'moveToFolder' | 'moveToTrash' | 'openProtonDrive'
> & {
  openHelp: () => void
  toggleDebugMode: () => void
  print: () => void
  download: (format: DataTypesThatDocumentCanBeExportedAs) => void
}

export function openHelp() {
  window.open(getStaticURL('/support/drive'), '_blank')
}

/**
 * Runs a docs file menu action, from the title menu or from the editor, as /doc's `DocumentTitleDropdown.tsx` does.
 * Version history, a stub, does nothing, like its disabled menu item, and the sheets-only actions never come from a text
 * document. The handlers check the role and flags themselves.
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
    case 'make-a-copy':
      return handlers.makeACopy()
    case 'move-to-folder':
      return handlers.moveToFolder()
    case 'move-to-trash':
      return handlers.moveToTrash()
    case 'open-proton-drive':
      return handlers.openProtonDrive()
    case 'print':
      return handlers.print()
    case 'download':
      return handlers.download(action.format)
    // A stub with no ticket: version history is kept for later
    case 'see-version-history':
      logger.debug('File menu action not available in doc2 yet', { type: action.type })
      return
    case 'import':
    case 'view-recent-spreadsheets':
      logger.debug('Sheets file menu action ignored', { type: action.type })
      return
  }
}
