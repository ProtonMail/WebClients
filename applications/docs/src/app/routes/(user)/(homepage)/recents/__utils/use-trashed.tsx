import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import { ServerTime } from '@proton/docs-shared'
import { splitNodeUid } from '@proton/drive'
import { mimeTypeToProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { ProtonDriveClient, NodeEntity, DegradedNode } from '@protontech/drive-sdk'
import { useState, useMemo } from 'react'
import { getNodeName, getAuthorName } from './create-document-items'
import { useApplication } from '~/utils/application-context'
import { c } from 'ttag'
import useNotifications from '@proton/components/hooks/useNotifications'

export function useTrashed(drive: ProtonDriveClient) {
  const app = useApplication()
  const { logger } = app
  const { createNotification } = useNotifications()

  const [trashedDocumentItems, setTrashedDocumentItems] = useState<RecentDocumentsItemValue[]>([])
  const [isTrashLoading, setIsTrashLoading] = useState(false)

  const fetchTrashed = useMemo(
    () => async () => {
      setIsTrashLoading(true)

      const nodes: (NodeEntity | DegradedNode)[] = []
      try {
        for await (const maybeNode of drive.iterateTrashedNodes()) {
          const node = maybeNode.ok ? maybeNode.value : maybeNode.error
          if (!mimeTypeToProtonDocumentType(node.mediaType)) {
            continue
          }
          nodes.push(node)
        }
      } catch (error: any) {
        logger.error('Failed to load trashed document with SDK', error)
        createNotification({
          type: 'error',
          text: c('Error').t`Some trashed documents could not be loaded`,
        })
      }

      setTrashedDocumentItems(nodes.map(nodeToDocumentsItemValue))
      setIsTrashLoading(false)
    },
    [createNotification, drive, logger],
  )

  return {
    fetchTrashed,
    isTrashLoading,
    trashedDocumentItems,
  }
}

function nodeToDocumentsItemValue(node: NodeEntity | DegradedNode): RecentDocumentsItemValue {
  const { volumeId, nodeId: linkId } = splitNodeUid(node.uid)
  const { nodeId: parentLinkId } = node.parentUid ? splitNodeUid(node.parentUid) : {}
  return {
    name: getNodeName(node) ?? '',
    type: mimeTypeToProtonDocumentType(node.mediaType) ?? 'document',
    linkId,
    parentLinkId,
    volumeId,
    // In case trashTime is missing it will use Sept 2001, but that's HIGHLY unlikely
    lastViewed: new ServerTime(node.trashTime?.getTime() ?? 1000000000),
    lastModified: new ServerTime(node.trashTime?.getTime() ?? 1000000000),
    createdBy: getAuthorName(node),
    // Properties below are irrelevant for trashed items
    isSharedWithMe: false,
    shareId: '',
    location: { type: 'root' },
  }
}
