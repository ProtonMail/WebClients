import '@testing-library/jest-dom'
import { cleanup, render, screen, within } from '@testing-library/react'
import { HomepageContent } from './HomepageContent'
import { RecentDocumentsItem } from '@proton/docs-core'
import { RecentDocumentsContext } from '../../__utils/recent-documents'
import { ServerTime } from '@proton/docs-shared'
import { type ReactNode, useEffect, useState } from 'react'
import type { Application, RecentDocumentsItemLocation, RecentDocumentsServiceState } from '@proton/docs-core'
import type { LoggerInterface } from '@proton/utils/logs'
import userEvent from '@testing-library/user-event'
import { ApplicationProvider } from '~/utils/application-context'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'

jest.mock('@proton/shared/lib/i18n', () => ({ dateLocale: { code: 'us' } }))

jest.mock('@proton/drive-store', () => ({
  ...jest.requireActual('@proton/drive-store'),
  useDocInvites: () => ({
    invitations: [],
    recentlyAcceptedInvites: [],
    loading: false,
  }),
}))

jest.mock('@proton/mail/contactEmails/hooks', () => ({
  useContactEmails: () => [[], false],
}))

jest.mock('@proton/components/hooks/useAuthentication', () => ({
  __esModule: true,
  default: () => ({ getLocalID: () => 0 }),
}))

function createMockRecentDocument(data: Partial<RecentDocumentsItemValue> = {}): RecentDocumentsItem {
  return RecentDocumentsItem.create({
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
    renderWithProvider(<HomepageContent />, 'delayed')
    await screen.findByText(/Loading/)
  })

  test('Show recent document table when results are fetched', async () => {
    renderWithProvider(<HomepageContent />)
    const table = await screen.findByRole('table')
    // first rowgroup is for the thread second is for tbody
    const tbody = within(table).getAllByRole('rowgroup')[1]
    const rows = within(tbody).getAllByRole('row')
    rows.forEach((row, i) => {
      checkRowContents(row, MOCK_DATA[i].name, MOCK_DATA[i].createdBy ?? '', MOCK_DATA[i].location)
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

  function RecentDocumentsMockProvider({
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
  }) {
    const [state, setState] = useState<RecentDocumentsServiceState>('not_fetched')
    const [items, setItems] = useState<RecentDocumentsItem[]>([])

    let providerValue = {
      state,
      items,
      handleTrashDocument,
      handleOpenDocument,
      handleOpenFolder,
    }

    useEffect(() => {
      if (flow === 'one_document') {
        setState('done')
        setItems(MOCK_DATA)
      }

      if (flow === 'empty_recents') {
        setState('done')
        setItems([])
      }

      if (flow === 'delayed') {
        setState('fetching')
        setTimeout(() => {
          setState('done')
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

  function checkRowContents(
    row: HTMLElement,
    documentName: string,
    createdBy: string,
    location?: RecentDocumentsItemLocation,
  ) {
    const columns = within(row).getAllByRole('cell')
    expect(columns).toHaveLength(4)
    expect(columns[0]).toHaveTextContent(documentName)
    expect(columns[1]).toHaveTextContent('today')
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
