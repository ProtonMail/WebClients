import { useNotifications } from '@proton/components'
import { mimeTypeToProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import {
  type DriveEvent,
  type NodeEntity,
  type ProtonDriveClient,
  MemberRole,
  NodeType,
  generateNodeUid,
  getDrive,
} from '@proton/drive'
import { useCallback, useEffect, useState } from 'react'
import { c } from 'ttag'
import { useApplication } from '~/utils/application-context'
import { getFullPathFromAncestry, getIsSharedWithMe } from '~/drive-sdk'
import { createItemValue } from './create-document-items'
import { useRecentsStore } from './use-recents-store'
import { getRoleFromHierarchy } from '~/drive-sdk/get-role-from-hierarchy'
import { useAddresses } from '@proton/account/addresses/hooks'
import type { Address } from '@proton/shared/lib/interfaces/Address'
import type { SDKEventListener } from '~/drive-sdk/manage-events-subscription'
import type { RecentDocumentAPIItem } from '@proton/docs-core/lib/Api/Types/GetRecentsResponse'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import { traceError, SentryRealtimeInitiatives } from '@proton/shared/lib/helpers/sentry'

export function useRecents(drive: ProtonDriveClient) {
  const [addresses] = useAddresses()
  useEffect(() => {
    const { setAddresses } = useRecentsStore.getState()
    if (addresses) {
      setAddresses(addresses)
    }
  }, [addresses])

  const app = useApplication()
  const { docsApi } = app
  const { createNotification } = useNotifications()

  const recentDocuments = useRecentsStore((state) => state.recentDocuments)
  const recentDocumentsInitialized = useRecentsStore((state) => state.recentDocumentsInitialized)

  const [isRecentsUpdating, setIsRecentsUpdating] = useState(false)

  const fetchRecents = useCallback(async () => {
    setIsRecentsUpdating(true)

    const response = await docsApi.fetchRecentDocuments()
    const { RecentDocuments: documents } = response.getValue()

    // Gather nodes to load
    const uidsToLoad = new Set<string>()
    for (const document of documents) {
      uidsToLoad.add(generateNodeUid(document.VolumeID, document.LinkID))
      for (const ancestorLinkID of document.AncestorIDs) {
        uidsToLoad.add(generateNodeUid(document.VolumeID, ancestorLinkID))
      }
    }

    // Load all the nodes
    const nodesByUid = new Map<string, NodeEntity>()
    for await (const node of drive.iterateNodes([...uidsToLoad])) {
      // not a missing node
      if ('uid' in node) {
        nodesByUid.set(node.uid, node)
      }
    }

    setIsRecentsUpdating(false)

    return documents.map((document) => prepareDocumentData(nodesByUid, document, addresses))
  }, [addresses, docsApi, drive])

  const updateRecentDocuments = useCallback(
    () =>
      fetchRecents()
        .then((documents) => {
          const { setRecentDocuments, setInitialized } = useRecentsStore.getState()
          setRecentDocuments(documents.map(([node, documentDetails]) => createItemValue(node, documentDetails)))
          setInitialized()
        })
        .catch((error) => {
          setIsRecentsUpdating(false)
          traceError(error, {
            tags: {
              initiative: SentryRealtimeInitiatives.SDK_SWITCH,
              feature: 'DocsLoadRecentsWithDriveSDK',
            },
          })
          createNotification({
            type: 'error',
            text: c('Error').t`Failed to load recent documents`,
          })
        }),
    [fetchRecents, createNotification],
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

  const recentsListener: SDKEventListener = useCallback(async (event: DriveEvent) => {
    try {
      const drive = getDrive()
      const { setDocument, setRecentDocuments, removeChildrenOf, removeDocument, addresses } =
        useRecentsStore.getState()

      if (event.type === 'node_deleted') {
        removeDocument(event.nodeUid)
      }

      if (event.type === 'node_created') {
        const node = await drive.getNode(event.nodeUid)
        if (mimeTypeToProtonDocumentType(node.mediaType)) {
          // Adding a new document
          setDocument(await loadDocument(drive, event.nodeUid, addresses))
        }
      }

      if (event.type === 'node_updated') {
        const node = await drive.getNode(event.nodeUid)

        if (event.isTrashed) {
          if (node.type === NodeType.Folder) {
            removeChildrenOf(node.uid)
          } else {
            removeDocument(node.uid)
          }
        } else {
          if (mimeTypeToProtonDocumentType(node.mediaType)) {
            // Existing document was updated
            const { recentDocuments } = useRecentsStore.getState()
            const document = recentDocuments[node.uid]
            setDocument(await loadDocument(drive, event.nodeUid, addresses, document))
          } else if (node.type === NodeType.Folder) {
            const childrenOfUpdatedFolder: RecentDocumentsItemValue[] = []

            const { recentDocuments } = useRecentsStore.getState()
            // Which of already loaded documents are children of the updated folder?
            for (const documentNodeUid in recentDocuments) {
              if (recentDocuments[documentNodeUid].ancestorsNodeUids?.includes(node.uid)) {
                childrenOfUpdatedFolder.push(recentDocuments[documentNodeUid])
              }
            }

            // In case we have children of the updated folder we'll only reload existing nodes
            if (childrenOfUpdatedFolder.length > 0) {
              const updatedDocuments = await Promise.all(
                childrenOfUpdatedFolder.map((document) =>
                  loadDocument(drive, generateNodeUid(document.volumeId, document.linkId), addresses, document),
                ),
              )
              setRecentDocuments(updatedDocuments)
            } else {
              // This is probably a folder restored from trash - reload everything
              // Currently not supported
            }
          }
        }
      }
    } catch (error) {
      traceError(error, {
        tags: {
          initiative: SentryRealtimeInitiatives.SDK_SWITCH,
          feature: 'DocsLoadRecentsWithDriveSDK',
        },
      })
    }
  }, [])

  return {
    updateRecentDocuments,
    updateRenamedDocumentInCache,
    recentDocuments,
    recentDocumentsInitialized,
    isRecentsUpdating,
    recentsListener,
  }
}

function prepareDocumentData(
  nodesByUid: Map<string, NodeEntity>,
  document: RecentDocumentAPIItem,
  addresses: Address[] | undefined,
) {
  const nodeUid = generateNodeUid(document.VolumeID, document.LinkID)
  const node = nodesByUid.get(nodeUid)
  if (!node) {
    throw new Error(`Node ${nodeUid} not preset in fetched items`)
  }

  // most immediate parent first, root last
  const ancestorsNodeUids = document.AncestorIDs.map((ancestorLinkID) =>
    generateNodeUid(document.VolumeID, ancestorLinkID),
  )
  const ancestors = ancestorsNodeUids.map((nodeUid) => {
    const ancestor = nodesByUid.get(nodeUid)
    if (!ancestor) {
      throw new Error(`Ancestor ${nodeUid} not preset in fetched items`)
    }
    return ancestor
  })
  // root first, most immediate parent last
  const ancestorsReversed = ancestors.toReversed()

  const isSharedWithMe = addresses ? getIsSharedWithMe(node, addresses) : false

  return [
    node,
    {
      isSharedWithMe,
      path: getFullPathFromAncestry(ancestorsReversed),
      ancestorsNodeUids,
      effectiveRole: getRoleFromHierarchy([node, ...ancestors]) ?? MemberRole.Viewer,
      lastOpenTime: document.LastOpenTime,
      deprecatedShareId: document.ContextShareID,
    },
  ] as const
}

async function loadDocument(
  drive: ProtonDriveClient,
  nodeUid: string,
  addresses: Address[],
  document?: RecentDocumentsItemValue,
) {
  const hierarchy = await drive.getNodeHierarchy(nodeUid)
  // Always present - getNodeHierarchy includes self (so at least 1 item)
  const node = hierarchy.at(-1) as NodeEntity

  // CAREFUL the order here is different than in prepareDocumentData!
  // root first, most immediate parent last
  const ancestors = hierarchy.slice(0, -1)
  // most immediate parent first, root last
  const ancestorsNodeUids = ancestors.toReversed().map(({ uid }) => uid)

  const isSharedWithMe = getIsSharedWithMe(node, addresses)

  return createItemValue(node, {
    isSharedWithMe,
    path: getFullPathFromAncestry(ancestors),
    ancestorsNodeUids,
    effectiveRole: getRoleFromHierarchy(hierarchy.toReversed()) ?? MemberRole.Viewer,
    lastOpenTime: document?.lastViewed.serverTimestamp ?? Date.now(),
    deprecatedShareId: document?.shareId,
  })
}
