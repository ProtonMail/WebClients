import '@testing-library/jest-dom'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HomepageContent } from './HomepageContent'
import { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'
import { DocumentActionsContext } from '../../__utils/document-actions'
import { ServerTime } from '@proton/docs-shared/ServerTime'
import { type ReactNode, useEffect, useState } from 'react'
import type { Application } from '@proton/docs-core/Application/Application'
import type { RecentDocumentsItemLocation, RecentDocumentsItemValue } from '@proton/docs-core/Services/recent-documents'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import userEvent from '@testing-library/user-event'
import { ApplicationProvider } from '~/utils/application-context'
import type { HomepageViewState } from '../../__utils/homepage-view'
import { HomepageViewContext } from '../../__utils/homepage-view'

jest.mock('@proton/shared/lib/i18n', () => ({ dateLocale: { code: 'us' } }))

jest.mock('@proton/drive-store/lib/_invites/useDocInvites', () => ({
  ...jest.requireActual('@proton/drive-store/lib/_invites/useDocInvites'),
  useDocInvites: () => ({
    invitations: [],
    recentlyAcceptedInvites: [],
    loading: false,
  }),
}))

jest.mock('@proton/mail/store/contactEmails/hooks', () => ({
  useContactEmails: () => [[], false],
}))

jest.mock('@proton/account/addresses/hooks', () => ({
  useAddresses: () => [[], false],
}))

jest.mock('@proton/components/hooks/useAuthentication', () => ({
  __esModule: true,
  default: () => ({ getLocalID: () => 0 }),
}))

jest.mock('@proton/app-context/useNotifications', () => ({
  __esModule: true,
  useNotifications: () => ({ createNotification: jest.fn() }),
}))

let mockBulkEnabled = false
jest.mock('~/utils/flags', () => ({
  ...jest.requireActual('~/utils/flags'),
  useBulkTrashEnabled: () => mockBulkEnabled,
}))

let mockIsNarrow = false
jest.mock('@proton/components/hooks/useActiveBreakpoint', () => ({
  __esModule: true,
  default: () => ({ viewportWidth: { '<=small': mockIsNarrow } }),
}))

const mockBulkTrash = jest.fn()
jest.mock('../../__utils/useBulkTrash', () => ({
  useBulkTrash: () => ({ trash: mockBulkTrash, isTrashing: false }),
}))

function createMockRecentDocument(data: Partial<RecentDocumentsItemValue> = {}): RecentDocumentsItem {
  return RecentDocumentsItem.create({
    type: 'document',
    name: 'Untitled',
    linkId: 'link1',
    parentLinkId: undefined,
    volumeId: 'volume1',
    lastViewed: new ServerTime(Date.now()),
    lastModified: new ServerTime(Date.now()),
    createdBy: 'Me',
    location: { type: 'root' },
    isSharedWithMe: false,
    shareId: 'share1',
    ...data,
  })
}

const MOCK_DATA = [
  createMockRecentDocument({
    name: 'Document1',
    linkId: 'link1',
    parentLinkId: 'parentLink1',
    location: { type: 'path', path: ['location', 'Document1'] },
    isSharedWithMe: false,
  }),
  createMockRecentDocument({
    name: 'Test Document',
    linkId: 'link2',
    location: { type: 'root' },
    isSharedWithMe: false,
  }),
  createMockRecentDocument({
    name: 'Test Doc',
    linkId: 'link3',
    createdBy: 'Creator',
    location: { type: 'shared-with-me' },
    isSharedWithMe: true,
  }),
]

describe('HomepageContent', () => {
  test('Show loading spinner whilst fetching', async () => {
    renderWithProviders(<HomepageContent />, 'delayed')
    await screen.findByText(/Loading/)
  })

  test('Show recent document table when results are fetched', async () => {
    renderWithProviders(<HomepageContent />)
    const table = await screen.findByRole('table')
    // first rowgroup is for the thread second is for tbody
    const tbody = within(table).getAllByRole('rowgroup')[1]
    const rows = within(tbody).getAllByRole('row')
    rows.forEach((row, i) => {
      checkRowContents(row, MOCK_DATA[i].name, MOCK_DATA[i].createdBy ?? '', MOCK_DATA[i].location)
    })
  })

  test('Show no items found message when results are empty', async () => {
    renderWithProviders(<HomepageContent />, 'empty_recents')
    await screen.findByText(/Create end-to-end encrypted documents and spreadsheets./)
  })

  test('Show context menu when button is clicked', async () => {
    renderWithProviders(<HomepageContent />)
    await userEvent.click(screen.getAllByRole('button', { name: /Actions/ })[0])
    await screen.findByText('Open')
    await screen.findByText('Open folder')
  })

  test('Navigate to the parent drive folder when "Open Folder" is clicked', async () => {
    const { mockOpenParent } = renderWithProviders(<HomepageContent />)
    await userEvent.click(screen.getAllByRole('button', { name: /Actions/ })[0])
    await userEvent.click(await screen.findByText('Open folder'))
    expect(mockOpenParent).toHaveBeenCalledWith(expect.objectContaining(MOCK_DATA[0]))
  })

  test('Navigate to the document editor when "Open" is clicked', async () => {
    const { mockOpen } = renderWithProviders(<HomepageContent />)
    await userEvent.click(screen.getAllByRole('button', { name: /Actions/ })[0])
    await userEvent.click(await screen.findByText('Open'))
    expect(mockOpen).toHaveBeenCalledWith(expect.objectContaining(MOCK_DATA[0]))
  })

  describe('bulk selection', () => {
    beforeEach(() => {
      mockBulkEnabled = true
      mockBulkTrash.mockReset()
    })

    afterEach(() => {
      mockBulkEnabled = false
      mockIsNarrow = false
    })

    const expectNoSelectionUI = () => {
      expect(screen.queryByTestId('bulk-select-all')).toBeNull()
      expect(screen.queryAllByTestId('bulk-row-checkbox')).toHaveLength(0)
    }

    const selectAll = () => userEvent.click(screen.getByTestId('bulk-select-all'))
    // The row activator's label lists the columns, e.g. "Not selected, Document1, Document, ...".
    const findRow = (name: string) => screen.findByRole('button', { name: new RegExp(`(^|, )${name}, `) })

    test('does not render selection UI when the flag is off', async () => {
      mockBulkEnabled = false
      renderWithProviders(<HomepageContent />)
      await screen.findByRole('table')
      expectNoSelectionUI()
    })

    test('does not render selection UI in the trash view', async () => {
      renderWithProviders(<HomepageContent />, 'trash')
      await screen.findByRole('table')
      expectNoSelectionUI()
    })

    test('renders a checkbox only for trashable rows', async () => {
      renderWithProviders(<HomepageContent />)
      const table = await screen.findByRole('table')
      expect(screen.getAllByTestId('bulk-row-checkbox')).toHaveLength(2)
      expect(screen.queryByRole('checkbox', { name: 'Select Test Doc' })).toBeNull()
      const tbody = within(table).getAllByRole('rowgroup')[1]
      within(tbody)
        .getAllByRole('row')
        .forEach((row, i) => {
          checkRowContents(row, MOCK_DATA[i].name, MOCK_DATA[i].createdBy ?? '', MOCK_DATA[i].location)
        })
    })

    test('select all selects every trashable row, shows the count and hides sort', async () => {
      renderWithProviders(<HomepageContent />)
      await screen.findByRole('table')
      expect(screen.getByRole('button', { name: 'Change sort order' })).toBeInTheDocument()

      await selectAll()

      screen.getAllByTestId('bulk-row-checkbox').forEach((checkbox) => expect(checkbox).toBeChecked())
      expect(screen.getByTestId('bulk-selected-count')).toHaveTextContent('2 selected')
      expect(screen.queryByRole('button', { name: 'Change sort order' })).toBeNull()
    })

    test('select all is indeterminate when some rows are selected', async () => {
      renderWithProviders(<HomepageContent />)
      await userEvent.click(await screen.findByRole('checkbox', { name: 'Select Document1' }))

      expect((screen.getByTestId('bulk-select-all') as HTMLInputElement).indeterminate).toBe(true)
      expect(screen.getByTestId('bulk-selected-count')).toHaveTextContent('1 selected')
    })

    test('clicking a row checkbox does not open the document', async () => {
      const { mockOpen } = renderWithProviders(<HomepageContent />)
      await userEvent.click(await screen.findByRole('checkbox', { name: 'Select Document1' }))

      expect(mockOpen).not.toHaveBeenCalled()
    })

    test('trash button trashes selected documents and clears the selection', async () => {
      mockBulkTrash.mockResolvedValue([])
      renderWithProviders(<HomepageContent />)
      await screen.findByRole('table')
      await selectAll()

      await userEvent.click(screen.getByTestId('bulk-trash-button'))

      expect(mockBulkTrash).toHaveBeenCalledWith([
        expect.objectContaining(MOCK_DATA[0]),
        expect.objectContaining(MOCK_DATA[1]),
      ])
      await waitFor(() => expect(screen.queryByTestId('bulk-selected-count')).toBeNull())
    })

    test('keeps failed documents selected after a partial failure', async () => {
      mockBulkTrash.mockResolvedValue([MOCK_DATA[1]])
      renderWithProviders(<HomepageContent />)
      await screen.findByRole('table')
      await selectAll()

      await userEvent.click(screen.getByTestId('bulk-trash-button'))

      await waitFor(() => expect(screen.getByTestId('bulk-selected-count')).toHaveTextContent('1 selected'))
      expect(screen.getByRole('checkbox', { name: 'Select Test Document' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Select Document1' })).not.toBeChecked()
    })

    test('Escape clears the selection', async () => {
      renderWithProviders(<HomepageContent />)
      await screen.findByRole('table')
      await selectAll()
      await userEvent.keyboard('{Escape}')
      expect(screen.queryByTestId('bulk-selected-count')).toBeNull()
    })

    test('clicking empty space clears the selection', async () => {
      renderWithProviders(<HomepageContent />)
      await userEvent.click(await screen.findByRole('checkbox', { name: 'Select Document1' }))
      await userEvent.click(screen.getByRole('table'))
      expect(screen.queryByTestId('bulk-selected-count')).toBeNull()
    })

    test('single click opens the document when the flag is off', async () => {
      mockBulkEnabled = false
      const { mockOpen } = renderWithProviders(<HomepageContent />)
      await userEvent.click((await screen.findAllByText('Document1'))[0])
      expect(mockOpen).toHaveBeenCalledWith(expect.objectContaining(MOCK_DATA[0]), 'normal')
    })

    test('single click selects the row, double click opens the document', async () => {
      const { mockOpen } = renderWithProviders(<HomepageContent />)
      await userEvent.click(await findRow('Document1'))
      expect(mockOpen).not.toHaveBeenCalled()
      expect(screen.getByRole('checkbox', { name: 'Select Document1' })).toBeChecked()
      expect(await findRow('Document1')).toHaveAttribute('aria-pressed', 'true')

      await userEvent.dblClick(await findRow('Document1'))
      expect(mockOpen).toHaveBeenCalledTimes(1)
      expect(mockOpen).toHaveBeenCalledWith(expect.objectContaining(MOCK_DATA[0]), 'normal')
    })

    test('double tap opens the document', async () => {
      const { mockOpen } = renderWithProviders(<HomepageContent />)
      const row = await findRow('Document1')
      const touch = { changedTouches: [{ clientX: 0, clientY: 0 }] }
      fireEvent.touchStart(row, touch)
      fireEvent.touchEnd(row, touch)
      expect(mockOpen).not.toHaveBeenCalled()

      fireEvent.touchStart(row, touch)
      fireEvent.touchEnd(row, touch)
      expect(mockOpen).toHaveBeenCalledWith(expect.objectContaining(MOCK_DATA[0]), 'normal')
    })

    test('double click opens the document in the trash view', async () => {
      const { mockOpen } = renderWithProviders(<HomepageContent />, 'trash')
      await userEvent.click(await findRow('Document1'))
      expect(mockOpen).not.toHaveBeenCalled()

      await userEvent.dblClick(await findRow('Document1'))
      expect(mockOpen).toHaveBeenCalledWith(expect.objectContaining(MOCK_DATA[0]), 'trash')
    })

    test('click replaces the selection, ctrl click toggles a row', async () => {
      renderWithProviders(<HomepageContent />)
      fireEvent.click(await findRow('Document1'))
      fireEvent.click(await findRow('Test Document'))
      expect(screen.getByTestId('bulk-selected-count')).toHaveTextContent('1 selected')

      fireEvent.click(await findRow('Document1'), { ctrlKey: true })
      expect(screen.getByTestId('bulk-selected-count')).toHaveTextContent('2 selected')

      fireEvent.click(await findRow('Document1'), { metaKey: true })
      expect(screen.getByRole('checkbox', { name: 'Select Document1' })).not.toBeChecked()
    })

    test('shift click selects a range', async () => {
      renderWithProviders(<HomepageContent />)
      fireEvent.click(await findRow('Document1'))
      fireEvent.click(await findRow('Test Document'), { shiftKey: true })
      expect(screen.getByTestId('bulk-selected-count')).toHaveTextContent('2 selected')
    })

    test('clicking a row that cannot be trashed does not select or open it', async () => {
      const { mockOpen } = renderWithProviders(<HomepageContent />)
      await userEvent.click(await findRow('Test Doc'))
      expect(screen.queryByTestId('bulk-selected-count')).toBeNull()
      expect(mockOpen).not.toHaveBeenCalled()
    })

    test('row label lists the selection state and the columns', async () => {
      renderWithProviders(<HomepageContent />)
      expect(await findRow('Document1')).toHaveAccessibleName(
        expect.stringMatching(/^Not selected, Document1, Document, Viewed .+, Created by .+, Location Document1$/),
      )
      expect(await findRow('Test Doc')).toHaveAccessibleName(expect.stringMatching(/^Test Doc, Document, /))
    })

    test('Enter opens the focused row, Space selects it', async () => {
      const { mockOpen } = renderWithProviders(<HomepageContent />)
      ;(await findRow('Document1')).focus()

      await userEvent.keyboard(' ')
      expect(screen.getByRole('checkbox', { name: 'Select Document1' })).toBeChecked()
      expect(mockOpen).not.toHaveBeenCalled()

      await userEvent.keyboard('{Enter}')
      expect(mockOpen).toHaveBeenCalledTimes(1)
      expect(mockOpen).toHaveBeenCalledWith(expect.objectContaining(MOCK_DATA[0]), 'normal')
    })

    test('arrow keys, Home and End move focus between rows', async () => {
      renderWithProviders(<HomepageContent />)
      ;(await findRow('Document1')).focus()

      await userEvent.keyboard('{ArrowDown}')
      expect(await findRow('Test Document')).toHaveFocus()

      await userEvent.keyboard('{End}')
      expect(await findRow('Test Doc')).toHaveFocus()

      await userEvent.keyboard('{ArrowUp}')
      expect(await findRow('Test Document')).toHaveFocus()

      await userEvent.keyboard('{Home}')
      expect(await findRow('Document1')).toHaveFocus()
    })

    test('on mobile, the selection controls are in the head', async () => {
      mockIsNarrow = true
      renderWithProviders(<HomepageContent />)
      const table = await screen.findByRole('table')
      const head = within(table).getAllByRole('rowgroup')[0]
      await userEvent.click(await findRow('Document1'))

      expect(within(head).getByTestId('bulk-select-all')).toBeInTheDocument()
      expect(within(head).getByTestId('bulk-selected-count')).toHaveTextContent('1 selected')
      expect(within(head).getByTestId('bulk-trash-button')).toBeInTheDocument()
    })

    test('double clicking a row button does not open the document', async () => {
      const { mockOpen } = renderWithProviders(<HomepageContent />)
      await userEvent.dblClick((await screen.findAllByRole('button', { name: /Actions/ }))[0])
      expect(mockOpen).not.toHaveBeenCalled()
    })
  })

  function DocumentActionsMockProvider({
    children,
    mockOpen: open = jest.fn(),
    mockOpenParent: openParent = jest.fn(),
    mockTrash: trash = jest.fn(),
  }: {
    children: ReactNode
    mockOpen?: jest.Mock
    mockOpenParent?: jest.Mock
    mockTrash?: jest.Mock
  }) {
    return (
      <DocumentActionsContext.Provider
        value={{
          open,
          openParent,
          trash,
          startRename: jest.fn(),
          cancelRename: jest.fn(),
          rename: jest.fn(),
          isRenaming: jest.fn(),
          isRenameSaving: false,
          move: jest.fn(),
          share: jest.fn(),
          subscribeToTrashed: jest.fn(),
          currentlyTrashingId: undefined,
          restore: jest.fn(),
          subscribeToRestored: jest.fn(),
          currentlyRestoringId: undefined,
          deletePermanently: jest.fn(),
        }}
      >
        {children}
      </DocumentActionsContext.Provider>
    )
  }

  function HomepageViewMockProvider({
    children,
    flow,
  }: {
    children: ReactNode
    flow: 'one_document' | 'empty_recents' | 'delayed' | 'trash'
  }) {
    const [state, setState] = useState<HomepageViewState>({ view: 'recents-initial' })

    useEffect(() => {
      if (flow === 'one_document') {
        setState({ view: 'recents', sort: 'viewed', itemSections: [{ id: 'today', items: MOCK_DATA }] })
      }

      if (flow === 'trash') {
        setState({ view: 'trash', itemSections: [{ id: 'today', items: MOCK_DATA }] })
      }

      if (flow === 'empty_recents') {
        setState({ view: 'recents-empty' })
      }

      if (flow === 'delayed') {
        setState({ view: 'recents-loading' })
        setTimeout(() => setState({ view: 'recents-empty' }), 10)
      }
    }, [flow])

    return (
      <HomepageViewContext.Provider
        value={{
          setRecentsSort: jest.fn,
          setSearch: jest.fn,
          updateRecentDocuments: jest.fn as any,
          updateRenamedDocumentInCache: jest.fn as any,
          isRecentsUpdating: false,
          state,
          type: undefined,
        }}
      >
        {children}
      </HomepageViewContext.Provider>
    )
  }

  function renderWithProviders(
    node: ReactNode,
    flow: 'one_document' | 'empty_recents' | 'delayed' | 'trash' = 'one_document',
  ) {
    const mockOpen = jest.fn()
    const mockOpenParent = jest.fn()
    const mockTrash = jest.fn()

    render(
      <ApplicationProvider
        application={{ logger: { debug: jest.fn() } as unknown as LoggerInterface } as unknown as Application}
      >
        <HomepageViewMockProvider flow={flow}>
          <DocumentActionsMockProvider mockOpen={mockOpen} mockOpenParent={mockOpenParent} mockTrash={mockTrash}>
            {node}
          </DocumentActionsMockProvider>
        </HomepageViewMockProvider>
      </ApplicationProvider>,
    )
    return { mockOpen, mockOpenParent, mockTrash }
  }

  function checkRowContents(
    row: HTMLElement,
    documentName: string,
    createdBy: string,
    location?: RecentDocumentsItemLocation,
  ) {
    // Skips the row activator, rendered with the bulk trash flag on.
    const columns = within(row)
      .getAllByRole('cell')
      .filter((cell) => !within(cell).queryByTestId('row-activator'))
    expect(columns).toHaveLength(4)
    expect(columns[0]).toHaveTextContent(documentName)
    expect(columns[2]).toHaveTextContent(createdBy)
    let locationText = ''
    if (location?.type === 'path') {
      locationText = location.path.at(-1)!
    } else if (location?.type === 'shared-with-me') {
      locationText = 'Shared with me'
    } else {
      locationText = 'My files'
    }
    expect(columns[3]).toHaveTextContent(locationText)
  }

  afterEach(cleanup)
})
