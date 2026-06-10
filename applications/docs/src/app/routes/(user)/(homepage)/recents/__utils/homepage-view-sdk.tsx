import { RecentDocumentsItem } from '@proton/docs-core'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import type { DegradedNode, NodeEntity } from '@proton/drive'
import { getDrive } from '@proton/drive'
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks'
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import { useEffect, useMemo, useState } from 'react'
import { useRouteMatch } from 'react-router'
import { useApplication } from '~/utils/application-context'
import { HOMEPAGE_TRASH_PATH } from '../../../__components/AppContainer'
import {
  filterDocuments,
  HomepageViewContext,
  splitIntoSectionsByLocation,
  splitIntoSectionsByName,
  splitIntoSectionsByOwner,
  splitIntoSectionsByTime,
  useRecentsSort,
  useSearch,
  useType,
  type HomepageViewProviderProps,
  type HomepageViewState,
  type HomepageViewValue,
  type ItemsSection,
  type RecentsSort,
} from './homepage-view'
import { useRecents } from './use-recents'
import { useTrashed } from './use-trashed'
import { manageEventsSubscription } from './manage-events-subscription'
import { c } from 'ttag'
import useNotifications from '@proton/components/hooks/useNotifications'

const subscribeToEvents = manageEventsSubscription()

export function HomepageViewProviderSDK({ children }: HomepageViewProviderProps) {
  const drive = getDrive()

  const { logger } = useApplication()
  const { createNotification } = useNotifications()

  const [search, setSearch] = useSearch()
  const [recentsSort, setRecentsSort] = useRecentsSort()
  const [contactEmails] = useContactEmails()
  const [type] = useType()

  const isTrashRoute = Boolean(useRouteMatch(HOMEPAGE_TRASH_PATH))

  const {
    recentDocuments,
    recentDocumentsInitialized,
    isRecentsUpdating,
    updateRecentDocuments,
    updateRenamedDocumentInCache,
    recentsListener,
  } = useRecents(drive)
  const { fetchTrashed, trashedDocumentItems, isTrashLoading, trashedListener } = useTrashed(drive)

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

  // Loading it once here to avoid doing it every time we subscribe
  const [myFilesNode, setMyFilesNode] = useState<NodeEntity | DegradedNode>()
  useEffect(() => {
    drive
      .getMyFilesRootFolder()
      .then((maybeMyFiles) => {
        setMyFilesNode(maybeMyFiles.ok ? maybeMyFiles.value : maybeMyFiles.error)
      })
      .catch(() => {
        createNotification({
          type: 'error',
          text: c('Error').t`Failed to load 'My files' folder`,
        })
      })
  }, [createNotification, drive])

  useEffect(() => {
    // Do not subscribe if we don't have treeEventScopeId yet
    if (!myFilesNode) {
      return
    }
    return subscribeToEvents(drive, myFilesNode.treeEventScopeId, logger, recentsListener, trashedListener)
  }, [drive, recentsListener, trashedListener, logger, myFilesNode])

  const state = useMemo(() => {
    if (isTrashRoute) {
      return buildTrashState(trashedDocumentItems, isTrashLoading)
    } else if (search && search.length > 0) {
      return buildSearchState(
        search,
        isRecentsUpdating,
        recentDocumentsInitialized,
        Object.values(recentDocuments),
        type,
      )
    } else {
      return buildRecentsState(
        Object.values(recentDocuments),
        recentDocumentsInitialized,
        isRecentsUpdating,
        recentsSort,
        contactEmails,
        type,
      )
    }
  }, [
    contactEmails,
    isRecentsUpdating,
    isTrashLoading,
    isTrashRoute,
    recentDocuments,
    recentDocumentsInitialized,
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

export function buildRecentsState(
  recentDocuments: RecentDocumentsItemValue[],
  recentDocumentsInitialized: boolean,
  isRecentsUpdating: boolean,
  recentsSort: RecentsSort,
  contactEmails: ContactEmail[] | undefined,
  type: ProtonDocumentType | undefined,
): HomepageViewState {
  if (isRecentsUpdating) {
    return { view: 'recents-loading' }
  }

  if (!recentDocumentsInitialized) {
    return { view: 'recents-initial' }
  }

  const recentItems = recentDocuments.map(RecentDocumentsItem.create)

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

export function buildTrashState(
  trashedDocumentItems: RecentDocumentsItemValue[],
  isTrashLoading: boolean,
): HomepageViewState {
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

export function buildSearchState(
  query: string,
  isRecentsUpdating: boolean,
  recentDocumentsInitialized: boolean,
  recentDocuments: RecentDocumentsItemValue[],
  type: ProtonDocumentType | undefined,
): HomepageViewState {
  if (isRecentsUpdating) {
    return { view: 'search-loading', query }
  }

  if (!recentDocumentsInitialized) {
    return { view: 'search-initial', query }
  }

  const recentItems = recentDocuments?.map(RecentDocumentsItem.create) ?? []

  const filtered = filterDocuments(recentItems, query, type)
  if (filtered.length === 0) {
    return { view: 'search-empty', query }
  }
  return {
    view: 'search',
    itemSections: splitIntoSectionsByName(filtered, { isSearchResults: true }),
    query,
  }
}
