import { useUser } from '@proton/account/user/hooks'
import { useAuthentication } from '@proton/components'
import { useContactEmails } from '@proton/components/hooks'
import {
  DateFormatter,
  type RecentDocumentServiceState,
  type RecentDocumentsSnapshot,
  type RecentDocumentsSnapshotData,
  RecentDocumentStateUpdatedEvent,
} from '@proton/docs-core'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import type { UserModel } from '@proton/shared/lib/interfaces'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
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

export const getDisplayName = (
  recentDocument: RecentDocumentsSnapshotData,
  user: UserModel,
  contactEmails?: ContactEmail[],
) => {
  if (!recentDocument.isSharedWithMe) {
    return user.DisplayName ? user.DisplayName : user.Email
  }

  const foundContact = contactEmails?.find((contactEmail) => contactEmail.Email)

  if (foundContact) {
    return foundContact.Name ? foundContact.Name : foundContact.Email
  }

  return recentDocument.createdBy
}

export const useRecentDocumentsValue = ({ searchText, filter }: { searchText?: string; filter?: string }) => {
  const application = useApplication()
  const [state, setState] = useState<RecentDocumentsSnapshot>(application.recentDocumentsService.getSnapshot())
  const [filteredItems, setFilteredItems] = useState<RecentDocumentsSnapshotData[]>([])
  const [user] = useUser()
  const [contactEmails] = useContactEmails()

  useEffect(() => {
    return application.eventBus.addEventCallback((newState: RecentDocumentServiceState) => {
      const snapshot = application.recentDocumentsService.getSnapshot()
      if (!snapshot) {
        return
      }
      setState(snapshot)
    }, RecentDocumentStateUpdatedEvent)
  }, [application])

  useEffect(() => {
    setFilteredItems(filterItems(state.data, searchText, filter))
  }, [searchText, filter, state.data])

  useEffect(() => {
    void application.recentDocumentsService.fetch()
  }, [])

  const { getLocalID } = useAuthentication()

  const handleOpenDocument = (recentDocument: RecentDocumentsSnapshotData) => {
    window.open(`/doc?mode=open&volumeId=${recentDocument.volumeId}&linkId=${recentDocument.linkId}`, '_blank')
  }

  const handleOpenFolder = (recentDocument: RecentDocumentsSnapshotData) => {
    const to = `/${recentDocument.volumeId}/folder/${recentDocument.parentLinkId}`
    const target = '_blank'
    window.open(getAppHref(to, APPS.PROTONDRIVE, getLocalID()), target)
  }

  return {
    state,
    items: filteredItems,
    handleTrashDocument: (recentDocument: RecentDocumentsSnapshotData) => {
      void application.recentDocumentsService.trashDocument(recentDocument)
    },
    handleOpenDocument,
    handleOpenFolder,
    getDisplayName: (recentDocument: RecentDocumentsSnapshotData): string | undefined =>
      getDisplayName(recentDocument, user, contactEmails),
    getDisplayDate: (recentDocument: RecentDocumentsSnapshotData): string => {
      return dateFormatter.formatDate(recentDocument.lastViewed)
    },
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
