import { useUser } from '@proton/account/user/hooks'
import { useNotifications } from '@proton/components'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import { generateNodeUid, getDrive } from '@proton/drive'
import { mimeTypeToProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { DegradedNode, DriveEvent, NodeEntity, ProtonDriveClient } from '@protontech/drive-sdk'
import { useCallback, useState } from 'react'
import { c } from 'ttag'
import { useApplication } from '~/utils/application-context'
import { getNodeAncestry } from '~/utils/drive-sdk'
import { createItemValue, nodeToRecentItemValue } from './create-document-items'

export function useRecents(drive: ProtonDriveClient) {
  const [user] = useUser()

  const app = useApplication()
  const { docsApi, logger } = app
  const { createNotification } = useNotifications()

  const [recentDocuments, setRecentDocuments] = useState<RecentDocumentsItemValue[]>([])
  const [isRecentsUpdating, setIsRecentsUpdating] = useState(false)

  const fetchRecents = useCallback(async () => {
    setIsRecentsUpdating(true)

    const response = await docsApi.fetchRecentDocuments()
    const responseValue = response.getValue()

    const documents = []
    for (const document of responseValue.RecentDocuments) {
      try {
        const maybeNode = await drive.getNode(generateNodeUid(document.VolumeID, document.LinkID))
        const node = maybeNode.ok ? maybeNode.value : maybeNode.error
        const isSharedWithMe = await isSharedWithCurrentUser(drive, user, node.uid)
        const { path } = await getFullPath(drive, node.uid)
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
  }, [docsApi, drive, user, logger, createNotification])

  const updateRecentDocuments = useCallback(
    () =>
      fetchRecents()
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
        }),
    [fetchRecents, logger, createNotification],
  )

  const updateRenamedDocumentInCache = useCallback((uniqueId: string, name: string) => {
    setRecentDocuments((currentDocuments) => {
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

  const handleEvent = useCallback(
    async (event: DriveEvent) => {
      const drive = getDrive()

      if (event.type === 'node_updated' || event.type === 'node_created') {
        if (event.isTrashed) {
          setRecentDocuments((items) => removeMissingItems(items, event))
        } else {
          const maybeNode = await drive.getNode(event.nodeUid)
          const node = maybeNode.ok ? maybeNode.value : maybeNode.error
          if (!mimeTypeToProtonDocumentType(node.mediaType)) {
            return
          }

          const isSharedWithMe = await isSharedWithCurrentUser(drive, user, node.uid)
          const { path, ancestry } = await getFullPath(drive, node.uid)
          const shareId = ancestry[0].ok ? ancestry[0].value.deprecatedShareId : ancestry[0].error.deprecatedShareId
          setRecentDocuments((items) => createOrUpdateItem(items, { node, isSharedWithMe, path, shareId }))
        }
      }

      if (event.type === 'node_deleted') {
        setRecentDocuments((items) => removeMissingItems(items, event))
      }
    },
    [user],
  )

  return { updateRecentDocuments, updateRenamedDocumentInCache, recentDocuments, isRecentsUpdating, handleEvent }
}

async function isSharedWithCurrentUser(drive: ProtonDriveClient, user: any, nodeUid: string) {
  const sharingInfo = await drive.getSharingInfo(nodeUid)
  const currentUserSharingMembership = sharingInfo?.members.find((member) => {
    return member.inviteeEmail === user.Email
  })
  return !!currentUserSharingMembership
}

async function getFullPath(drive: ProtonDriveClient, nodeUid: string) {
  const path: string[] = []

  const ancestry = await getNodeAncestry(drive, nodeUid, false)
  const [_root, ...children] = ancestry
  for (const ancestor of children) {
    if (ancestor.ok) {
      path.push(ancestor.value.name)
    }
  }

  return { path, ancestry }
}

function createOrUpdateItem(
  previousItems: RecentDocumentsItemValue[],
  itemDetails: { node: NodeEntity | DegradedNode; isSharedWithMe: boolean; path: string[]; shareId?: string },
) {
  const { node, isSharedWithMe, path, shareId } = itemDetails
  const existingItemIndex = previousItems.findIndex((item) => node.uid === generateNodeUid(item.volumeId, item.linkId))
  if (existingItemIndex >= 0) {
    const updatedItems = [...previousItems]
    updatedItems[existingItemIndex] = nodeToRecentItemValue(node, isSharedWithMe, path, shareId)
    return updatedItems
  } else {
    return [...previousItems, nodeToRecentItemValue(node, isSharedWithMe, path, shareId)]
  }
}

function removeMissingItems(previousItems: RecentDocumentsItemValue[], event: { nodeUid: string }) {
  return previousItems.filter((item) => event.nodeUid !== generateNodeUid(item.volumeId, item.linkId))
}
