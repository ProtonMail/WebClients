import type { EditorRequiresClientMethods } from '@proton/docs-shared'

import type { SheetsFileMenuActions } from '../Spreadsheet/public'

type FileMenuClient = Pick<EditorRequiresClientMethods, 'handleFileMenuAction'>

/** Translates the editor-owned capability contract to the existing Docs bridge protocol. */
export function createSheetsFileMenuActions(client: FileMenuClient): SheetsFileMenuActions {
  return {
    createSpreadsheet: () => client.handleFileMenuAction({ type: 'new-spreadsheet' }),
    createDocument: () => client.handleFileMenuAction({ type: 'new-document' }),
    import: () => client.handleFileMenuAction({ type: 'import' }),
    makeCopy: () => client.handleFileMenuAction({ type: 'make-a-copy' }),
    moveToFolder: () => client.handleFileMenuAction({ type: 'move-to-folder' }),
    viewVersionHistory: () => client.handleFileMenuAction({ type: 'see-version-history' }),
    moveToTrash: () => client.handleFileMenuAction({ type: 'move-to-trash' }),
    print: () => client.handleFileMenuAction({ type: 'print' }),
    download: (format) => client.handleFileMenuAction({ type: 'download', format }),
    openHelp: () => client.handleFileMenuAction({ type: 'help' }),
    viewRecentSpreadsheets: () => client.handleFileMenuAction({ type: 'view-recent-spreadsheets' }),
    openProtonDrive: () => client.handleFileMenuAction({ type: 'open-proton-drive' }),
    toggleDebugMode: () => client.handleFileMenuAction({ type: 'toggle-debug-mode' }),
  }
}
