import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'

import { handleFileMenuAction } from './handleFileMenuAction'

describe('handleFileMenuAction', () => {
  const openHelp = jest.fn()
  const toggleDebugMode = jest.fn()
  const logger = { debug: jest.fn() } as unknown as Parameters<typeof handleFileMenuAction>[2]

  afterEach(() => jest.clearAllMocks())

  test('help opens the help', () => {
    handleFileMenuAction({ type: 'help' }, { openHelp, toggleDebugMode }, logger)

    expect(openHelp).toHaveBeenCalledTimes(1)
    expect(toggleDebugMode).not.toHaveBeenCalled()
  })

  test('toggle-debug-mode toggles debug mode', () => {
    handleFileMenuAction({ type: 'toggle-debug-mode' }, { openHelp, toggleDebugMode }, logger)

    expect(toggleDebugMode).toHaveBeenCalledTimes(1)
    expect(openHelp).not.toHaveBeenCalled()
  })

  test.each<FileMenuAction>([
    { type: 'new-document' },
    { type: 'new-spreadsheet' },
    { type: 'make-a-copy' },
    { type: 'move-to-folder' },
    { type: 'see-version-history' },
    { type: 'move-to-trash' },
    { type: 'print' },
    { type: 'download', format: 'docx' },
    { type: 'open-proton-drive' },
    { type: 'import' },
    { type: 'view-recent-spreadsheets' },
  ])('$type, a stub or sheets only, does nothing', (action) => {
    handleFileMenuAction(action, { openHelp, toggleDebugMode }, logger)

    expect(openHelp).not.toHaveBeenCalled()
    expect(toggleDebugMode).not.toHaveBeenCalled()
  })
})
