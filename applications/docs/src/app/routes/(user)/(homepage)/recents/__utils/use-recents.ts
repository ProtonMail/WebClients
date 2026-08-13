import useNotifications from '@proton/components/hooks/useNotifications';
import { mimeTypeToProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import {
  type DriveEvent,
  type NodeEntity,
  type ProtonDriveClient,
  MemberRole,
  NodeType,
  ProtonDriveError,
  generateNodeUid,
  getDrive,
} from '@proton/drive'
import { useCallback, useEffect, useRef, useState } from 'react'
import { c } from 'ttag'
import { useApplication } from '~/utils/application-context'
import { getFullPathFromAncestry, getIsSharedWithMe } from '~/drive-sdk'
import { createDocumentItem } from './create-document-items'
import { useRecentsStore } from './use-recents-store'
import { getRoleFromHierarchy } from '~/drive-sdk/get-role-from-hierarchy'
import { useAddresses } from '@proton/account/addresses/hooks'
import type { Address } from '@proton/shared/lib/interfaces/Address'
import type { RecentDocumentAPIItem } from '@proton/docs-core/lib/Api/Types/GetRecentsResponse'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import { addSentryBreadcrumb } from '@proton/shared/lib/helpers/sentry'
import { traceRecentsError } from './traceRecentsError'
import { getEventSubscriber, type SDKEventListener } from '~/drive-sdk/event-subscriber'

export function useRecents(drive: ProtonDriveClient) {
  const [addresses] = useAddresses()
  useEffect(() => {
    const { setAddresses } = useRecentsStore.getState()
    if (addresses) {
      setAddresses(addresses)
    }
  }, [addresses])

  const app = useApplication()
  const { docsApi, logger } = app
  const { createNotification } = useNotifications()

  const eventSubscriber = getEventSubscriber()

  const recentDocuments = useRecentsStore((state) => state.recentDocuments)
  const recentDocumentsInitialized = useRecentsStore((state) => state.recentDocumentsInitialized)

  const [isRecentsUpdating, setIsRecentsUpdating] = useState(false)

  const fetchRecents = useCallback(
    async (abort: AbortSignal) => {
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
      try {
        for await (const node of drive.iterateNodes([...uidsToLoad], abort)) {
          if ('missingUid' in node) {
            addSentryBreadcrumb({
              category: 'docs',
              level: 'warning',
              message: 'Missing node while iterating',
              data: {
                uidsToLoad,
                missingNodeUid: node.missingUid,
              },
            })
            logger.debug('[LoadRecentsWithDriveSDK] Node not found', { node })
          } else {
            nodesByUid.set(node.uid, node)
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error
        }
        // Any other error does not cause rejection of fetchRecents - we need to return whatever we were able to load

        logger.debug('[LoadRecentsWithDriveSDK] Error while iterating nodes', { error })
        const data: any = { error }
        if (error instanceof ProtonDriveError) {
          data.errorCause = error.cause // Explicitly logging it - debugging SDK and Sentry interaction
        }
        addSentryBreadcrumb({
          category: 'docs',
          level: 'warning',
          message: 'Node iterator error',
          data,
        })
        // Split in two, otherwise it won't fully log
        addSentryBreadcrumb({
          category: 'docs',
          level: 'info',
          message: 'Node iterator error - debug info 1/2',
          data: {
            documents,
          },
        })
        addSentryBreadcrumb({
          category: 'docs',
          level: 'info',
          message: 'Node iterator error - debug info 2/2',
          data: {
            loadedNodes: [...nodesByUid.keys()],
            missingNodes: [...uidsToLoad].filter((nodeUid) => !nodesByUid.has(nodeUid)),
          },
        })
        // Creating new error to capture current stack
        const errorWithCurrentStack = new Error('fetchRecents failed at iterateNodes')
        errorWithCurrentStack.cause = error
        traceRecentsError(errorWithCurrentStack)
      }

      return { documents, nodesByUid }
    },
    [docsApi, drive, logger],
  )

  const abortFetchingDocuments = useRef(new AbortController())
  const updateRecentDocuments = useCallback(() => {
    abortFetchingDocuments.current.abort()
    abortFetchingDocuments.current = new AbortController()
    setIsRecentsUpdating(true)
    return fetchRecents(abortFetchingDocuments.current.signal)
      .then(({ documents, nodesByUid }) => {
        const { setRecentDocuments, setInitialized } = useRecentsStore.getState()

        const documentItems: RecentDocumentsItemValue[] = []
        for (const document of documents) {
          try {
            const documentUid = generateNodeUid(document.VolumeID, document.LinkID)
            const node = nodesByUid.get(documentUid)
            if (!node) {
              logger.debug('[LoadRecentsWithDriveSDK] Missing node for document', { document })
              continue
            }

            const documentDetails = getDocumentDetails(document, node, nodesByUid, addresses)
            documentItems.push(createDocumentItem(node, documentDetails))

            if (documentDetails.isSharedWithMe) {
              eventSubscriber.subscribeToSharedDocument(node.uid, node.treeEventScopeId)
            }
          } catch (error) {
            logger.debug('[LoadRecentsWithDriveSDK] Could not process document', { error, document })
            traceRecentsError(error)
          }
        }

        if (documents.length > documentItems.length) {
          createNotification({
            type: 'error',
            text: c('Error').t`Some documents could not be loaded`,
          })
        }

        setRecentDocuments(documentItems)
        setInitialized()
        setIsRecentsUpdating(false)
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        traceRecentsError(error)
        createNotification({
          type: 'error',
          text: c('Error').t`Failed to load recent documents`,
        })
      })
  }, [fetchRecents, addresses, logger, eventSubscriber, createNotification])

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
    const drive = getDrive()
    const { setDocument, setRecentDocuments, removeChildrenOf, removeDocument, addresses } = useRecentsStore.getState()

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
  }, [])

  const removeDocument = useCallback((nodeUid: string) => {
    const { removeDocument } = useRecentsStore.getState()
    removeDocument(nodeUid)
  }, [])

  return {
    updateRecentDocuments,
    updateRenamedDocumentInCache,
    recentDocuments,
    recentDocumentsInitialized,
    isRecentsUpdating,
    removeDocument,
    recentsListener,
  }
}

function getDocumentDetails(
  document: RecentDocumentAPIItem,
  node: NodeEntity,
  nodesByUid: Map<string, NodeEntity>,
  addresses: Address[] | undefined,
) {
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

  return {
    isSharedWithMe,
    path: getFullPathFromAncestry(ancestorsReversed),
    ancestorsNodeUids,
    effectiveRole: getRoleFromHierarchy([node, ...ancestors]) ?? MemberRole.Viewer,
    lastOpenTime: document.LastOpenTime,
    deprecatedShareId: document.ContextShareID,
  }
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

  return createDocumentItem(node, {
    isSharedWithMe,
    path: getFullPathFromAncestry(ancestors),
    ancestorsNodeUids,
    effectiveRole: getRoleFromHierarchy(hierarchy.toReversed()) ?? MemberRole.Viewer,
    lastOpenTime: document?.lastViewed.serverTimestamp ?? Date.now(),
    deprecatedShareId: document?.shareId,
  })
}
