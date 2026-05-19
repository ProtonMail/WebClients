import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNotifications } from '@proton/components'
import { c } from 'ttag'
import {
  HomepageViewContext,
  type RecentsSort,
  type HomepageViewProviderProps,
  type HomepageViewValue,
  type HomepageViewState,
  type ItemsSection,
  filterDocuments,
  splitIntoSectionsByName,
  splitIntoSectionsByOwner,
  splitIntoSectionsByLocation,
  splitIntoSectionsByTime,
  useSearch,
  useRecentsSort,
  useType,
} from './homepage-view'
import { getDrive, generateNodeUid, type ProtonDriveClient } from '@proton/drive'
import { useApplication } from '~/utils/application-context'
import { useUser } from '@proton/account/user/hooks'
import { getNodeAncestry } from '~/utils/drive-sdk'
import { createItemValue } from './create-document-items'
import { RecentDocumentsItem } from '@proton/docs-core'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'

export function HomepageViewProviderSDK({ children }: HomepageViewProviderProps) {
  const [user] = useUser()

  const app = useApplication()
  const { docsApi, logger } = app
  const { createNotification } = useNotifications()

  const drive = getDrive()

  const [search, setSearch] = useSearch()
  const [recentDocuments, setRecentDocuments] = useState<RecentDocumentsItemValue[]>()
  const [isRecentsUpdating, setIsRecentsUpdating] = useState(false)
  const [recentsSort, setRecentsSort] = useRecentsSort()
  const [contactEmails] = useContactEmails()
  const [type] = useType()

  const fetchRecents = useMemo(
    () => async () => {
      setIsRecentsUpdating(true)

      const response = await docsApi.fetchRecentDocuments()
      const responseValue = response.getValue()

      const documents = []
      for (const document of responseValue.RecentDocuments) {
        try {
          const maybeNode = await drive.getNode(generateNodeUid(document.VolumeID, document.LinkID))
          const node = maybeNode.ok ? maybeNode.value : maybeNode.error
          const isSharedWithMe = await isSharedWithCurrentUser(drive, user, node.uid)
          const path = await getFullPath(drive, node.uid)
          documents.push({ sdkData: node, apiData: document, isSharedWithMe, path })
        } catch (error: any) {
          logger.error('Failed to load document with SDK', error)
          createNotification({
            type: 'error',
            text: c('Error').t`Failed to load document details`,
          })
        }
      }
      setIsRecentsUpdating(false)
      return documents
    },
    [docsApi, drive, user, logger, createNotification],
  )

  const updateRecentDocuments = useCallback(() => {
    return fetchRecents()
      .then((documents) => {
        setRecentDocuments(() => documents.map(createItemValue))
      })
      .catch((error) => {
        setIsRecentsUpdating(false)
        logger.error('Failed to load recent documents', error)
        createNotification({
          type: 'error',
          text: c('Error').t`Failed to load recent documents`,
        })
      })
  }, [fetchRecents, logger, createNotification])

  const updateRenamedDocumentInCache = useCallback((uniqueId: string, name: string) => {
    setRecentDocuments((currentDocuments) => {
      if (!currentDocuments) {
        return
      }

      const updatedDocuments = [...currentDocuments]
      // In the future we should compare nodeUid here and get rid of nodeMetaUniqueId utility (can't use it here)
      const updateIndex = updatedDocuments.findIndex((item) => {
        return `${item.volumeId}-${item.linkId}` === uniqueId
      })
      if (updateIndex !== -1) {
        updatedDocuments[updateIndex] = { ...updatedDocuments[updateIndex], name }
      }
      return updatedDocuments
    })
    return Promise.resolve() // For backwards compatibility
  }, [])

  useEffect(
    function loadInitialData() {
      void updateRecentDocuments()
    },
    [updateRecentDocuments],
  )

  const value = useMemo(
    (): HomepageViewValue => ({
      state: buildState(recentDocuments, isRecentsUpdating, search, recentsSort, contactEmails, type),
      setRecentsSort,
      setSearch,
      updateRecentDocuments,
      updateRenamedDocumentInCache,
      isRecentsUpdating,
      type,
    }),
    [
      recentDocuments,
      isRecentsUpdating,
      search,
      recentsSort,
      contactEmails,
      type,
      setRecentsSort,
      setSearch,
      updateRecentDocuments,
      updateRenamedDocumentInCache,
    ],
  )

  return <HomepageViewContext.Provider value={value}>{children}</HomepageViewContext.Provider>
}

function buildState(
  recentDocuments: RecentDocumentsItemValue[] | undefined,
  isRecentsUpdating: boolean,
  search: string | undefined,
  recentsSort: RecentsSort,
  contactEmails: ContactEmail[] | undefined,
  type: ProtonDocumentType | undefined,
): HomepageViewState {
  const items = recentDocuments?.map(RecentDocumentsItem.create) ?? []

  if (search && search.length > 0) {
    if (isRecentsUpdating) {
      return { view: 'search-loading', query: search }
    }
    const filtered = filterDocuments(items, search, type)
    if (filtered.length === 0) {
      return { view: 'search-empty', query: search }
    }
    return {
      view: 'search',
      itemSections: splitIntoSectionsByName(filtered, { isSearchResults: true }),
      query: search,
    }
  }

  if (isRecentsUpdating) {
    return { view: 'recents-loading' }
  }

  const filtered = filterDocuments(items, undefined, type)
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

async function isSharedWithCurrentUser(drive: ProtonDriveClient, user: any, nodeUid: string) {
  const sharingInfo = await drive.getSharingInfo(nodeUid)
  const currentUserSharingMembership = sharingInfo?.members.find((member) => {
    return member.inviteeEmail === user.Email
  })
  return !!currentUserSharingMembership
}

async function getFullPath(drive: ProtonDriveClient, nodeUid: string) {
  const pathElements: string[] = []

  const ancestry = await getNodeAncestry(drive, nodeUid, false)
  const [_root, ...children] = ancestry
  for (const ancestor of children) {
    if (ancestor.ok) {
      pathElements.push(ancestor.value.name)
    }
  }

  return pathElements
}
