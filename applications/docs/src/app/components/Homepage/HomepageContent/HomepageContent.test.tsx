import '@testing-library/jest-dom'
import { cleanup, render, screen, within } from '@testing-library/react'
import { HomepageContent } from './HomepageContent'
import { RecentDocumentItem } from '@proton/docs-core'
import { RecentDocumentsContext } from '../utils/recent-documents'
import { ServerTime } from '@proton/docs-shared'
import { type ReactNode, useEffect, useState } from 'react'
import type { Application, RecentDocumentServiceState } from '@proton/docs-core'
import type { LoggerInterface } from '@proton/utils/logs'
import userEvent from '@testing-library/user-event'
import { ApplicationProvider } from '../../../utils/application-context'

jest.mock('@proton/shared/lib/i18n', () => ({ dateLocale: { code: 'us' } }))

jest.mock('@proton/drive-store', () => ({
  ...jest.requireActual('@proton/drive-store'),
  useDocInvites: () => ({
    invitations: [],
    recentlyAcceptedInvites: [],
    loading: false,
  }),
}))

const MOCK_DATA = [
  new RecentDocumentItem(
    'Document1',
    'link1',
    'parentLink1',
    'volume1',
    new ServerTime(1),
    'Creator',
    ['location', 'Document1'],
    false,
    'share1',
    false,
    ['location', 'Document1'],
  ),
  new RecentDocumentItem(
    'Test Document',
    'link2',
    'parentLink1',
    'volume1',
    new ServerTime(1),
    'Creator',
    ['location', 'Document1'],
    false,
    'share1',
    false,
    ['location', 'Document1'],
  ),
  new RecentDocumentItem(
    'Test Doc',
    'link3',
    'parentLink1',
    'volume1',
    new ServerTime(1),
    'Creator',
    ['location', 'Document1'],
    false,
    'share1',
    false,
    ['location', 'Document1'],
  ),
]

describe('HomepageContent', () => {
  test('Show loading spinner whilst fetching', async () => {
    renderWithProvider(<HomepageContent />, 'delayed')
    await screen.findByText(/Loading/)
  })

  test('Show recent document table when results are fetched', async () => {
    renderWithProvider(<HomepageContent />)
    const table = await screen.findByRole('table')
    // first rowgroup is for the thread second is for tbody
    const tbody = within(table).getAllByRole('rowgroup')[1]
    const rows = within(tbody).getAllByRole('button', { name: 'Open' })
    rows.forEach((row, i) => {
      checkRowContents(
        row,
        MOCK_DATA[i].name,
        '' + MOCK_DATA[i].lastViewed,
        MOCK_DATA[i].createdBy ?? '',
        MOCK_DATA[i].location?.[0] ?? '',
      )
    })
  })

  test('Show no items found message when results are empty', async () => {
    renderWithProvider(<HomepageContent />, 'empty_recents')
    await screen.findByText(/Create your end-to-end encrypted document/)
  })

  test('Show context menu when button is clicked', async () => {
    renderWithProvider(<HomepageContent />)
    await userEvent.click(screen.getAllByRole('button', { name: /Context menu/ })[0])
    await screen.findByText('Open')
    await screen.findByText('Open folder')
  })

  test('Navigate to the parent drive folder when "Open Folder" is clicked', async () => {
    const { mockHandleOpenFolder } = renderWithProvider(<HomepageContent />)
    await userEvent.click(screen.getAllByRole('button', { name: /Context menu/ })[0])
    await userEvent.click(await screen.findByText('Open folder'))
    expect(mockHandleOpenFolder).toHaveBeenCalledWith(expect.objectContaining(MOCK_DATA[0]))
  })

  test('Navigate to the document editor when "Open" is clicked', async () => {
    const { mockHandleOpenDocument } = renderWithProvider(<HomepageContent />)
    await userEvent.click(screen.getAllByRole('button', { name: /Context menu/ })[0])
    await userEvent.click(await screen.findByText('Open'))
    expect(mockHandleOpenDocument).toHaveBeenCalledWith(expect.objectContaining(MOCK_DATA[0]))
  })

  const RecentDocumentsMockProvider = ({
    children,
    flow,
    handleTrashDocument,
    handleOpenDocument,
    handleOpenFolder,
  }: {
    children: ReactNode
    flow: 'one_document' | 'empty_recents' | 'delayed'
    handleTrashDocument: jest.Mock
    handleOpenDocument: jest.Mock
    handleOpenFolder: jest.Mock
  }) => {
    const [status, setStatus] = useState<RecentDocumentServiceState>('not_fetched')
    const [items, setItems] = useState<RecentDocumentItem[]>([])

    let providerValue = {
      status,
      items,
      handleTrashDocument,
      handleOpenDocument,
      handleOpenFolder,
      getDisplayName: (recentDocument: RecentDocumentItem) => recentDocument.createdBy,
      getDisplayDate: (recentDocument: RecentDocumentItem) => '' + recentDocument.lastViewed,
      getLocalID: () => 0,
    }

    useEffect(() => {
      if (flow === 'one_document') {
        setStatus('done')
        setItems(MOCK_DATA)
      }

      if (flow === 'empty_recents') {
        setStatus('done')
        setItems([])
      }

      if (flow === 'delayed') {
        setStatus('fetching')
        setTimeout(() => {
          setStatus('done')
        }, 10)
      }
    }, [flow])

    return <RecentDocumentsContext.Provider value={providerValue}>{children}</RecentDocumentsContext.Provider>
  }

  function renderWithProvider(node: ReactNode, flow: 'one_document' | 'empty_recents' | 'delayed' = 'one_document') {
    const mockHandleTrashDocument = jest.fn()
    const mockHandleOpenDocument = jest.fn()
    const mockHandleOpenFolder = jest.fn()

    render(
      <ApplicationProvider
        application={{ logger: { debug: jest.fn() } as unknown as LoggerInterface } as unknown as Application}
      >
        <RecentDocumentsMockProvider
          flow={flow}
          handleOpenDocument={mockHandleOpenDocument}
          handleOpenFolder={mockHandleOpenFolder}
          handleTrashDocument={mockHandleTrashDocument}
        >
          {node}
        </RecentDocumentsMockProvider>
      </ApplicationProvider>,
    )
    return { mockHandleOpenDocument, mockHandleOpenFolder, mockHandleTrashDocument }
  }

  const checkRowContents = (
    row: HTMLElement,
    documentName: string,
    lastRead: string,
    createdBy: string,
    location: string,
  ) => {
    const columns = within(row).getAllByRole('cell')
    expect(columns).toHaveLength(4)
    expect(columns[0]).toHaveTextContent(documentName)
    expect(columns[1]).toHaveTextContent(lastRead)
    expect(columns[2]).toHaveTextContent(createdBy)
    expect(columns[3]).toHaveTextContent(location)
  }

  afterEach(cleanup)
})
