import useNotifications from '@proton/components/hooks/useNotifications'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import { generateNodeUid, getDrive } from '@proton/drive'
import { mimeTypeToProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { DegradedNode, DriveEvent, NodeEntity, ProtonDriveClient } from '@protontech/drive-sdk'
import { useCallback, useState } from 'react'
import { c } from 'ttag'
import { useApplication } from '~/utils/application-context'
import { nodeToTrashedItemValue } from './create-document-items'

export function useTrashed(drive: ProtonDriveClient) {
  const app = useApplication()
  const { logger } = app
  const { createNotification } = useNotifications()

  const [trashedDocumentItems, setTrashedDocumentItems] = useState<RecentDocumentsItemValue[]>([])
  const [isTrashLoading, setIsTrashLoading] = useState(false)

  const fetchTrashed = useCallback(async () => {
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

    setTrashedDocumentItems(nodes.map(nodeToTrashedItemValue))
    setIsTrashLoading(false)
  }, [createNotification, drive, logger])

  const handleEvent = useCallback(async (event: DriveEvent) => {
    const drive = getDrive()

    if (event.type === 'node_updated') {
      if (event.isTrashed) {
        const maybeNode = await drive.getNode(event.nodeUid)
        const node = maybeNode.ok ? maybeNode.value : maybeNode.error
        if (!mimeTypeToProtonDocumentType(node.mediaType)) {
          return
        }
        setTrashedDocumentItems((items) => createOrUpdateItem(items, node))
      } else {
        setTrashedDocumentItems((items) => removeMissingItems(items, event))
      }
    }

    if (event.type === 'node_deleted') {
      setTrashedDocumentItems((items) => removeMissingItems(items, event))
    }
  }, [])

  return {
    fetchTrashed,
    isTrashLoading,
    trashedDocumentItems,
    handleEvent,
  }
}

function createOrUpdateItem(previousItems: RecentDocumentsItemValue[], node: NodeEntity | DegradedNode) {
  const existingItemIndex = previousItems.findIndex((item) => node.uid === generateNodeUid(item.volumeId, item.linkId))
  if (existingItemIndex >= 0) {
    const updatedItems = [...previousItems]
    updatedItems[existingItemIndex] = nodeToTrashedItemValue(node)
    return updatedItems
  } else {
    return [...previousItems, nodeToTrashedItemValue(node)]
  }
}

function removeMissingItems(previousItems: RecentDocumentsItemValue[], event: { nodeUid: string }) {
  return previousItems.filter((item) => event.nodeUid !== generateNodeUid(item.volumeId, item.linkId))
}
