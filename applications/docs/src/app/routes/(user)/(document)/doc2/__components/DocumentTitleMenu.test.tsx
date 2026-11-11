import { act, createEvent, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConfigContext } from '@proton/app-context/configContext'
import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import { NodeType, getDrive } from '@proton/drive/sdk'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import type { DocumentRole } from '../__utils/getDocumentRole'
import { DocumentTitleMenu } from './DocumentTitleMenu'
import { useWordCountState } from './WordCount'

let mockIsSheetsEnabled = true
let mockIsDownloadLogsAllowed = true
let mockIsODTEnabled = true
jest.mock('~/utils/flags', () => ({
  useIsSheetsEnabled: () => mockIsSheetsEnabled,
  useIsDownloadLogsAllowed: () => mockIsDownloadLogsAllowed,
  useIsODTEnabled: () => mockIsODTEnabled,
}))
const mockTextToClipboard = jest.fn()
jest.mock('@proton/shared/lib/helpers/browser', () => ({
  ...jest.requireActual('@proton/shared/lib/helpers/browser'),
  textToClipboard: (text: string) => mockTextToClipboard(text),
}))
let mockIsWordCountSupported = true
jest.mock('@proton/docs-shared/WordCount/isWordCountSupported', () => ({
  get isWordCountSupported() {
    return mockIsWordCountSupported
  },
}))
const mockCreateNotification = jest.fn()
jest.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: mockCreateNotification }),
}))
const mockDownloadFile = jest.fn()
jest.mock('@proton/shared/lib/helpers/downloadFile', () => ({
  __esModule: true,
  default: (blob: Blob, filename: string) => mockDownloadFile(blob, filename),
}))
jest.mock('@proton/drive/sdk', () => ({ ...jest.requireActual('@proton/drive/sdk'), getDrive: jest.fn() }))

const getAvailableName = jest.fn()
const renameNode = jest.fn()
const NODE = { uid: 'VOLUME~LINK', parentUid: 'VOLUME~PARENT', name: { ok: true, value: 'Plans' } } as const

// The atoms Tooltip's default open delay
const TOOLTIP_OPEN_DELAY_MS = 1000

const STUB_ITEMS: [string, string][] = [
  ['Make a copy', 'T13'],
  ['See version history', 'version history'],
]

const FILE_ACTION_ITEMS: [string, FileMenuAction][] = [
  ['New document', { type: 'new-document' }],
  ['New spreadsheet', { type: 'new-spreadsheet' }],
  ['Move to folder', { type: 'move-to-folder' }],
  ['Move to trash', { type: 'move-to-trash' }],
  ['Open Proton Drive', { type: 'open-proton-drive' }],
]

