import { RecentDocumentsItem } from '@proton/docs-core'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import { getDrive } from '@proton/drive'
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks'
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import { useEffect, useMemo } from 'react'
import { useRouteMatch } from 'react-router'
import { HOMEPAGE_TRASH_PATH } from '../../../__components/AppContainer'
import {
  HomepageViewContext,
  type HomepageViewProviderProps,
  type HomepageViewState,
  type HomepageViewValue,
  type ItemsSection,
  type RecentsSort,
  filterDocuments,
  splitIntoSectionsByLocation,
  splitIntoSectionsByName,
  splitIntoSectionsByOwner,
  splitIntoSectionsByTime,
  useRecentsSort,
  useSearch,
  useType,
} from './homepage-view'
import { useTrashed } from './use-trashed'
import { useRecents } from './use-recents'

export function HomepageViewProviderSDK({ children }: HomepageViewProviderProps) {
  const drive = getDrive()

  const [search, setSearch] = useSearch()
  const [recentsSort, setRecentsSort] = useRecentsSort()
  const [contactEmails] = useContactEmails()
  const [type] = useType()

  const isTrashRoute = Boolean(useRouteMatch(HOMEPAGE_TRASH_PATH))

  const { recentDocuments, isRecentsUpdating, updateRecentDocuments, updateRenamedDocumentInCache } = useRecents(drive)
  const { fetchTrashed, trashedDocumentItems, isTrashLoading } = useTrashed(drive)

  useEffect(
    function loadData() {
      if (isTrashRoute) {
        void fetchTrashed()
      } else {
        void updateRecentDocuments()
      }
    },
    [fetchTrashed, isTrashRoute, updateRecentDocuments],
  )

  const state = useMemo(() => {
    if (isTrashRoute) {
      return buildTrashState(trashedDocumentItems, isTrashLoading)
    } else if (search && search.length > 0) {
      return buildSearchState(search, isRecentsUpdating, recentDocuments, type)
    } else {
      return buildRecentsState(recentDocuments, isRecentsUpdating, recentsSort, contactEmails, type)
    }
    // TODO (future MRs) might still miss some cases from HomepageViewState
  }, [
    contactEmails,
    isRecentsUpdating,
    isTrashLoading,
    isTrashRoute,
    recentDocuments,
    recentsSort,
    search,
    trashedDocumentItems,
    type,
  ])

  const value = useMemo(
    (): HomepageViewValue => ({
      state,
      setRecentsSort,
      setSearch,
      updateRecentDocuments,
      updateRenamedDocumentInCache,
      isRecentsUpdating,
      type,
    }),
    [state, setRecentsSort, setSearch, updateRecentDocuments, updateRenamedDocumentInCache, isRecentsUpdating, type],
  )

  return <HomepageViewContext.Provider value={value}>{children}</HomepageViewContext.Provider>
}

function buildRecentsState(
  recentDocuments: RecentDocumentsItemValue[] | undefined,
  isRecentsUpdating: boolean,
  recentsSort: RecentsSort,
  contactEmails: ContactEmail[] | undefined,
  type: ProtonDocumentType | undefined,
): HomepageViewState {
  if (isRecentsUpdating) {
    return { view: 'recents-loading' }
  }

  const recentItems = recentDocuments?.map(RecentDocumentsItem.create) ?? []

  const filtered = filterDocuments(recentItems, undefined, type)
  if (filtered.length === 0) {
    return { view: 'recents-empty' }
  }

  let itemSections: ItemsSection[]
  if (recentsSort === 'viewed') {
    itemSections = splitIntoSectionsByTime(filtered, 'lastViewed')
  } else if (recentsSort === 'owner') {
    itemSections = splitIntoSectionsByOwner(filtered, contactEmails)
  } else if (recentsSort === 'location') {
    itemSections = splitIntoSectionsByLocation(filtered)
  } else {
    itemSections = splitIntoSectionsByName(filtered)
  }
  return { view: 'recents', itemSections, sort: recentsSort }
}

function buildTrashState(trashedDocumentItems: RecentDocumentsItemValue[], isTrashLoading: boolean): HomepageViewState {
  if (isTrashLoading) {
    return { view: 'trash-loading' }
  }

  if (trashedDocumentItems.length === 0) {
    return { view: 'trash-empty' }
  }
  const items = trashedDocumentItems.map((item) => RecentDocumentsItem.create(item))
  return {
    view: 'trash',
    itemSections: splitIntoSectionsByName(items),
  }
}

function buildSearchState(
  search: string,
  isRecentsUpdating: boolean,
  recentDocuments: RecentDocumentsItemValue[] | undefined,
  type: ProtonDocumentType | undefined,
): HomepageViewState {
  if (isRecentsUpdating) {
    return { view: 'search-loading', query: search }
  }

  const recentItems = recentDocuments?.map(RecentDocumentsItem.create) ?? []

  const filtered = filterDocuments(recentItems, search, type)
  if (filtered.length === 0) {
    return { view: 'search-empty', query: search }
  }
  return {
    view: 'search',
    itemSections: splitIntoSectionsByName(filtered, { isSearchResults: true }),
    query: search,
  }
}
