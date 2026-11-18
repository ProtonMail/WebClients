import type { ProtonDriveClient } from '@protontech/drive-sdk'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { MemoryRouter, useHistory } from 'react-router'
import { CompatRouter } from 'react-router-dom-v5-compat'

import { ServerTime } from './utils/serverTime'
import { buildRecentsState, buildSearchState, buildTrashState, HomepageViewProvider } from './HomepageViewProvider'
import { useHomepageTitle } from './useHomepageTitle'
import { useRecentsStore } from './useRecentsStore'
import type { ProtonDocumentType } from './utils/mimetype'
import { RecentDocumentsItem, type RecentDocumentsItemValue } from './recentDocumentsItem'
import type { RecentDocumentsItemLocation } from './recentDocumentsItem'

describe('buildTrashState', () => {
  test('no trashed documents means empty state', () => {
    expect(buildTrashState([], false)).toStrictEqual({ view: 'trash-empty' })
  })

  test('trashed loading state', () => {
    expect(buildTrashState([], true)).toStrictEqual({ view: 'trash-loading' })
  })

  test('state with trashed items', () => {
    const exampleA = createDocumentItem('exampleA')
    const exampleB = createDocumentItem('exampleB')

    expect(buildTrashState([exampleB, exampleA], false)).toStrictEqual({
      view: 'trash',
      itemSections: [
        { id: 'name', items: [RecentDocumentsItem.create(exampleA), RecentDocumentsItem.create(exampleB)] },
      ],
    })
  })
})

describe('buildRecentsState', () => {
  test('recents initial state', () => {
    expect(buildRecentsState([], false, false, 'viewed', undefined, [], undefined)).toStrictEqual({
      view: 'recents-initial',
    })
  })

  test('recents loading state (when not initialized)', () => {
    expect(buildRecentsState([], false, true, 'viewed', undefined, [], undefined)).toStrictEqual({
      view: 'recents-loading',
    })
  })

  test('recents loading state (when initialized)', () => {
    expect(buildRecentsState([], true, true, 'viewed', undefined, [], undefined)).toStrictEqual({
      view: 'recents-loading',
    })
  })

  test('recents empty state', () => {
    expect(buildRecentsState([], true, false, 'viewed', undefined, [], undefined)).toStrictEqual({
      view: 'recents-empty',
    })
  })

  test('sort recents A-Z', () => {
    const itemC = createDocumentItem('Charlie')
    const itemA = createDocumentItem('Alice')
    const itemB = createDocumentItem('Bob')

    expect(buildRecentsState([itemC, itemA, itemB], true, false, 'name', undefined, [], undefined)).toStrictEqual({
      view: 'recents',
      sort: 'name',
      itemSections: [
        {
          id: 'name',
          items: [
            RecentDocumentsItem.create(itemA),
            RecentDocumentsItem.create(itemB),
            RecentDocumentsItem.create(itemC),
          ],
        },
      ],
    })
  })

  test('group recents by time (old file)', () => {
    const oldItem = createDocumentItem('old')
    // oldItem has ServerTime(1_000_000_000) which is year 2001 → 'earlier' section
    const result = buildRecentsState([oldItem], true, false, 'viewed', undefined, [], undefined)

    expect(result).toMatchObject({ view: 'recents', sort: 'viewed' })
    expect((result as any).itemSections).toHaveLength(1)
    expect((result as any).itemSections[0].id).toBe('earlier')
  })

  test('group recents by time (new file)', () => {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const todayItem = createDocumentItem('fresh', { lastViewed: new ServerTime(nowSeconds) })

    const result = buildRecentsState([todayItem], true, false, 'viewed', undefined, [], undefined)

    expect(result).toMatchObject({ view: 'recents', sort: 'viewed' })
    expect((result as any).itemSections[0].id).toBe('today')
  })

  test('group recents by owner: own docs first, then shared by owner name', () => {
    const ownDocA = createDocumentItem('A Doc', { isSharedWithMe: false })
    const ownDocB = createDocumentItem('B Doc', { isSharedWithMe: false })
    const sharedAlice = createDocumentItem('Alice doc', { isSharedWithMe: true, createdBy: 'alice@example.com' })
    const sharedZack = createDocumentItem('Zack doc', { isSharedWithMe: true, createdBy: 'zack@example.com' })

    expect(
      buildRecentsState([sharedZack, ownDocB, sharedAlice, ownDocA], true, false, 'owner', undefined, [], undefined),
    ).toStrictEqual({
      view: 'recents',
      sort: 'owner',
      itemSections: [
        {
          id: 'name',
          items: [
            RecentDocumentsItem.create(ownDocA),
            RecentDocumentsItem.create(ownDocB),
            RecentDocumentsItem.create(sharedAlice),
            RecentDocumentsItem.create(sharedZack),
          ],
        },
      ],
    })
  })

  test('group recents by location: root first, then path sorted alphabetically, then shared-with-me', () => {
    const rootDoc = createDocumentItem('root doc', { location: { type: 'root' } })
    const pathAlpha = createDocumentItem('alpha doc', { location: { type: 'path', path: ['Alpha'] } })
    const pathZeta = createDocumentItem('zeta doc', { location: { type: 'path', path: ['Zeta'] } })
    const sharedWithMeDoc = createDocumentItem('shared doc', { location: { type: 'shared-with-me' } })

    expect(
      buildRecentsState(
        [pathZeta, sharedWithMeDoc, pathAlpha, rootDoc],
        true,
        false,
        'location',
        undefined,
        [],
        undefined,
      ),
    ).toStrictEqual({
      view: 'recents',
      sort: 'location',
      itemSections: [
        {
          id: 'name',
          items: [
            RecentDocumentsItem.create(rootDoc),
            RecentDocumentsItem.create(pathAlpha),
            RecentDocumentsItem.create(pathZeta),
            RecentDocumentsItem.create(sharedWithMeDoc),
          ],
        },
      ],
    })
  })

  test('type filter removes non-matching documents', () => {
    const docItem = createDocumentItem('myDoc', { type: 'document' })
    const sheetItem = createDocumentItem('mySheet', { type: 'spreadsheet' })

    const result = buildRecentsState([docItem, sheetItem], true, false, 'name', undefined, [], 'document')

    expect(result).toMatchObject({ view: 'recents' })
    expect((result as any).itemSections[0].items).toHaveLength(1)
    expect((result as any).itemSections[0].items[0].name).toBe('myDoc')
  })

  test('type filter removes non-matching documents - empty state (no documents found)', () => {
    const sheetItem = createDocumentItem('mySheet', { type: 'spreadsheet' })

    expect(buildRecentsState([sheetItem], true, false, 'name', undefined, [], 'document')).toStrictEqual({
      view: 'recents-empty',
    })
  })
})

