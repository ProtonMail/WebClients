import { useAuthentication } from '@proton/components'
import { type RecentDocumentsItem } from '@proton/docs-core'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { useApplication } from '~/utils/application-context'
import { useSubscribe } from '~/utils/misc'

// filter documents
// ----------------

function applyFilter(item: RecentDocumentsItem, filter?: string) {
  if (filter === 'owned-by-me') {
    return !item.isSharedWithMe
  }

  if (filter === 'owned-by-others') {
    return item.isSharedWithMe
  }

  return true
}

export function filterDocuments(items?: RecentDocumentsItem[], searchText?: string, filter?: string) {
  if (!items || items.length === 0 || !(searchText || filter)) {
    return items || []
  }

  let outputItems = items

  if (searchText) {
    outputItems = outputItems.filter((data) => data.name.toLowerCase().includes(searchText.toLowerCase()))
  }

  if (filter) {
    outputItems = outputItems.filter((item) => applyFilter(item, filter))
  }

  return outputItems
}

// recent documents value
// ----------------------

export function useRecentDocumentsValue({ searchText, filter }: { searchText?: string; filter?: string }) {
  const application = useApplication()
  const state = application.recentDocumentsService.state
  const [filteredItems, setFilteredItems] = useState<RecentDocumentsItem[]>([])
  const { getLocalID } = useAuthentication()

  const recents = useSubscribe(state, 'recents', [])

  useEffect(() => {
    setFilteredItems(filterDocuments(recents, searchText, filter))
  }, [searchText, filter, recents])

  useEffect(() => {
    void application.recentDocumentsService.fetch()
  }, [application.recentDocumentsService])

  const handleOpenDocument = useCallback(
    ({ volumeId, linkId }: RecentDocumentsItem) => {
      const to = `/doc?mode=open&volumeId=${volumeId}&linkId=${linkId}`
      window.open(getAppHref(to, APPS.PROTONDOCS, getLocalID()))
    },
    [getLocalID],
  )

  const handleOpenFolder = useCallback(
    ({ parentLinkId, shareId, isSharedWithMe }: RecentDocumentsItem) => {
      let to = '/'
      if (parentLinkId) {
        to = `/${shareId}/folder/${parentLinkId}`
      }
      if (isSharedWithMe) {
        to = `/shared-with-me`
      }
      window.open(getAppHref(to, APPS.PROTONDRIVE, getLocalID()))
    },
    [getLocalID],
  )

  const handleTrashDocument = useCallback(
    (recentDocument: RecentDocumentsItem) => {
      void application.recentDocumentsService.trashDocument(recentDocument)
    },
    [application.recentDocumentsService],
  )

  return {
    state: state.getProperty('state'),
    items: filteredItems,
    handleTrashDocument,
    handleOpenDocument,
    handleOpenFolder,
  }
}

// recent documents context
// ------------------------

export const RecentDocumentsContext = createContext<ReturnType<typeof useRecentDocumentsValue> | null>(null)

export type RecentDocumentsProviderProps = {
  children: ReactNode
  searchText?: string
  filter?: string
}

export function RecentDocumentsProvider({ children, searchText, filter }: RecentDocumentsProviderProps) {
  return (
    <RecentDocumentsContext.Provider value={useRecentDocumentsValue({ searchText, filter })}>
      {children}
    </RecentDocumentsContext.Provider>
  )
}

export function useRecentDocuments() {
  const context = useContext(RecentDocumentsContext)
  if (!context) {
    throw new Error('Missing RecentDocuments context')
  }
  return context
}
