import { RecentDocumentsItem } from '@proton/docs-core'
import { useHistory, useRouteMatch } from 'react-router'
import { HOMEPAGE_RECENTS_PATH, HOMEPAGE_FAVORITES_PATH, HOMEPAGE_TRASH_PATH } from '../../../__components/AppContainer'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom-v5-compat'
import type { DecryptedLink } from '@proton/drive-store/store'
import { useDefaultShare, useDriveEventManager, useTrashView } from '@proton/drive-store/store'
import { ServerTime } from '@proton/docs-shared'
import { useApplication } from '~/utils/application-context'
import { useEvent, useSubscribe } from '~/utils/misc'
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks'
import { VolumeTypeForEvents } from '@proton/drive-store/store/_volumes'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import { getOwnerName } from './get-owner-name'
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype'

// constants
// ---------

const ALLOWED_SORT_VALUES = [
  'viewed',
  // 'modified',
  'name',
  'owner',
  'location',
] as const
const DEFAULT_RECENTS_SORT = 'viewed' satisfies RecentsSort
const ORDERED_SECTION_IDS = [
  'search-results',
  'name',
  'today',
  'yesterday',
  'previous7Days',
  'previous30Days',
  'earlier',
] as const

// types
// -----

export type RecentsSort = (typeof ALLOWED_SORT_VALUES)[number]
export type ItemsSectionId = (typeof ORDERED_SECTION_IDS)[number]
export type ItemsSection = { id: ItemsSectionId; items: RecentDocumentsItem[] }

export type HomepageViewState =
  | { view: 'unknown' }
  // Search.
  | { view: 'search-initial'; query: string }
  | { view: 'search-loading'; query: string }
  | { view: 'search-empty'; query: string }
  | { view: 'search'; itemSections: ItemsSection[]; query: string }
  // Recents.
  | { view: 'recents-initial' }
  | { view: 'recents-loading' }
  | { view: 'recents-empty' }
  | { view: 'recents'; itemSections: ItemsSection[]; sort: RecentsSort }
  // Favorites.
  | { view: 'favorites-loading' }
  | { view: 'favorites-empty' }
  | { view: 'favorites'; itemSections: ItemsSection[] }
  // Trash.
  | { view: 'trash-empty' }
  | { view: 'trash-loading' }
  | { view: 'trash'; itemSections: ItemsSection[] }

// context
// -------

export type HomepageViewValue = {
  state: HomepageViewState
  setRecentsSort: (value: RecentsSort) => void
  setSearch: (value: string | undefined, exclusive?: boolean) => void
  updateRecentDocuments: () => Promise<void>
  updateRenamedDocumentInCache: (uniqueId: string, name: string) => Promise<void>
  isRecentsUpdating: boolean
}

export const HomepageViewContext = createContext<HomepageViewValue | undefined>(undefined)

export type HomepageViewProviderProps = {
  children: ReactNode
}

export function HomepageViewProvider({ children }: HomepageViewProviderProps) {
  useSubscribeToMainVolume()

  const isRecentsRoute = Boolean(useRouteMatch(HOMEPAGE_RECENTS_PATH))
  const isFavoritesRoute = Boolean(useRouteMatch(HOMEPAGE_FAVORITES_PATH))
  const isTrashRoute = Boolean(useRouteMatch(HOMEPAGE_TRASH_PATH))

  const [search, setSearch] = useSearch()
  const [recentsSort, setRecentsSort] = useRecentsSort()

  const {
    recentDocuments,
    updateRecentDocuments,
    updateRenamedDocumentInCache,
    isLoading: isRecentsLoading,
    isUpdating: isRecentsUpdating,
    isInitial: isRecentsInitial,
  } = useRecentDocuments({ search })
  const { trashedDocuments, isLoading: isTrashedLoading } = useTrashedDocuments()

  const state = useHomepageViewState({
    isRecentsRoute,
    isFavoritesRoute,
    isTrashRoute,
    search,
    recentsSort,
    recentDocuments,
    trashedDocuments,
    isRecentsLoading,
    isRecentsInitial,
    isTrashedLoading,
  })
  const value = useMemo(
    () => ({
      state,
      setRecentsSort,
      setSearch,
      updateRecentDocuments,
      updateRenamedDocumentInCache,
      isRecentsUpdating,
    }),
    [isRecentsUpdating, setRecentsSort, setSearch, state, updateRecentDocuments, updateRenamedDocumentInCache],
  )

  return <HomepageViewContext.Provider value={value}>{children}</HomepageViewContext.Provider>
}

export function useHomepageView() {
  const value = useContext(HomepageViewContext)
  if (!value) {
    throw new Error('Missing View context')
  }
  return value
}

