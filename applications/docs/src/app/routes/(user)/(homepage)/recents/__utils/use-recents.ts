import { useUser } from '@proton/account/user/hooks'
import { useNotifications } from '@proton/components'
import { generateNodeUid, getDrive } from '@proton/drive'
import { mimeTypeToProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { DegradedNode, DriveEvent, DriveListener, NodeEntity, ProtonDriveClient } from '@protontech/drive-sdk'
import { NodeType } from '@protontech/drive-sdk'
import { useCallback, useState } from 'react'
import { c } from 'ttag'
import { useApplication } from '~/utils/application-context'
import { extractNodeUid, getFullPath, isSharedWithUser } from '~/utils/drive-sdk'
import { createItemValue, nodeToRecentItemValue } from './create-document-items'
import { useRecentsStore } from './use-recents-store'

export function useRecents(drive: ProtonDriveClient) {
  const [user] = useUser()

  const app = useApplication()
  const { docsApi, logger } = app
  const { createNotification } = useNotifications()

  const recentDocuments = useRecentsStore((state) => state.recentDocuments)
  const recentDocumentsInitialized = useRecentsStore((state) => state.recentDocumentsInitialized)

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
        const isSharedWithMe = await isSharedWithUser(drive, user, node.uid)
        const { path, ancestry } = await getFullPath(drive, node.uid)
        const ancestorsNodeUids = ancestry.map(extractNodeUid)
        documents.push({ sdkData: node, apiData: document, isSharedWithMe, path, ancestorsNodeUids })
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
          const { setRecentDocuments, setInitialized } = useRecentsStore.getState()
          setRecentDocuments(documents.map(createItemValue))
          setInitialized()
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
    const { recentDocuments, setDocument } = useRecentsStore.getState()

    const document = Object.values(recentDocuments).find((item) => {
      return `${item.volumeId}-${item.linkId}` === uniqueId
    })
    if (document) {
      setDocument({ ...document, name })
    }

    return Promise.resolve() // For backwards compatibility
  }, [])

  const recentsListener: DriveListener = useCallback(
    async (event: DriveEvent) => {
      const drive = getDrive()
      const { setDocument, removeChildrenOf, removeDocument } = useRecentsStore.getState()

      if (event.type === 'node_created') {
        const maybeNode = await drive.getNode(event.nodeUid)
        const node = maybeNode.ok ? maybeNode.value : maybeNode.error
        if (mimeTypeToProtonDocumentType(node.mediaType)) {
          setDocument(await buildDocument(drive, user, node))
        }
      }

      if (event.type === 'node_updated') {
        const maybeNode = await drive.getNode(event.nodeUid)
        const node = maybeNode.ok ? maybeNode.value : maybeNode.error

        if (event.isTrashed) {
          if (node.type === NodeType.Folder) {
            removeChildrenOf(node.uid)
          } else {
            removeDocument(node.uid)
          }
        } else {
          if (mimeTypeToProtonDocumentType(node.mediaType)) {
            setDocument(await buildDocument(drive, user, node))
          } else if (node.type === NodeType.Folder) {
            const childrenOfUpdatedFolder = []
            const { recentDocuments } = useRecentsStore.getState()
            for (const documentNodeUid in recentDocuments) {
              if (recentDocuments[documentNodeUid].ancestorsNodeUids?.includes(node.uid)) {
                childrenOfUpdatedFolder.push(recentDocuments[documentNodeUid])
              }
            }
            // In case we have children of the updated folder we'll only reload existing nodes
            if (childrenOfUpdatedFolder.length > 0) {
              for (const document of childrenOfUpdatedFolder) {
                setDocument(await reloadDocument(drive, document, user))
              }
            } else {
              // This is probably a folder restored from trash - reload everything
              const documentNodesOfUpdatedFolder = await getAllDocumentsRecursively(drive, node.uid)
              for (const documentNode of documentNodesOfUpdatedFolder) {
                setDocument(await buildDocument(drive, user, documentNode))
              }
            }
          }
        }
      }

      if (event.type === 'node_deleted') {
        removeDocument(event.nodeUid)
      }
    },
    [user],
  )

  return {
    updateRecentDocuments,
    updateRenamedDocumentInCache,
    recentDocuments: Object.values(recentDocuments),
    recentDocumentsInitialized,
    isRecentsUpdating,
    recentsListener,
  }
}

async function reloadDocument(
  drive: ProtonDriveClient,
  document: { volumeId: string; linkId: string },
  user: { Email: string },
) {
  const maybeDocument = await drive.getNode(generateNodeUid(document.volumeId, document.linkId))
  const documentNode = maybeDocument.ok ? maybeDocument.value : maybeDocument.error
  const freshDocument = await buildDocument(drive, user, documentNode)
  return freshDocument
}

async function buildDocument(
  drive: ProtonDriveClient,
  user: { Email: string },
  documentNode: NodeEntity | DegradedNode,
) {
  const { isSharedWithMe, path, shareId, ancestorsNodeUids } = await getDocumentDetails(drive, user, documentNode.uid)
  return nodeToRecentItemValue(documentNode, isSharedWithMe, path, ancestorsNodeUids, shareId)
}

async function getDocumentDetails(drive: ProtonDriveClient, user: { Email: string }, nodeUid: string) {
  const isSharedWithMe = await isSharedWithUser(drive, user, nodeUid)
  const { path, ancestry } = await getFullPath(drive, nodeUid)
  const shareId = ancestry[0].ok ? ancestry[0].value.deprecatedShareId : ancestry[0].error.deprecatedShareId
  const ancestorsNodeUids = ancestry.map(extractNodeUid)
  return { isSharedWithMe, shareId, path, ancestry, ancestorsNodeUids }
}

async function getAllDocumentsRecursively(drive: ProtonDriveClient, startFolderUid: string) {
  const documents: (NodeEntity | DegradedNode)[] = []

  for await (const maybeNode of drive.iterateFolderChildren(startFolderUid)) {
    const node = maybeNode.ok ? maybeNode.value : maybeNode.error
    if (mimeTypeToProtonDocumentType(node.mediaType)) {
      documents.push(node)
    } else if (node.type === NodeType.Folder) {
      const children = await getAllDocumentsRecursively(drive, node.uid)
      documents.push(...children)
    }
  }

  return documents
}
