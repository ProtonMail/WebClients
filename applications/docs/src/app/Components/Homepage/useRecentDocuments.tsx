import { c } from 'ttag'
import { useAuthentication } from '@proton/components'
import { useContactEmails } from '@proton/mail/contactEmails/hooks'
import { DateFormatter } from '@proton/docs-core'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { useApplication } from '../../Containers/ApplicationProvider'
import type { RecentDocumentItem } from '@proton/docs-core/lib/Services/RecentDocuments/RecentDocumentItem'

const dateFormatter = new DateFormatter()

const filterItem = (item: RecentDocumentItem, filter?: string) => {
  if (filter === 'owned-by-me') {
    return !item.isSharedWithMe
  }

  if (filter === 'owned-by-others') {
    return item.isSharedWithMe
  }

  return true
}

export const filterItems = (items?: RecentDocumentItem[], searchText?: string, filter?: string) => {
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

export const getDisplayName = (recentDocument: RecentDocumentItem, contactEmails?: ContactEmail[]) => {
  if (!recentDocument.isSharedWithMe) {
    return c('Info').t`Me`
  }

  if (!recentDocument.createdBy) {
    return undefined
  }

  const foundContact = contactEmails?.find((contactEmail) => contactEmail.Email === recentDocument.createdBy)

  if (foundContact) {
    return foundContact.Name ?? foundContact.Email
  }

  return recentDocument.createdBy
}

export const useRecentDocumentsValue = ({ searchText, filter }: { searchText?: string; filter?: string }) => {
  const application = useApplication()
  const state = application.recentDocumentsService.state
  const [recents, setRecents] = useState<RecentDocumentItem[]>([])
  const [filteredItems, setFilteredItems] = useState<RecentDocumentItem[]>([])
  const [contactEmails] = useContactEmails()
  const { getLocalID } = useAuthentication()

  useEffect(() => {
    return state.subscribeToProperty('recents', (recents) => {
      setRecents(recents)
    })
  }, [application, state])

  useEffect(() => {
    setFilteredItems(filterItems(recents, searchText, filter))
  }, [searchText, filter, recents])

  useEffect(() => {
    void application.recentDocumentsService.fetch()
  }, [application.recentDocumentsService])

  const handleOpenDocument = useCallback(
    (recentDocument: RecentDocumentItem) => {
      const to = `/doc?mode=open&volumeId=${recentDocument.volumeId}&linkId=${recentDocument.linkId}`
      window.open(getAppHref(to, APPS.PROTONDOCS, getLocalID()))
    },
    [getLocalID],
  )

  const handleOpenFolder = useCallback(
    (recentDocument: RecentDocumentItem) => {
      const to = `/${recentDocument.volumeId}/folder/${recentDocument.parentLinkId}`
      window.open(getAppHref(to, APPS.PROTONDRIVE, getLocalID()))
    },
    [getLocalID],
  )

  const handleTrashDocument = useCallback(
    (recentDocument: RecentDocumentItem) => {
      void application.recentDocumentsService.trashDocument(recentDocument)
    },
    [application.recentDocumentsService],
  )

  const getDisplayNameForRecentDocument = useCallback(
    (recentDocument: RecentDocumentItem): string | undefined => getDisplayName(recentDocument, contactEmails),
    [contactEmails],
  )

  const getDisplayDateForRecentDocument = useCallback(
    (recentDocument: RecentDocumentItem): string => dateFormatter.formatDate(recentDocument.lastViewed.date),
    [],
  )

  return {
    status: state.getProperty('state'),
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
