import type { RecentDocumentsItemValue } from './recentDocumentsItem'
import { type DriveEvent, type NodeEntity, type ProtonDriveClient, generateNodeUid } from '@protontech/drive-sdk'
import { mimeTypeToProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import { useCallback, useState } from 'react'
import { c } from 'ttag'
import { nodeToTrashedDocumentItem } from './createDocumentItems'
import { traceErrorSDK } from './driveSdk/traceErrorSDK'
import type { SDKEventListener } from './homepageViewUtils'
import type { CreateNotification } from './utils/notifications'

export function useTrashed(drive: ProtonDriveClient, createNotification: CreateNotification) {
  const [trashedDocumentItems, setTrashedDocumentItems] = useState<RecentDocumentsItemValue[]>([])
  const [isTrashLoading, setIsTrashLoading] = useState(false)

  const fetchTrashed = useCallback(
    async (abort: AbortSignal) => {
      setIsTrashLoading(true)

      const nodes: NodeEntity[] = []
      try {
        for await (const node of drive.iterateTrashedNodes(abort)) {
          if (!mimeTypeToProtonDocumentType(node.mediaType)) {
            continue
          }
          nodes.push(node)
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return
        }
        traceErrorSDK(error, 'DocsLoadRecentsWithDriveSDK')
        createNotification({
          type: 'error',
          text: c('Error').t`Some trashed documents could not be loaded`,
        })
      }

      setTrashedDocumentItems(nodes.map(nodeToTrashedDocumentItem))
      setIsTrashLoading(false)
    },
    [createNotification, drive],
  )

  const trashedListener: SDKEventListener = useCallback(
    async (event: DriveEvent) => {
      if (event.type === 'node_updated') {
        if (event.isTrashed) {
          const node = await drive.getNode(event.nodeUid)
          if (!mimeTypeToProtonDocumentType(node.mediaType)) {
            return
          }
          setTrashedDocumentItems((items) => createOrUpdateItem(items, node))
        } else {
          setTrashedDocumentItems((items) => removeMissingItems(items, event.nodeUid))
        }
      }

      if (event.type === 'node_deleted') {
        setTrashedDocumentItems((items) => removeMissingItems(items, event.nodeUid))
      }
    },
    [drive],
  )

  return {
    fetchTrashed,
    isTrashLoading,
    trashedDocumentItems,
    trashedListener,
  }
}

function createOrUpdateItem(previousItems: RecentDocumentsItemValue[], node: NodeEntity) {
  const existingItemIndex = previousItems.findIndex((item) => node.uid === generateNodeUid(item.volumeId, item.linkId))
  if (existingItemIndex >= 0) {
    const updatedItems = [...previousItems]
    updatedItems[existingItemIndex] = nodeToTrashedDocumentItem(node)
    return updatedItems
  } else {
    return [...previousItems, nodeToTrashedDocumentItem(node)]
  }
}

function removeMissingItems(previousItems: RecentDocumentsItemValue[], trashedNodeUid: string) {
  return previousItems.filter((item) => trashedNodeUid !== generateNodeUid(item.volumeId, item.linkId))
}
