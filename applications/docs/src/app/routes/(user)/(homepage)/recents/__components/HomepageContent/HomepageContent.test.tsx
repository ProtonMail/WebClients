import '@testing-library/jest-dom'
import { cleanup, render, screen, within } from '@testing-library/react'
import { HomepageContent } from './HomepageContent'
import { RecentDocumentsItem } from '@proton/docs-core'
import { DocumentActionsContext } from '../../__utils/document-actions'
import { ServerTime } from '@proton/docs-shared'
import { type ReactNode, useEffect, useState } from 'react'
import type { Application, RecentDocumentsItemLocation } from '@proton/docs-core'
import type { LoggerInterface } from '@proton/utils/logs'
import userEvent from '@testing-library/user-event'
import { ApplicationProvider } from '~/utils/application-context'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import type { HomepageViewState } from '../../__utils/homepage-view'
import { HomepageViewContext } from '../../__utils/homepage-view'

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
    await screen.findByText(/Create an encrypted document./)
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
          onTrashed: jest.fn(),
          currentlyTrashingId: undefined,
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
    flow: 'one_document' | 'empty_recents' | 'delayed'
  }) {
    const [state, setState] = useState<HomepageViewState>({ view: 'recents-initial' })

    useEffect(() => {
      if (flow === 'one_document') {
        setState({ view: 'recents', sort: 'viewed', stale: false, itemSections: [{ id: 'today', items: MOCK_DATA }] })
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
        }}
      >
        {children}
      </HomepageViewContext.Provider>
    )
  }

  function renderWithProviders(node: ReactNode, flow: 'one_document' | 'empty_recents' | 'delayed' = 'one_document') {
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
    const columns = within(row).getAllByRole('cell')
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