// view state resolver
// -------------------

type HomepageViewStateOptions = {
  isRecentsRoute: boolean
  isFavoritesRoute: boolean
  isTrashRoute: boolean
  search: string | undefined
  recentsSort: RecentsSort
  recentDocuments: RecentDocumentsItem[]
  trashedDocuments: RecentDocumentsItem[]
  isRecentsLoading: boolean
  isRecentsInitial: boolean
  isTrashedLoading: boolean
}

function useHomepageViewState({
  isRecentsRoute,
  isFavoritesRoute,
  isTrashRoute,
  search,
  recentsSort,
  recentDocuments,
  trashedDocuments,
  isRecentsLoading,
  isRecentsInitial,
  isTrashedLoading,
}: HomepageViewStateOptions): HomepageViewState {
  // The state, without the items.
  const protoState = useMemo(() => {
    let outputState: HomepageViewState = { view: 'unknown' }
    if (isRecentsRoute) {
      // Search.
      if (search && search.length > 0) {
        if (isRecentsInitial) {
          outputState = { view: 'search-initial', query: search }
        } else if (isRecentsLoading) {
          outputState = { view: 'search-loading', query: search }
        } else if (recentDocuments.length === 0) {
          outputState = { view: 'search-empty', query: search }
        } else {
          outputState = { view: 'search', itemSections: [], query: search }
        }
        // Recents.
      } else {
        if (isRecentsInitial) {
          outputState = { view: 'recents-initial' }
        } else if (isRecentsLoading) {
          outputState = { view: 'recents-loading' }
        } else if (recentDocuments.length === 0) {
          outputState = { view: 'recents-empty' }
        } else {
          outputState = { view: 'recents', itemSections: [], sort: recentsSort }
        }
      }
      // Favorites.
    } else if (isFavoritesRoute) {
      outputState = { view: 'favorites-empty' }
      // Trash.
    } else if (isTrashRoute) {
      if (isTrashedLoading) {
        outputState = { view: 'trash-loading' }
      } else if (trashedDocuments.length === 0) {
        outputState = { view: 'trash-empty' }
      } else {
        outputState = { view: 'trash', itemSections: [] }
      }
    }

    return outputState
  }, [
    isFavoritesRoute,
    isRecentsInitial,
    isRecentsLoading,
    isRecentsRoute,
    isTrashedLoading,
    isTrashRoute,
    recentDocuments.length,
    recentsSort,
    search,
    trashedDocuments.length,
  ])

  if (protoState.view === 'unknown') {
    throw new Error('Unknown view state')
  }

  const [contactEmails] = useContactEmails()

  // Populate the state with ordered and sectioned items.
  // Done in a separate memoized computation to minimize re-computations.
  const state = useMemo(() => {
    const outputState = { ...protoState }
    if (outputState.view === 'recents') {
      // if (recentsSort === 'viewed' || recentsSort === 'modified') {
      if (recentsSort === 'viewed') {
        outputState.itemSections = splitIntoSectionsByTime(
          recentDocuments,
          recentsSort === 'viewed' ? 'lastViewed' : 'lastModified',
        )
      } else if (recentsSort === 'owner') {
        outputState.itemSections = splitIntoSectionsByOwner(recentDocuments, contactEmails)
      } else if (recentsSort === 'location') {
        outputState.itemSections = splitIntoSectionsByLocation(recentDocuments)
      } else {
        outputState.itemSections = splitIntoSectionsByName(recentDocuments)
      }
    } else if (outputState.view === 'search') {
      outputState.itemSections = splitIntoSectionsByName(recentDocuments, { isSearchResults: true })
    } else if (outputState.view === 'trash') {
      outputState.itemSections = splitIntoSectionsByName(trashedDocuments)
    }
    return outputState
  }, [contactEmails, protoState, recentDocuments, recentsSort, trashedDocuments])

  return state
}

// query state (recents sort and search)
// -------------------------------------

function useQueryState<T extends string | undefined>(name: string, defaultValue: T, allowedValues?: readonly T[]) {
  const isAllowed = useCallback(
    (value: string | null | undefined) => allowedValues?.includes(value as T) ?? true,
    [allowedValues],
  )
  const isDefault = useCallback((value: string | null | undefined) => value === defaultValue, [defaultValue])

  const history = useHistory()
  const location = useLocation()

  const params = new URLSearchParams(location.search)
  const paramValue = params.get(name) ?? undefined
  const hasParam = params.has(name)
  const resolvedValue = isAllowed(paramValue) ? (paramValue as T) : defaultValue

  const setParam = useCallback(
    (value: T, exclusive = false) => {
      const newParams = new URLSearchParams(exclusive ? undefined : location.search)
      if (isDefault(value) || value === undefined || value === '') {
        newParams.delete(name)
      } else {
        newParams.set(name, value)
      }
      history.replace({ search: newParams.toString() })
    },
    [history, isDefault, location.search, name],
  )
  const unsetParam = useCallback(() => setParam(undefined as T), [setParam])

  // If there's a param set, and the value is not allowed or it's the default
  // value, remove it from the URL.
  useEffect(() => {
    if (!isAllowed(paramValue) || isDefault(paramValue)) {
      unsetParam()
    }
  }, [hasParam, isAllowed, isDefault, unsetParam, paramValue])

  return [resolvedValue, setParam] as const
}

