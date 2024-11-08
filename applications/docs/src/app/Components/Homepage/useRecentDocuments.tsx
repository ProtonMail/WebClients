import { c } from 'ttag'
import { useAuthentication } from '@proton/components'
import { useContactEmails } from '@proton/mail/contactEmails/hooks'
import {
  DateFormatter,
  type RecentDocumentServiceState,
  type RecentDocumentsSnapshotData,
  RecentDocumentStateUpdatedEvent,
} from '@proton/docs-core'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { useApplication } from '../../Containers/ApplicationProvider'

const dateFormatter = new DateFormatter()

const filterItem = (item: RecentDocumentsSnapshotData, filter?: string) => {
  if (filter === 'owned-by-me') {
    return !item.isSharedWithMe
  }

  if (filter === 'owned-by-others') {
    return item.isSharedWithMe
  }

  return true
}

export const filterItems = (items?: RecentDocumentsSnapshotData[], searchText?: string, filter?: string) => {
  if (!items || items.length === 0 || !(searchText || filter)) {
    return items || []
  }

  let newFilteredItems = items

  if (searchText) {
    newFilteredItems = newFilteredItems.filter((data) => data.name.toLowerCase().includes(searchText.toLowerCase()))
  }

  if (filter) {
    newFilteredItems = newFilteredItems.filter((item) => filterItem(item, filter))
  }

  return newFilteredItems
}

export const getDisplayName = (recentDocument: RecentDocumentsSnapshotData, contactEmails?: ContactEmail[]) => {
  if (!recentDocument.isSharedWithMe) {
    return c('Info').t`Me`
  }

  const foundContact = contactEmails?.find((contactEmail) => contactEmail.Email)

  if (foundContact) {
    return foundContact.Name ? foundContact.Name : foundContact.Email
  }

  return recentDocument.createdBy
}

export const useRecentDocumentsValue = ({ searchText, filter }: { searchText?: string; filter?: string }) => {
  const application = useApplication()
  const [state, setState] = useState<RecentDocumentServiceState>(application.recentDocumentsService.state)
  const [resolvedItems, setResolvedItems] = useState<RecentDocumentsSnapshotData[]>([])
  const [filteredItems, setFilteredItems] = useState<RecentDocumentsSnapshotData[]>([])
  const [contactEmails] = useContactEmails()
  const { getLocalID } = useAuthentication()

  useEffect(() => {
    return application.eventBus.addEventCallback((_newState: RecentDocumentServiceState) => {
      const snapshot = application.recentDocumentsService.getSnapshot()
      setResolvedItems(snapshot.data)
      setFilteredItems(filterItems(snapshot.data, searchText, filter))
      setState(snapshot.state)
    }, RecentDocumentStateUpdatedEvent)
  }, [application, filter, searchText])

  useEffect(() => {
    setFilteredItems(filterItems(resolvedItems, searchText, filter))
  }, [searchText, filter, resolvedItems])

  useEffect(() => {
    void application.recentDocumentsService.fetch()
  }, [application.recentDocumentsService])

  const handleOpenDocument = useCallback(
    (recentDocument: RecentDocumentsSnapshotData) => {
      const to = `/doc?mode=open&volumeId=${recentDocument.volumeId}&linkId=${recentDocument.linkId}`
      window.open(getAppHref(to, APPS.PROTONDOCS, getLocalID()))
    },
    [getLocalID],
  )

  const handleOpenFolder = useCallback(
    (recentDocument: RecentDocumentsSnapshotData) => {
      const to = `/${recentDocument.volumeId}/folder/${recentDocument.parentLinkId}`
      window.open(getAppHref(to, APPS.PROTONDRIVE, getLocalID()))
    },
    [getLocalID],
  )

  const handleTrashDocument = useCallback(
    (recentDocument: RecentDocumentsSnapshotData) => {
      void application.recentDocumentsService.trashDocument(recentDocument)
    },
    [application.recentDocumentsService],
  )

  const getDisplayNameForRecentDocument = useCallback(
    (recentDocument: RecentDocumentsSnapshotData): string | undefined => getDisplayName(recentDocument, contactEmails),
    [contactEmails],
  )

  const getDisplayDateForRecentDocument = useCallback(
    (recentDocument: RecentDocumentsSnapshotData): string => dateFormatter.formatDate(recentDocument.lastViewed),
    [],
  )

  return {
    state,
    items: filteredItems,
    handleTrashDocument,
    handleOpenDocument,
    handleOpenFolder,
    getDisplayName: getDisplayNameForRecentDocument,
    getDisplayDate: getDisplayDateForRecentDocument,
    getLocalID,
  }
}

export const RecentDocumentsContext = createContext<ReturnType<typeof useRecentDocumentsValue> | null>(null)

export const RecentDocumentsProvider = ({
  children,
  searchText,
  filter,
}: {
  children: ReactNode
  searchText?: string
  filter?: string
}) => (
  <RecentDocumentsContext.Provider value={useRecentDocumentsValue({ searchText, filter })}>
    {children}
  </RecentDocumentsContext.Provider>
)

export const useRecentDocuments = () => {
  const context = useContext(RecentDocumentsContext)

  if (!context) {
    throw new Error('No provider for context')
  }

  return context
}
