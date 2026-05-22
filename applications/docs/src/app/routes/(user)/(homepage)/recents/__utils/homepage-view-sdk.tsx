import { RecentDocumentsItem } from '@proton/docs-core'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import { getDrive, type ProtonDriveClient } from '@proton/drive'
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks'
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import type { LoggerInterface } from '@proton/utils/logs'
import type { DriveListener, EventSubscription } from '@protontech/drive-sdk'
import { useEffect, useMemo } from 'react'
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

const subscribeToEvents = manageEventsSubscription()

export function HomepageViewProviderSDK({ children }: HomepageViewProviderProps) {
  const drive = getDrive()

  const { logger } = useApplication()

  const [search, setSearch] = useSearch()
  const [recentsSort, setRecentsSort] = useRecentsSort()
  const [contactEmails] = useContactEmails()
  const [type] = useType()

  const isTrashRoute = Boolean(useRouteMatch(HOMEPAGE_TRASH_PATH))

  const {
    recentDocuments,
    isRecentsUpdating,
    updateRecentDocuments,
    updateRenamedDocumentInCache,
    handleEvent: handleEventRecents,
  } = useRecents(drive)
  const { fetchTrashed, trashedDocumentItems, isTrashLoading, handleEvent: handleEventTrashed } = useTrashed(drive)

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

  useEffect(
    () => subscribeToEvents(drive, logger, handleEventRecents, handleEventTrashed),
    [drive, handleEventRecents, handleEventTrashed, logger],
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
  recentDocuments: RecentDocumentsItemValue[],
  isRecentsUpdating: boolean,
  recentsSort: RecentsSort,
  contactEmails: ContactEmail[] | undefined,
  type: ProtonDocumentType | undefined,
): HomepageViewState {
  if (isRecentsUpdating) {
    return { view: 'recents-loading' }
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

function manageEventsSubscription() {
  let subscription: EventSubscription | undefined

  function dispose() {
    if (subscription) {
      subscription.dispose()
      subscription = undefined
    }
  }

  return function subscribe(
    drive: ProtonDriveClient,
    logger: LoggerInterface,
    recentsListener: DriveListener,
    trashedListener: DriveListener,
  ) {
    // In case useEffect calls cleanup (onUnmount) this should prevent multiple subscriptions
    let shouldAbort = false

    drive
      .getMyFilesRootFolder()
      .then(async (maybeMyFiles) => {
        if (shouldAbort) {
          return
        }

        const myFiles = maybeMyFiles.ok ? maybeMyFiles.value : maybeMyFiles.error
        const newSubscription = await drive.subscribeToTreeEvents(myFiles.treeEventScopeId, async (event) => {
          try {
            await recentsListener(event)
            await trashedListener(event)
          } catch (error: any) {
            logger.error('Failed to handle SDK event', error)
          }
        })

        if (shouldAbort) {
          newSubscription.dispose()
        } else {
          subscription = newSubscription
        }
      })
      .catch((error) => logger.error('Failed to subscribe to SDK events', error))

    return function onUnmount() {
      shouldAbort = true
      dispose()
    }
  }
}
