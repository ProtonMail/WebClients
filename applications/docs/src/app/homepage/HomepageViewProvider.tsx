import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouteMatch } from 'react-router'
import { c } from 'ttag'

import { RecentDocumentsItem } from './recentDocumentsItem'
import type { RecentDocumentsItemValue } from './recentDocumentsItem'
import type { NodeEntity } from '@protontech/drive-sdk'
import { useContactEmails } from '@proton/account/contactEmails/hooks'
import type { ProtonDocumentType } from './utils/mimetype'
import type { OwnerContact } from './get-owner-name'
import { useAddresses } from '@proton/account/addresses/hooks'
import type { UserAddress } from './is-my-document'
import { traceError } from '@proton/shared/lib/helpers/sentry'

import {
  filterDocuments,
  splitIntoSectionsByLocation,
  splitIntoSectionsByName,
  splitIntoSectionsByOwner,
  splitIntoSectionsByTime,
  useRecentsSort,
  useSearch,
  useType,
  type HomepageViewProviderProps,
} from './homepageViewUtils'
import {
  HomepageViewContext,
  type HomepageViewState,
  type HomepageViewValue,
  type ItemsSection,
  type RecentsSort,
} from './homepageViewContext'
import { useRecents } from './useRecents'
import { useUnloadGuardedApi } from './docsApi/useUnloadGuardedApi'
import { useTrashed } from './useTrashed'

import { traceRecentsError } from './traceRecentsError'
import { HOMEPAGE_TRASH_PATH } from './homepage-paths'

export function HomepageViewProvider({
  children,
  drive,
  eventSubscriber,
  coreEventSubscriber,
  useDocInvites,
  api,
  logger,
  reportTelemetry,
  createNotification,
}: HomepageViewProviderProps) {
  const [search, setSearch] = useSearch()
  const [recentsSort, setRecentsSort] = useRecentsSort()
  const [contactEmails] = useContactEmails()
  const [addresses] = useAddresses()
  const [type] = useType()

  const guardedApi = useUnloadGuardedApi(api)
  const {
    recentDocuments,
    recentDocumentsInitialized,
    isRecentsUpdating,
    fetchRecentDocuments,
    updateRenamedDocumentInCache,
    removeDocument,
    recentsListener,
    updateMovedDocuments,
  } = useRecents({ drive, eventSubscriber, api: guardedApi, logger, createNotification })
  const { fetchTrashed, trashedDocumentItems, isTrashLoading, trashedListener } = useTrashed(drive, createNotification)

  const isTrashRoute = Boolean(useRouteMatch(HOMEPAGE_TRASH_PATH))

  const abortLoad = useRef<AbortController>()
  const loadData = useCallback(() => {
    abortLoad.current?.abort()
    abortLoad.current = new AbortController()

    if (isTrashRoute) {
      return fetchTrashed(abortLoad.current.signal)
    } else {
      return fetchRecentDocuments(abortLoad.current.signal)
    }
  }, [isTrashRoute, fetchTrashed, fetchRecentDocuments])

  // Will reload it each time we change between routes
  useEffect(() => {
    void loadData()
    return () => abortLoad.current?.abort()
  }, [loadData])

  // Shared documents can appear or disappear
  useEffect(() => {
    const reloadOnCoreEvent = () => loadData()
    const removeListener = coreEventSubscriber.addListener(reloadOnCoreEvent)
    return removeListener
  }, [loadData, coreEventSubscriber])

  // Loading it once here to avoid doing it every time we subscribe
  const [myFilesNode, setMyFilesNode] = useState<NodeEntity>()
  useEffect(() => {
    drive
      .getMyFilesRootFolder()
      .then((maybeMyFiles) => {
        setMyFilesNode(maybeMyFiles)
      })
      .catch((error) => {
        createNotification({
          type: 'error',
          text: c('Error').t`Failed to load 'My files' folder`,
        })
        traceRecentsError(traceError, error)
      })
  }, [createNotification, drive])

  useEffect(() => {
    // Do not subscribe if we don't have treeEventScopeId yet
    if (!myFilesNode) {
      return
    }

    void eventSubscriber
      .initialize(myFilesNode.treeEventScopeId, [recentsListener, trashedListener], removeDocument)
      .catch((error) => traceRecentsError(traceError, error))
    return () => eventSubscriber.reset()
  }, [recentsListener, trashedListener, myFilesNode, eventSubscriber, removeDocument])

  const state = useMemo((): HomepageViewState => {
    const documents = Object.values(recentDocuments) as RecentDocumentsItemValue[]
    try {
      if (isTrashRoute) {
        return buildTrashState(trashedDocumentItems, isTrashLoading)
      } else if (search && search.length > 0) {
        return buildSearchState(search, isRecentsUpdating, recentDocumentsInitialized, documents, type)
      } else {
        return buildRecentsState(
          documents,
          recentDocumentsInitialized,
          isRecentsUpdating,
          recentsSort,
          contactEmails,
          addresses,
          type,
        )
      }
    } catch (error) {
      traceRecentsError(traceError, error)
      return { view: 'unknown' }
    }
  }, [
    addresses,
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
      updateRecentDocuments: loadData,
      updateRenamedDocumentInCache,
      isRecentsUpdating,
      type,
      myFilesRootUid: myFilesNode?.uid,
      updateMovedDocuments,
      useDocInvites,
      reportTelemetry,
      logger,
      createNotification,
    }),
    [
      state,
      setRecentsSort,
      setSearch,
      loadData,
      updateRenamedDocumentInCache,
      isRecentsUpdating,
      type,
      myFilesNode,
      updateMovedDocuments,
      useDocInvites,
      reportTelemetry,
      logger,
      createNotification,
    ],
  )

  return <HomepageViewContext.Provider value={value}>{children}</HomepageViewContext.Provider>
}

export function buildRecentsState(
  recentDocuments: RecentDocumentsItemValue[],
  recentDocumentsInitialized: boolean,
  isRecentsUpdating: boolean,
  recentsSort: RecentsSort,
  contactEmails: OwnerContact[] | undefined,
  addresses: UserAddress[] | undefined,
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
    itemSections = splitIntoSectionsByOwner(filtered, addresses, contactEmails)
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