describe('buildSearchState', () => {
  test('initial state', () => {
    expect(buildSearchState('hello', false, false, [], undefined)).toStrictEqual({
      view: 'search-initial',
      query: 'hello',
    })
  })

  test('not initialized yet, but loading', () => {
    expect(buildSearchState('hello', true, false, [], undefined)).toStrictEqual({
      view: 'search-loading',
      query: 'hello',
    })
  })

  test('initialized and loading', () => {
    expect(buildSearchState('hello', true, true, [], undefined)).toStrictEqual({
      view: 'search-loading',
      query: 'hello',
    })
  })

  test('no matching documents', () => {
    const item = createDocumentItem('completely different')
    expect(buildSearchState('nomatch', false, true, [item], undefined)).toStrictEqual({
      view: 'search-empty',
      query: 'nomatch',
    })
  })

  test('empty document list', () => {
    expect(buildSearchState('hello', false, true, [], undefined)).toStrictEqual({
      view: 'search-empty',
      query: 'hello',
    })
  })

  test('found both documents', () => {
    const itemB = createDocumentItem('Beta doc')
    const itemA = createDocumentItem('Alpha doc')

    expect(buildSearchState('doc', false, true, [itemB, itemA], undefined)).toStrictEqual({
      view: 'search',
      query: 'doc',
      itemSections: [
        {
          id: 'search-results',
          items: [RecentDocumentsItem.create(itemA), RecentDocumentsItem.create(itemB)],
        },
      ],
    })
  })

  test('search is case-insensitive', () => {
    const item = createDocumentItem('My Document')
    const result = buildSearchState('document', false, true, [item], undefined)
    expect(result).toMatchObject({ view: 'search' })
  })

  test('search only matches by name, not other fields', () => {
    const item = createDocumentItem('unrelated name')
    // The query matches the volumeId, not the name — should not match
    const result = buildSearchState('vol123', false, true, [{ ...item, volumeId: 'vol123' }], undefined)

    expect(result).toStrictEqual({ view: 'search-empty', query: 'vol123' })
  })

  test('type filter in search removes non-matching results', () => {
    const docItem = createDocumentItem('doc', { type: 'document' })
    const sheetItem = createDocumentItem('sheet', { type: 'spreadsheet' })

    // query matches both names, but type filter should keep only spreadsheets
    const result = buildSearchState('', false, true, [docItem, sheetItem], 'spreadsheet')

    expect(result).toMatchObject({ view: 'search' })
    expect((result as any).itemSections[0].items).toHaveLength(1)
    expect((result as any).itemSections[0].items[0].name).toBe('sheet')
  })
})

