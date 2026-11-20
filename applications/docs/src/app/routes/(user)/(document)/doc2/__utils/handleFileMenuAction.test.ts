import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'

import { type FileMenuHandlers, handleFileMenuAction } from './handleFileMenuAction'

describe('handleFileMenuAction', () => {
  const handlers = {
    openHelp: vi.fn(),
    toggleDebugMode: vi.fn(),
    newDocument: vi.fn(),
    newSpreadsheet: vi.fn(),
    makeACopy: vi.fn(),
    moveToFolder: vi.fn(),
    moveToTrash: vi.fn(),
    openProtonDrive: vi.fn(),
    print: vi.fn(),
    download: vi.fn(),
    seeVersionHistory: vi.fn(),
  } satisfies FileMenuHandlers
  const logger = { debug: vi.fn() } as unknown as Parameters<typeof handleFileMenuAction>[2]

  afterEach(() => vi.clearAllMocks())

  test.each<[FileMenuAction, keyof FileMenuHandlers]>([
    [{ type: 'help' }, 'openHelp'],
    [{ type: 'toggle-debug-mode' }, 'toggleDebugMode'],
    [{ type: 'new-document' }, 'newDocument'],
    [{ type: 'new-spreadsheet' }, 'newSpreadsheet'],
    [{ type: 'make-a-copy' }, 'makeACopy'],
    [{ type: 'move-to-folder' }, 'moveToFolder'],
    [{ type: 'move-to-trash' }, 'moveToTrash'],
    [{ type: 'open-proton-drive' }, 'openProtonDrive'],
    [{ type: 'print' }, 'print'],
    [{ type: 'see-version-history' }, 'seeVersionHistory'],
  ])('$type runs %s alone', (action, handler) => {
    handleFileMenuAction(action, handlers, logger)

    expect(handlers[handler]).toHaveBeenCalledTimes(1)
    for (const [name, other] of Object.entries(handlers)) {
      if (name !== handler) {
        expect(other).not.toHaveBeenCalled()
      }
    }
  })

  test.each(['docx', 'md'] as const)('download in %s downloads that format alone', (format) => {
    handleFileMenuAction({ type: 'download', format }, handlers, logger)

    expect(handlers.download).toHaveBeenCalledWith(format)
    for (const [name, other] of Object.entries(handlers)) {
      if (name !== 'download') {
        expect(other).not.toHaveBeenCalled()
      }
    }
  })

  test.each<FileMenuAction>([{ type: 'import' }, { type: 'view-recent-spreadsheets' }])(
    '$type, sheets only, does nothing',
    (action) => {
      handleFileMenuAction(action, handlers, logger)

      for (const handler of Object.values(handlers)) {
        expect(handler).not.toHaveBeenCalled()
      }
    },
  )
})
