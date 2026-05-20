import { useUser } from '@proton/account/user/hooks'
import { useNotifications } from '@proton/components'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import { generateNodeUid } from '@proton/drive'
import type { ProtonDriveClient } from '@protontech/drive-sdk'
import { useCallback, useMemo, useState } from 'react'
import { c } from 'ttag'
import { useApplication } from '~/utils/application-context'
import { getNodeAncestry } from '~/utils/drive-sdk'
import { createItemValue } from './create-document-items'

export function useRecents(drive: ProtonDriveClient) {
  const [user] = useUser()

  const app = useApplication()
  const { docsApi, logger } = app
  const { createNotification } = useNotifications()

  const [recentDocuments, setRecentDocuments] = useState<RecentDocumentsItemValue[]>()
  const [isRecentsUpdating, setIsRecentsUpdating] = useState(false)

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

  return { updateRecentDocuments, updateRenamedDocumentInCache, recentDocuments, isRecentsUpdating }
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