describe('DocumentTitleMenu', () => {
  beforeEach(() => {
    mockIsSheetsEnabled = true
    mockIsDownloadLogsAllowed = true
    mockIsODTEnabled = true
    mockIsWordCountSupported = true
    jest.mocked(getDrive).mockReturnValue({ getAvailableName, renameNode } as unknown as ReturnType<typeof getDrive>)
    getAvailableName.mockImplementation(async (_parentUid: string, name: string) => name)
    renameNode.mockResolvedValue({})
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  test('shows the document name, also as the tab title', () => {
    renderMenu('Viewer')

    expect(screen.getByTestId('document-name-dropdown')).toHaveTextContent('Plans')
    expect(document.title).toBe('Plans - Proton Docs')
  })

  test("an Admin gets every docs item, in /doc's order", async () => {
    await openMenu('Admin')

    expect(menuItemNames()).toEqual([
      'Rename document',
      'New document',
      'New spreadsheet',
      'Make a copy',
      'Move to folder',
      'See version history',
      'Word count',
      'Hide table of contents',
      'Move to trash',
      'Print',
      'Download',
      'Copy as markdown',
      'Help',
      'Open Proton Drive',
      'Download logs',
    ])
    expect(screen.getByTestId('e2e-info')).toHaveTextContent('End-to-end encrypted. Learn more')
  })

  test.each<[DocumentRole, boolean, boolean]>([
    ['Viewer', false, false],
    ['Editor', true, false],
    ['Admin', true, true],
  ])('a %s gets Rename %s and Move to trash %s', async (role, canRename, canTrash) => {
    await openMenu(role)

    expect(menuItemNames().includes('Rename document')).toBe(canRename)
    expect(menuItemNames().includes('Move to trash')).toBe(canTrash)
  })

  test('New spreadsheet needs sheets enabled', async () => {
    mockIsSheetsEnabled = false

    await openMenu('Admin')

    expect(menuItemNames()).not.toContain('New spreadsheet')
  })

  test('Download logs needs the DownloadLogs flag', async () => {
    mockIsDownloadLogsAllowed = false

    await openMenu('Admin')

    expect(menuItemNames()).not.toContain('Download logs')
  })

  test("Download logs downloads the editor's Y.Doc and editor state, once the editor is there", async () => {
    const editorInvoker = {
      setTableOfContentsVisible: jest.fn(async () => {}),
      getYDocAsJSON: jest.fn(async () => ({ root: [] })),
      getCurrentEditorState: jest.fn(async () => undefined),
    }
    const { rerender } = await openMenu('Viewer', { editorInvoker: undefined })
    expect(menuItem('Download logs')).toBeDisabled()

    rerender(menuElement('Viewer', { editorInvoker }))
    await userEvent.click(menuItem('Download logs'))

    await waitFor(() =>
      expect(mockDownloadFile).toHaveBeenCalledWith(expect.any(Blob), expect.stringMatching(/^document-logs-.*\.zip$/)),
    )
    expect(editorInvoker.getYDocAsJSON).toHaveBeenCalled()
    expect(editorInvoker.getCurrentEditorState).toHaveBeenCalled()
  })

  test('Word count needs Intl.Segmenter', async () => {
    mockIsWordCountSupported = false

    await openMenu('Admin')

    expect(menuItemNames()).not.toContain('Word count')
  })

  test.each(STUB_ITEMS)(
    '%s is a stub waiting for %s: disabled, with a tooltip, and does nothing',
    async (name, ticket) => {
      const { onFileMenuAction } = await openMenu('Admin')
      const item = menuItem(name)

      expect(item).toHaveAttribute('aria-disabled', 'true')
      expect(item).toHaveAttribute('data-stub', ticket)
      jest.useFakeTimers()
      await userEvent.setup({ advanceTimers: jest.advanceTimersByTime }).hover(item)
      act(() => jest.advanceTimersByTime(TOOLTIP_OPEN_DELAY_MS))
      expect(screen.getByRole('tooltip')).toHaveTextContent('Not available yet')
      jest.useRealTimers()

      await userEvent.click(item)
      expect(onFileMenuAction).not.toHaveBeenCalled()
      expect(menuItem(name)).toBeInTheDocument()
    },
  )

  test.each(FILE_ACTION_ITEMS)('%s runs its file menu action', async (name, action) => {
    const { onFileMenuAction } = await openMenu('Admin')

    await userEvent.click(menuItem(name))

    expect(onFileMenuAction).toHaveBeenCalledWith(action)
    expect(onFileMenuAction).toHaveBeenCalledTimes(1)
  })

  test.each(['New document', 'Move to folder', 'Open Proton Drive'])('a Viewer gets %s too', async (name) => {
    const { onFileMenuAction } = await openMenu('Viewer')

    await userEvent.click(menuItem(name))

    expect(onFileMenuAction).toHaveBeenCalledTimes(1)
  })

  test.each(['trashing', 'trashed', 'restoring'] as const)('Move to trash is disabled while %s', async (trashState) => {
    const { onFileMenuAction } = await openMenu('Admin', { trashState })

    // By test ID: the name also holds the loader's while trashing
    expect(screen.getByTestId('dropdown-trash')).toBeDisabled()
    await userEvent.click(screen.getByTestId('dropdown-trash'))
    expect(onFileMenuAction).not.toHaveBeenCalled()
  })

  test('New spreadsheet is disabled while one is being created', async () => {
    const { onFileMenuAction } = await openMenu('Admin', { isCreatingSpreadsheet: true })

    expect(screen.getByTestId('dropdown-new-spreadsheet')).toBeDisabled()
    await userEvent.click(screen.getByTestId('dropdown-new-spreadsheet'))
    expect(onFileMenuAction).not.toHaveBeenCalled()
  })

  test('Help runs the help action', async () => {
    const { onFileMenuAction } = await openMenu('Viewer')

    await userEvent.click(menuItem('Help'))

    expect(onFileMenuAction).toHaveBeenCalledWith({ type: 'help' })
  })

  test('holding Shift shows the app version in Help', async () => {
    await openMenu('Viewer')

    fireEvent.keyDown(window, { key: 'Shift', shiftKey: true })
    expect(screen.getByTestId('dropdown-help')).toHaveTextContent(/^Help.*1\.2\.3/)

    fireEvent.keyUp(window, { key: 'Shift', shiftKey: false })
    expect(screen.getByTestId('dropdown-help')).toHaveTextContent(/^Help$/)
  })

  test('Ctrl+Shift shows the hidden Toggle debug mode, which runs the debug mode action', async () => {
    const { onFileMenuAction } = await openMenu('Viewer')
    expect(menuItemNames()).not.toContain('Toggle debug mode')

    await userEvent.keyboard('{Control>}{Shift}{/Control}')
    await userEvent.click(menuItem('Toggle debug mode'))

    expect(onFileMenuAction).toHaveBeenCalledWith({ type: 'toggle-debug-mode' })
  })

  describe('print, download and copy as markdown', () => {
    const exportInvoker = { getCurrentSelection: jest.fn(async (): Promise<string | null> => '# Plans') }

    test('are disabled until the editor shows the document', async () => {
      const { onFileMenuAction } = await openMenu('Viewer', { exportInvoker: undefined })

      for (const testId of ['dropdown-print', 'dropdown-download', 'dropdown-copy-as-md']) {
        expect(screen.getByTestId(testId)).toBeDisabled()
        await userEvent.click(screen.getByTestId(testId))
      }
      expect(onFileMenuAction).not.toHaveBeenCalled()
      expect(exportInvoker.getCurrentSelection).not.toHaveBeenCalled()
    })

    test('Print runs the print action, for a Viewer too', async () => {
      const { onFileMenuAction } = await openMenu('Viewer', { exportInvoker })

      await userEvent.click(menuItem('Print'))

      expect(onFileMenuAction).toHaveBeenCalledWith({ type: 'print' })
    })

    test("Download offers /doc's docs formats, each running the download action", async () => {
      const { onFileMenuAction } = await openMenu('Viewer', { exportInvoker })

      await userEvent.click(menuItem('Download'))

      expect(downloadFormats()).toEqual([
        'Microsoft Word (.docx)',
        'OpenDocument Text (.odt) (Beta)',
        'Web page (.html)',
        'Plain Text (.txt)',
        'Markdown (.md)',
        'PDF (.pdf)',
      ])
      for (const format of ['docx', 'odt', 'html', 'txt', 'md'] as const) {
        await userEvent.click(screen.getByTestId(`download-${format}`))
        expect(onFileMenuAction).toHaveBeenLastCalledWith({ type: 'download', format })
        await userEvent.click(screen.getByTestId('document-name-dropdown'))
        await userEvent.click(menuItem('Download'))
      }
      expect(onFileMenuAction).toHaveBeenCalledTimes(5)
    })

    test('Download as odt needs the DocsODTEnabled flag', async () => {
      mockIsODTEnabled = false
      await openMenu('Viewer', { exportInvoker })

      await userEvent.click(menuItem('Download'))

      expect(downloadFormats()).not.toContain('OpenDocument Text (.odt) (Beta)')
    })

    test('Download as PDF explains the print dialog, and prints once that is closed', async () => {
      const { onFileMenuAction } = await openMenu('Viewer', { exportInvoker })
      await userEvent.click(menuItem('Download'))

      await userEvent.click(screen.getByTestId('download-pdf'))
      const modal = await screen.findByTestId('print-pdf-modal')
      expect(modal).toHaveTextContent('Save Document as PDF')
      expect(onFileMenuAction).not.toHaveBeenCalled()

      await userEvent.click(within(modal).getByRole('button', { name: 'Got it', hidden: true }))
      // jsdom plays no animation and its events carry no animationName: end the modal's exit by hand
      const modalRoot = document.querySelector('.modal-two--out')!
      const exitAnimationEnd = createEvent.animationEnd(modalRoot)
      Object.defineProperty(exitAnimationEnd, 'animationName', { value: 'anime-modal-two-out' })
      fireEvent(modalRoot, exitAnimationEnd)

      await waitFor(() => expect(onFileMenuAction).toHaveBeenCalledWith({ type: 'print' }))
      expect(onFileMenuAction).toHaveBeenCalledTimes(1)
    })

    test('Copy as markdown copies what the editor gives for the selection, or the document, and says so', async () => {
      await openMenu('Viewer', { exportInvoker })

      await userEvent.click(menuItem('Copy as markdown'))

      expect(exportInvoker.getCurrentSelection).toHaveBeenCalledWith('md')
      await waitFor(() => expect(mockTextToClipboard).toHaveBeenCalledWith('# Plans'))
      expect(mockCreateNotification).toHaveBeenCalledWith({ type: 'success', text: 'Copied to clipboard' })
    })

    test('Copy as markdown copies nothing when the editor gives nothing', async () => {
      exportInvoker.getCurrentSelection.mockResolvedValueOnce(null)
      await openMenu('Viewer', { exportInvoker })

      await userEvent.click(menuItem('Copy as markdown'))

      await waitFor(() => expect(exportInvoker.getCurrentSelection).toHaveBeenCalled())
      expect(mockTextToClipboard).not.toHaveBeenCalled()
      expect(mockCreateNotification).not.toHaveBeenCalled()
    })

    test('Copy as markdown that fails copies nothing, and logs why', async () => {
      const error = new Error('Editor did not answer getCurrentSelection')
      exportInvoker.getCurrentSelection.mockRejectedValueOnce(error)
      await openMenu('Viewer', { exportInvoker })

      await userEvent.click(menuItem('Copy as markdown'))

      await waitFor(() =>
        expect(application.logger.error).toHaveBeenCalledWith('Failed to copy the document as Markdown', error),
      )
      expect(mockTextToClipboard).not.toHaveBeenCalled()
    })

    function downloadFormats() {
      return screen.getAllByTestId(/^download-/).map((item) => item.textContent?.trim())
    }
  })

  test('shows the table of contents once the editor is there, and the menu hides and shows it', async () => {
    const editorInvoker = {
      setTableOfContentsVisible: jest.fn(async () => {}),
      getYDocAsJSON: jest.fn(),
      getCurrentEditorState: jest.fn(),
    }
    const { rerender } = renderMenu('Viewer', { editorInvoker: undefined })
    rerender(menuElement('Viewer', { editorInvoker }))
    expect(editorInvoker.setTableOfContentsVisible).toHaveBeenLastCalledWith(true)

    await userEvent.click(screen.getByTestId('document-name-dropdown'))
    await userEvent.click(menuItem('Hide table of contents'))
    expect(editorInvoker.setTableOfContentsVisible).toHaveBeenLastCalledWith(false)

    await userEvent.click(screen.getByTestId('document-name-dropdown'))
    expect(menuItem('Show table of contents')).toBeInTheDocument()
  })

  test('the word count menu shows the counts the editor reported, and shows the floating count', async () => {
    const { result } = renderHook(() => useWordCountState())
    act(() => result.current[1]({ document: { wordCount: 2, characterCount: 9, nonWhitespaceCharacterCount: 8 } }))
    await openMenu('Viewer', { wordCount: result.current[0] })

    expect(screen.getByTestId('dropdown-word-count')).toHaveTextContent('Word count2')
    await userEvent.click(screen.getByTestId('dropdown-word-count'))
    expect(screen.getByTestId('word-count-label')).toHaveTextContent('2 words')
    expect(screen.getByTestId('character-count-label')).toHaveTextContent('9 characters')
    expect(screen.getByTestId('non-whitespace-character-count-label')).toHaveTextContent('8characters without spaces')

    await userEvent.click(screen.getByTestId('display-word-count'))
    expect(result.current[0].isShown).toBe(true)
  })

  test('follows the node Drive reports: a rename elsewhere shows, and a move changes where the next rename checks names', async () => {
    const { rerender } = renderMenu('Editor')
    const movedNode = {
      uid: 'VOLUME~LINK',
      parentUid: 'VOLUME~MOVED',
      name: { ok: true, value: 'Plans 2027' },
    } as const

    rerender(menuElement('Editor', { node: movedNode }))

    expect(screen.getByTestId('document-name-dropdown')).toHaveTextContent('Plans 2027')
    expect(document.title).toBe('Plans 2027 - Proton Docs')
    await userEvent.click(screen.getByTestId('document-name-dropdown'))
    await userEvent.click(menuItem('Rename document'))
    expect(screen.getByTestId('rename-input')).toHaveValue('Plans 2027')
    await userEvent.clear(screen.getByTestId('rename-input'))
    await userEvent.type(screen.getByTestId('rename-input'), 'Roadmap{Enter}')
    expect(getAvailableName).toHaveBeenCalledWith('VOLUME~MOVED', 'Roadmap', NodeType.File)
  })

  describe('rename', () => {
    test('Rename is disabled while a rename is pending, so renames never overlap', async () => {
      let finishRename: () => void = () => {}
      renameNode.mockReturnValue(new Promise<void>((resolve) => (finishRename = resolve)))
      await openMenu('Editor')
      await userEvent.click(menuItem('Rename document'))
      await userEvent.clear(screen.getByTestId('rename-input'))
      await userEvent.type(screen.getByTestId('rename-input'), 'Roadmap{Enter}')

      await userEvent.click(screen.getByTestId('document-name-dropdown'))
      expect(screen.getByTestId('document-name-dropdown')).toHaveTextContent('Roadmap')
      expect(menuItem('Rename document')).toBeDisabled()

      await act(async () => finishRename())
      expect(menuItem('Rename document')).toBeEnabled()
      expect(renameNode).toHaveBeenCalledTimes(1)
    })

    test('a Drive rename while Rename is open and untouched updates the input, and leaving it renames nothing', async () => {
      await openMenu('Editor')
      await userEvent.click(menuItem('Rename document'))

      rerenderMenu('Editor', { node: { ...NODE, name: { ok: true, value: 'Roadmap' } } })

      expect(screen.getByTestId('rename-input')).toHaveValue('Roadmap')
      fireEvent.blur(screen.getByTestId('rename-input'))
      expect(screen.getByTestId('document-name-dropdown')).toHaveTextContent('Roadmap')
      expect(getAvailableName).not.toHaveBeenCalled()
      expect(renameNode).not.toHaveBeenCalled()
    })

    test('a Drive rename while the user is typing a name keeps what they typed, and submits it', async () => {
      await openMenu('Editor')
      await userEvent.click(menuItem('Rename document'))
      await userEvent.clear(screen.getByTestId('rename-input'))
      await userEvent.type(screen.getByTestId('rename-input'), 'Mine')

      rerenderMenu('Editor', { node: { ...NODE, name: { ok: true, value: 'Roadmap' } } })

      expect(screen.getByTestId('rename-input')).toHaveValue('Mine')
      fireEvent.keyDown(screen.getByTestId('rename-input'), { key: 'Enter' })
      await waitFor(() => expect(renameNode).toHaveBeenCalledWith('VOLUME~LINK', 'Mine'))
    })

    test('a failed rename rolls back to the latest name from Drive, not the one before the rename', async () => {
      let failRename: () => void = () => {}
      renameNode.mockReturnValue(new Promise<void>((_resolve, reject) => (failRename = () => reject(new Error('No')))))
      await openMenu('Editor')
      await userEvent.click(menuItem('Rename document'))
      await userEvent.clear(screen.getByTestId('rename-input'))
      await userEvent.type(screen.getByTestId('rename-input'), 'Mine{Enter}')

      rerenderMenu('Editor', { node: { ...NODE, name: { ok: true, value: 'Roadmap' } } })
      await act(async () => failRename())

      expect(screen.getByTestId('document-name-dropdown')).toHaveTextContent('Roadmap')
      expect(document.title).toBe('Roadmap - Proton Docs')
    })

    test('a failed rename after a successful one rolls back to the successful name', async () => {
      await openMenu('Editor')
      await userEvent.click(menuItem('Rename document'))
      await userEvent.clear(screen.getByTestId('rename-input'))
      await userEvent.type(screen.getByTestId('rename-input'), 'Roadmap{Enter}')
      await waitFor(() => expect(mockCreateNotification).toHaveBeenCalledTimes(1))
      renameNode.mockRejectedValueOnce(new Error('No'))

      await userEvent.click(screen.getByTestId('document-name-dropdown'))
      await userEvent.click(menuItem('Rename document'))
      await userEvent.clear(screen.getByTestId('rename-input'))
      await userEvent.type(screen.getByTestId('rename-input'), 'Roadmap 2{Enter}')

      await waitFor(() => expect(renameNode).toHaveBeenCalledTimes(2))
      await waitFor(() => expect(screen.getByTestId('document-name-dropdown')).toHaveTextContent(/^Roadmap$/))
      expect(document.title).toBe('Roadmap - Proton Docs')
    })

    test('a failed rename re-enables Rename', async () => {
      let failRename: () => void = () => {}
      renameNode.mockReturnValue(new Promise<void>((_resolve, reject) => (failRename = () => reject(new Error('No')))))
      await openMenu('Editor')
      await userEvent.click(menuItem('Rename document'))
      await userEvent.clear(screen.getByTestId('rename-input'))
      await userEvent.type(screen.getByTestId('rename-input'), 'Roadmap{Enter}')
      await userEvent.click(screen.getByTestId('document-name-dropdown'))
      expect(menuItem('Rename document')).toBeDisabled()

      await act(async () => failRename())

      expect(menuItem('Rename document')).toBeEnabled()
      expect(screen.getByTestId('document-name-dropdown')).toHaveTextContent('Plans')
    })

    test('an Editor renames the document to the name Drive has free, and gets a toast', async () => {
      getAvailableName.mockResolvedValue('Roadmap (1)')
      await openMenu('Editor')

      await userEvent.click(menuItem('Rename document'))
      await userEvent.clear(screen.getByTestId('rename-input'))
      await userEvent.type(screen.getByTestId('rename-input'), ' Roadmap {Enter}')

      await waitFor(() => expect(screen.getByTestId('document-name-dropdown')).toHaveTextContent('Roadmap (1)'))
      expect(getAvailableName).toHaveBeenCalledWith('VOLUME~PARENT', 'Roadmap', NodeType.File)
      expect(renameNode).toHaveBeenCalledWith('VOLUME~LINK', 'Roadmap (1)')
      expect(document.title).toBe('Roadmap (1) - Proton Docs')
      expect(mockCreateNotification).toHaveBeenCalledTimes(1)
      render(<>{mockCreateNotification.mock.lastCall[0].text}</>)
      expect(screen.getByText('"Roadmap (1)" renamed successfully')).toBeInTheDocument()
    })

    test('a failed rename puts the old name back, and says so', async () => {
      renameNode.mockRejectedValue(new Error('Rename failed'))
      await openMenu('Admin')

      await userEvent.click(menuItem('Rename document'))
      await userEvent.clear(screen.getByTestId('rename-input'))
      await userEvent.type(screen.getByTestId('rename-input'), 'Roadmap{Enter}')

      await waitFor(() =>
        expect(mockCreateNotification).toHaveBeenCalledWith({
          type: 'error',
          text: 'Failed to rename document. Please try again later.',
        }),
      )
      expect(screen.getByTestId('document-name-dropdown')).toHaveTextContent('Plans')
      expect(document.title).toBe('Plans - Proton Docs')
    })

    test('reopening Rename after Drive picked another name shows that name, and leaving it renames nothing', async () => {
      getAvailableName.mockResolvedValue('Roadmap (1)')
      await openMenu('Editor')
      await userEvent.click(menuItem('Rename document'))
      await userEvent.clear(screen.getByTestId('rename-input'))
      await userEvent.type(screen.getByTestId('rename-input'), 'Roadmap{Enter}')
      await waitFor(() => expect(screen.getByTestId('document-name-dropdown')).toHaveTextContent('Roadmap (1)'))

      await userEvent.click(screen.getByTestId('document-name-dropdown'))
      await userEvent.click(menuItem('Rename document'))
      expect(screen.getByTestId('rename-input')).toHaveValue('Roadmap (1)')
      fireEvent.blur(screen.getByTestId('rename-input'))

      expect(renameNode).toHaveBeenCalledTimes(1)
    })

    test('reopening Rename after a failed rename shows the old name', async () => {
      renameNode.mockRejectedValue(new Error('Rename failed'))
      await openMenu('Editor')
      await userEvent.click(menuItem('Rename document'))
      await userEvent.clear(screen.getByTestId('rename-input'))
      await userEvent.type(screen.getByTestId('rename-input'), 'Roadmap{Enter}')
      await waitFor(() => expect(mockCreateNotification).toHaveBeenCalled())

      await userEvent.click(screen.getByTestId('document-name-dropdown'))
      await userEvent.click(menuItem('Rename document'))

      expect(screen.getByTestId('rename-input')).toHaveValue('Plans')
    })

    test.each([
      ['Escape', 'Roadmap{Escape}'],
      ['an empty name', '{Enter}'],
      ['the same name', 'Plans{Enter}'],
    ])('%s renames nothing', async (_case, typed) => {
      await openMenu('Editor')

      await userEvent.click(menuItem('Rename document'))
      await userEvent.clear(screen.getByTestId('rename-input'))
      await userEvent.type(screen.getByTestId('rename-input'), typed)

      expect(screen.getByTestId('document-name-dropdown')).toHaveTextContent('Plans')
      expect(getAvailableName).not.toHaveBeenCalled()
      expect(renameNode).not.toHaveBeenCalled()
    })
  })
})

type MenuOverrides = Partial<Parameters<typeof DocumentTitleMenu>[0]>

const application = {
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
} as unknown as ApplicationProviderProps['application']

function menuElement(role: DocumentRole, overrides: MenuOverrides = {}) {
  return (
    <ConfigContext.Provider value={{ APP_VERSION: '1.2.3', APP_NAME: 'proton-docs' } as ProtonConfig}>
      <ApplicationProvider application={application}>
        <DocumentTitleMenu
          node={NODE}
          role={role}
          editorInvoker={undefined}
          exportInvoker={undefined}
          wordCount={{ isShown: false, setIsShown: jest.fn() }}
          trashState="not_trashed"
          isCreatingSpreadsheet={false}
          onFileMenuAction={jest.fn()}
          {...overrides}
        />
      </ApplicationProvider>
    </ConfigContext.Provider>
  )
}

let rerenderLast: (ui: ReturnType<typeof menuElement>) => void = () => {}

function renderMenu(role: DocumentRole, overrides: MenuOverrides = {}) {
  const onFileMenuAction = jest.fn()
  const rendered = render(menuElement(role, { onFileMenuAction, ...overrides }))
  rerenderLast = (ui) => rendered.rerender(ui)
  return { ...rendered, onFileMenuAction }
}

/** Renders the last menu again with new props, as a Drive update to the node does. */
function rerenderMenu(role: DocumentRole, overrides: MenuOverrides) {
  rerenderLast(menuElement(role, overrides))
}

async function openMenu(role: DocumentRole, overrides: MenuOverrides = {}) {
  const rendered = renderMenu(role, overrides)
  await userEvent.click(screen.getByTestId('document-name-dropdown'))
  return rendered
}

function menu() {
  return screen.getByTestId('e2e-info').closest('ul') as HTMLElement
}

function menuItemNames() {
  return within(menu())
    .getAllByRole('button')
    .map((button) => button.textContent?.trim())
    .map((name) => name?.replace(/\d+$/, '').trim())
}

function menuItem(name: string) {
  return within(menu()).getByRole('button', { name })
}