function useRecentsSort() {
  return useQueryState<RecentsSort>('sort', DEFAULT_RECENTS_SORT, ALLOWED_SORT_VALUES)
}

function useSearch() {
  return useQueryState<string | undefined>('q', undefined)
}

// recent documents
// ----------------

export function filterDocuments(items?: RecentDocumentsItem[], search?: string) {
  if (!items || items.length === 0 || !search) {
    return items || []
  }

  let outputItems = items

  if (search) {
    outputItems = outputItems.filter((data) => data.name.toLowerCase().includes(search.toLowerCase()))
  }

  return outputItems
}

function useRecentDocuments({ search }: { search?: string }) {
  const { recentDocumentsService, logger } = useApplication()
  const store = recentDocumentsService.state

  const items = useSubscribe(store, 'recents')
  const state = useSubscribe(store, 'state')

  const isEmpty = items.length === 0
  const isInitial = state === 'not_fetched'
  const isUpdating = state === 'fetching' || state === 'resolving'
  const isLoading = isEmpty && isUpdating

  const startTimeRef = useRef<number>()
  useEffect(() => {
    if (state === 'resolving' && !startTimeRef.current) {
      startTimeRef.current = Date.now()
    }
    if (state === 'done' && startTimeRef.current) {
      const duration = (Date.now() - startTimeRef.current) / 1000
      logger.debug(`Time to resolve ${items.length} recent documents: ${duration.toFixed(2)}s`)
      startTimeRef.current = undefined
    }
  }, [items.length, logger, state])

  const filteredItems = useMemo(() => filterDocuments(items, search), [items, search])

  const updateRecentDocuments = useEvent(() => recentDocumentsService.fetch())
  const updateRenamedDocumentInCache = useEvent((uniqueId: string, name: string) =>
    recentDocumentsService.updateRenamedDocumentInCache(uniqueId, name),
  )

  // Initial update.
  useEffect(() => {
    void updateRecentDocuments()
  }, [updateRecentDocuments])

  return {
    recentDocuments: filteredItems,
    updateRecentDocuments,
    updateRenamedDocumentInCache,
    isInitial,
    isUpdating,
    isLoading,
  }
}

// trashed documents
// -----------------

function isTrashedDocument(item: DecryptedLink): item is DecryptedLink & { trashed: number } {
  return Boolean(item.trashed) && (isProtonDocsDocument(item.mimeType) || isProtonDocsSpreadsheet(item.mimeType))
}

/**
 * This is a pile of hacks. It reuses the "trash" view from Drive (drive.proton.me/trash), and since
 * we depend on the shape of "RecentDocumentsItem", we just do a rough conversion so that we can
 * display it in the table for the "Trash" view, which is temporary anyway.
 *
 * When we unwind this temporary implementation, we should make sure to generalize the "RecentDocuments"
 * concept to cover these use cases in a clean way.
 */
function useTrashedDocuments() {
  const { items, isLoading } = useTrashView()
  const trashedDocuments = items.filter(isTrashedDocument).map((item) =>
    RecentDocumentsItem.create({
      type: isProtonDocsDocument(item.mimeType) ? 'document' : 'spreadsheet',
      createdBy: item.nameSignatureEmail,
      name: item.name,
      isSharedWithMe: Boolean(item.sharedBy),
      linkId: item.linkId,
      parentLinkId: item.parentLinkId,
      volumeId: item.volumeId,
      // The properties below are pure lies, but good enough for the purposes of this temporary UI.
      shareId: item.shareId ?? '', // We won't use this, so it's fine if missing.
      lastViewed: new ServerTime(item.trashed), // This is actually the trashed date.
      lastModified: new ServerTime(item.trashed),
      location: { type: 'root' }, // We don't actually rely on this, and just display a link to the Drive "Trash" view.
    }),
  )
  return { trashedDocuments, isLoading }
}

// sort utils
// ----------

function sortByMostRecent(a: RecentDocumentsItem, b: RecentDocumentsItem, property: 'lastViewed' | 'lastModified') {
  return b[property].date.getTime() - a[property].date.getTime()
}