function createDocumentItem(name: string, overrides: Partial<RecentDocumentsItemValue> = {}): RecentDocumentsItemValue {
  return {
    type: 'document' as ProtonDocumentType,
    name,
    linkId: '',
    parentLinkId: undefined,
    volumeId: '',
    lastViewed: new ServerTime(1_000_000_000),
    lastModified: new ServerTime(1_000_000_000),
    createdBy: undefined,
    location: { type: 'root' } as RecentDocumentsItemLocation,
    isSharedWithMe: false,
    shareId: '',
    ...overrides,
  }
}

function renderProvider(path: string, { myFilesRootFolder = new Promise<never>(() => {}) } = {}) {
  const api = jest.fn().mockResolvedValue({ RecentDocuments: [], Code: '1000' })
  // No nodes: the recents and the trash are empty.
  const iterateNodes = async function* () {
    yield* []
  }
  const iterateTrashedNodes = jest.fn(iterateNodes)
  const drive = {
    getMyFilesRootFolder: () => myFilesRootFolder,
    iterateNodes,
    iterateTrashedNodes,
  } as unknown as ProtonDriveClient
  let reloadOnCoreEvent: () => unknown = () => {}
  const coreEventSubscriber = {
    addListener: (listener: () => unknown) => {
      reloadOnCoreEvent = listener
      return () => {}
    },
  }
  const reportTitle = jest.fn()
  const createNotification = jest.fn()
  let history: ReturnType<typeof useHistory>
  function CaptureHistory() {
    history = useHistory()
    return null
  }
  // The title the host gives the tab, read as HomepageShell reads it.
  function CaptureTitle() {
    reportTitle(useHomepageTitle())
    return null
  }

  render(
    <MemoryRouter initialEntries={[path]}>
      <CompatRouter>
        <HomepageViewProvider
          drive={drive}
          eventSubscriber={{ initialize: jest.fn(), reset: jest.fn(), subscribeToSharedDocument: jest.fn() }}
          coreEventSubscriber={coreEventSubscriber}
          pendingInvitations={[]}
          recentlyAcceptedInvitations={[]}
          acceptInvitation={jest.fn()}
          declineInvitation={jest.fn()}
          reloadInvitations={jest.fn()}
          api={api}
          logger={{ debug: jest.fn(), error: jest.fn() }}
          reportTelemetry={jest.fn()}
          createNotification={createNotification}
          getAppHref={(path) => path}
          dateLocaleCode="en-US"
          errorTracking={ERROR_TRACKING}
          featureFlags={FEATURE_FLAGS}
          addresses={[]}
          contactEmails={[]}
        >
          <CaptureHistory />
          <CaptureTitle />
        </HomepageViewProvider>
      </CompatRouter>
    </MemoryRouter>,
  )
  return {
    api,
    iterateTrashedNodes,
    reportTitle,
    createNotification,
    reloadOnCoreEvent: () =>
      act(() => {
        void reloadOnCoreEvent()
      }),
    navigate: (to: string) => act(() => history.push(to)),
  }
}

// Kept the same objects across renders, as the provider asks.
const ERROR_TRACKING = { traceError: jest.fn(), addBreadcrumb: jest.fn(), isReportable: () => true }
const FEATURE_FLAGS = { bulkTrash: false, bulkMove: false }

describe('HomepageViewProvider', () => {
  afterEach(() => {
    cleanup()
    useRecentsStore.setState({ recentDocuments: {}, recentDocumentsInitialized: false })
  })

  test('names the page after the view, and renames it as the user moves between pages', async () => {
    const { reportTitle, navigate } = renderProvider('/recents')
    await waitFor(() => expect(reportTitle).toHaveBeenLastCalledWith('Recents'))

    navigate('/trash')
    await waitFor(() => expect(reportTitle).toHaveBeenLastCalledWith('Trash'))

    navigate('/recents?q=plan')
    await waitFor(() => expect(reportTitle).toHaveBeenLastCalledWith('Searching "plan"'))
  })

  test('on the trash page, loads the trash and not the recent documents', async () => {
    const { api, iterateTrashedNodes } = renderProvider('/trash')

    await waitFor(() => expect(iterateTrashedNodes).toHaveBeenCalledTimes(1))
    expect(api).not.toHaveBeenCalled()
  })

  test('loads the recent documents again when shared documents change', async () => {
    const { api, reloadOnCoreEvent } = renderProvider('/recents')
    await waitFor(() => expect(api).toHaveBeenCalledTimes(1))

    reloadOnCoreEvent()

    await waitFor(() => expect(api).toHaveBeenCalledTimes(2))
  })

  test("says so when the My files folder can't load", async () => {
    const { createNotification } = renderProvider('/recents', {
      myFilesRootFolder: Promise.reject(new Error('Offline')),
    })

    await waitFor(() =>
      expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: "Failed to load 'My files' folder" }),
    )
  })
})
