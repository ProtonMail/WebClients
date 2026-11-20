import { generateNodeUid, type ProtonDriveClient } from '@protontech/drive-sdk'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { CompatRouter } from 'react-router-dom-v5-compat'

import { useDocumentActions } from './documentActionsContext'
import { HomepageDependenciesProvider, type HomepageDependencies } from './HomepageDependenciesProvider'
import { useHomepageView } from './homepageViewContext'
import { defaultHomepageMessages } from './messages/defaultHomepageMessages'
import { useHomepageMessages } from './messages/HomepageMessagesProvider'
import { RecentDocumentsItem } from './recentDocumentsItem'
import { useRecentsStore } from './useRecentsStore'
import { ServerTime } from './utils/serverTime'

const planDocument = RecentDocumentsItem.create({
  type: 'document',
  name: 'Plan',
  linkId: 'link1',
  parentLinkId: undefined,
  volumeId: 'volume1',
  lastViewed: new ServerTime(Date.now()),
  lastModified: new ServerTime(Date.now()),
  createdBy: 'Me',
  location: { type: 'root' },
  isSharedWithMe: false,
  shareId: 'share1',
})

function createDependencies(): HomepageDependencies {
  return {
    drive: {
      getMyFilesRootFolder: () => new Promise<never>(() => {}),
      iterateNodes: async function* () {
        yield* []
      },
    } as unknown as ProtonDriveClient,
    eventSubscriber: { initialize: vi.fn(), reset: vi.fn(), subscribeToSharedDocument: vi.fn() },
    coreEventSubscriber: { addListener: () => () => {} },
    pendingInvitations: [],
    recentlyAcceptedInvitations: [],
    acceptInvitation: vi.fn(),
    declineInvitation: vi.fn(),
    reloadInvitations: vi.fn(),
    api: vi.fn().mockResolvedValue({ RecentDocuments: [], Code: '1000' }),
    logger: { debug: vi.fn(), error: vi.fn() },
    reportTelemetry: vi.fn(),
    createNotification: vi.fn(),
    getAppHref: (path) => `https://docs.proton.me${path}`,
    dateFormat: { localeCode: 'en-US', hourCycle: 'h12' },
    errorTracking: { traceError: vi.fn(), addBreadcrumb: vi.fn(), isReportable: () => true },
    featureFlags: { bulkTrash: false, bulkMove: false },
    addresses: [],
    contactEmails: [],
    messages: {
      ...defaultHomepageMessages,
      pageTitle: { ...defaultHomepageMessages.pageTitle, recents: 'Récents' },
    },
    openShareModal: vi.fn(),
    openMoveItemsModal: vi.fn(),
  }
}

function HomepagePart() {
  const { pageTitle } = useHomepageMessages()
  const { getAppHref } = useHomepageView()
  const { share } = useDocumentActions()
  return (
    <button type="button" onClick={() => share(planDocument)}>
      {pageTitle.recents} {getAppHref('/recents', 'proton-docs')}
    </button>
  )
}

function renderWithDependencies(dependencies: HomepageDependencies) {
  const tree = (value: HomepageDependencies) => (
    <MemoryRouter initialEntries={['/recents']}>
      <CompatRouter>
        <HomepageDependenciesProvider dependencies={value}>
          <HomepagePart />
        </HomepageDependenciesProvider>
      </CompatRouter>
    </MemoryRouter>
  )
  const { rerender } = render(tree(dependencies))
  return { rerender: (value: HomepageDependencies) => act(() => rerender(tree(value))) }
}

afterEach(() => {
  useRecentsStore.setState({ recentDocuments: {}, recentDocumentsInitialized: false })
})

describe('HomepageDependenciesProvider', () => {
  test('gives what it renders the messages, the view and the document actions from the dependencies', async () => {
    const dependencies = createDependencies()
    renderWithDependencies(dependencies)

    await userEvent.click(screen.getByRole('button', { name: 'Récents https://docs.proton.me/recents' }))

    expect(dependencies.openShareModal).toHaveBeenCalledWith({
      drive: dependencies.drive,
      nodeUid: generateNodeUid(planDocument.volumeId, planDocument.linkId),
    })
  })

  test('loads the recent documents once when the host passes the same fields in a new object', async () => {
    const dependencies = createDependencies()
    const { rerender } = renderWithDependencies(dependencies)
    await waitFor(() => expect(dependencies.api).toHaveBeenCalledTimes(1))

    rerender({ ...dependencies })

    expect(dependencies.api).toHaveBeenCalledTimes(1)
  })
})
