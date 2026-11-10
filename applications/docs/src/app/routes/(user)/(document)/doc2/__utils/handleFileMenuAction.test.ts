import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'

import { type FileMenuHandlers, handleFileMenuAction } from './handleFileMenuAction'

describe('handleFileMenuAction', () => {
  const handlers = {
    openHelp: jest.fn(),
    toggleDebugMode: jest.fn(),
    newDocument: jest.fn(),
    newSpreadsheet: jest.fn(),
    moveToFolder: jest.fn(),
    moveToTrash: jest.fn(),
    openProtonDrive: jest.fn(),
  } satisfies FileMenuHandlers
  const logger = { debug: jest.fn() } as unknown as Parameters<typeof handleFileMenuAction>[2]

  afterEach(() => jest.clearAllMocks())

  test.each<[FileMenuAction, keyof FileMenuHandlers]>([
    [{ type: 'help' }, 'openHelp'],
    [{ type: 'toggle-debug-mode' }, 'toggleDebugMode'],
    [{ type: 'new-document' }, 'newDocument'],
    [{ type: 'new-spreadsheet' }, 'newSpreadsheet'],
    [{ type: 'move-to-folder' }, 'moveToFolder'],
    [{ type: 'move-to-trash' }, 'moveToTrash'],
    [{ type: 'open-proton-drive' }, 'openProtonDrive'],
  ])('$type runs %s alone', (action, handler) => {
    handleFileMenuAction(action, handlers, logger)

    expect(handlers[handler]).toHaveBeenCalledTimes(1)
    for (const [name, other] of Object.entries(handlers)) {
      if (name !== handler) {
        expect(other).not.toHaveBeenCalled()
      }
    }
  })

  test.each<FileMenuAction>([
    { type: 'make-a-copy' },
    { type: 'see-version-history' },
    { type: 'print' },
    { type: 'download', format: 'docx' },
    { type: 'import' },
    { type: 'view-recent-spreadsheets' },
  ])('$type, a stub or sheets only, does nothing', (action) => {
    handleFileMenuAction(action, handlers, logger)

    for (const handler of Object.values(handlers)) {
      expect(handler).not.toHaveBeenCalled()
    }
  })
})