function isAfter(date: Date, target: Date) {
  return date.getTime() >= target.getTime()
}

export function splitIntoSectionsByTime(
  items: RecentDocumentsItem[],
  property: 'lastViewed' | 'lastModified',
): ItemsSection[] {
  const sections: ItemsSection[] = []

  const TODAY = new Date()
  TODAY.setHours(0, 0, 0, 0)
  const YESTERDAY = new Date(TODAY)
  YESTERDAY.setDate(YESTERDAY.getDate() - 1)
  const PREVIOUS_7_DAYS = new Date(TODAY)
  PREVIOUS_7_DAYS.setDate(PREVIOUS_7_DAYS.getDate() - 7)
  const PREVIOUS_30_DAYS = new Date(TODAY)
  PREVIOUS_30_DAYS.setDate(PREVIOUS_30_DAYS.getDate() - 30)

  function sort(a: RecentDocumentsItem, b: RecentDocumentsItem) {
    return sortByMostRecent(a, b, property)
  }

  const sectionMap: Partial<Record<ItemsSectionId, ItemsSection>> = {}
  function getSection(name: ItemsSectionId) {
    if (!sectionMap[name]) {
      sectionMap[name] = { id: name, items: [] }
    }
    return sectionMap[name]
  }

  for (const item of items.sort(sort)) {
    const itemDate = item[property].date
    if (isAfter(itemDate, TODAY)) {
      getSection('today').items.push(item)
    } else if (isAfter(itemDate, YESTERDAY)) {
      getSection('yesterday').items.push(item)
    } else if (isAfter(itemDate, PREVIOUS_7_DAYS)) {
      getSection('previous7Days').items.push(item)
    } else if (isAfter(itemDate, PREVIOUS_30_DAYS)) {
      getSection('previous30Days').items.push(item)
    } else {
      getSection('earlier').items.push(item)
    }
  }

  for (const sectionId of ORDERED_SECTION_IDS) {
    if (sectionMap[sectionId]) {
      sections.push(sectionMap[sectionId]!)
    }
  }

  return sections
}

function splitIntoSectionsByName(
  items: RecentDocumentsItem[],
  { isSearchResults = false }: { isSearchResults?: boolean } = {},
): ItemsSection[] {
  return [
    { id: isSearchResults ? 'search-results' : 'name', items: items.sort((a, b) => a.name.localeCompare(b.name)) },
  ]
}

function splitIntoSectionsByOwner(items: RecentDocumentsItem[], contactEmails?: ContactEmail[]): ItemsSection[] {
  return [
    {
      id: 'name',
      items: [...items].sort((a, b) => {
        if (a.isSharedWithMe !== b.isSharedWithMe) {
          return !a.isSharedWithMe ? -1 : 1
        }
        const aName = getOwnerName(a, contactEmails)
        const bName = getOwnerName(b, contactEmails)
        if (aName && bName) {
          return aName.localeCompare(bName)
        }
        if (Boolean(aName) !== Boolean(bName)) {
          return Boolean(aName) ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      }),
    },
  ]
}

function splitIntoSectionsByLocation(items: RecentDocumentsItem[]): ItemsSection[] {
  return [
    {
      id: 'name',
      items: [...items].sort((a, b) => {
        const aIsRoot = a.location.type === 'root'
        const bIsRoot = b.location.type === 'root'
        if (aIsRoot !== bIsRoot) {
          return aIsRoot ? -1 : 1
        }
        const aIsPath = a.location.type === 'path'
        const bIsPath = b.location.type === 'path'
        if (aIsPath !== bIsPath) {
          return aIsPath ? -1 : 1
        }
        if (aIsPath && bIsPath) {
          return a.location.path.join('/').localeCompare(b.location.path.join('/'))
        }
        return a.name.localeCompare(b.name)
      }),
    },
  ]
}

// subscribe to main volume
// ------------------------

function useSubscribeToMainVolume() {
  const driveEventManager = useDriveEventManager()
  const { getDefaultShare } = useDefaultShare()
  const [volumeId, setVolumeId] = useState<string>()
  const obtainVolumeId = useEvent(async () => {
    const { volumeId } = await getDefaultShare()
    setVolumeId(volumeId)
  })
  useEffect(() => {
    void obtainVolumeId()
  }, [obtainVolumeId])

  useEffect(() => {
    if (!volumeId) {
      return
    }
    driveEventManager.volumes.startSubscription(volumeId, VolumeTypeForEvents.main).catch(console.error)
    return () => {
      driveEventManager.volumes.unsubscribe(volumeId)
    }
  }, [driveEventManager.volumes, volumeId])
}
