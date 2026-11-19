import type { RecentDocumentsItemValue } from './recentDocumentsItem'
import { type DriveEvent, type NodeEntity, type ProtonDriveClient, generateNodeUid } from '@protontech/drive-sdk'
import { mimeTypeToProtonDocumentType } from './utils/mimetype'
import { useCallback, useState } from 'react'
import { useHomepageMessages } from './messages/HomepageMessagesProvider'
import type { HomepageMessages } from './messages/defaultHomepageMessages'
import { useEvent } from './utils/useEvent'
import { nodeToTrashedDocumentItem } from './createDocumentItems'
import { traceErrorSDK } from './driveSdk/traceErrorSDK'
import type { SDKEventListener } from './homepageViewUtils'
import type { CreateNotification } from './utils/notifications'
import type { ErrorTracking } from './utils/errorTracking'

export function useTrashed(
  drive: ProtonDriveClient,
  createNotification: CreateNotification,
  errorTracking: ErrorTracking,
) {
  const [trashedDocumentItems, setTrashedDocumentItems] = useState<RecentDocumentsItemValue[]>([])
  const [isTrashLoading, setIsTrashLoading] = useState(false)

  const messages = useHomepageMessages()
  // Read when called: as a callback dependency, a locale change would reload the trash and resubscribe to events.
  const getMessages = useEvent(() => messages)

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
        traceErrorSDK(errorTracking, error, 'DocsLoadRecentsWithDriveSDK')
        createNotification({
          type: 'error',
          text: getMessages().loading.someTrashedFailed,
        })
      }

      setTrashedDocumentItems(nodes.map((node) => nodeToTrashedDocumentItem(node, getMessages().names)))
      setIsTrashLoading(false)
    },
    [createNotification, drive, errorTracking, getMessages],
  )

  const trashedListener: SDKEventListener = useCallback(
    async (event: DriveEvent) => {
      if (event.type === 'node_updated') {
        if (event.isTrashed) {
          const node = await drive.getNode(event.nodeUid)
          if (!mimeTypeToProtonDocumentType(node.mediaType)) {
            return
          }
          setTrashedDocumentItems((items) => createOrUpdateItem(items, node, getMessages().names))
        } else {
          setTrashedDocumentItems((items) => removeMissingItems(items, event.nodeUid))
        }
      }

      if (event.type === 'node_deleted') {
        setTrashedDocumentItems((items) => removeMissingItems(items, event.nodeUid))
      }
    },
    [drive, getMessages],
  )

  return {
    fetchTrashed,
    isTrashLoading,
    trashedDocumentItems,
    trashedListener,
  }
}

function createOrUpdateItem(
  previousItems: RecentDocumentsItemValue[],
  node: NodeEntity,
  names: HomepageMessages['names'],
) {
  const existingItemIndex = previousItems.findIndex((item) => node.uid === generateNodeUid(item.volumeId, item.linkId))
  if (existingItemIndex >= 0) {
    const updatedItems = [...previousItems]
    updatedItems[existingItemIndex] = nodeToTrashedDocumentItem(node, names)
    return updatedItems
  } else {
    return [...previousItems, nodeToTrashedDocumentItem(node, names)]
  }
}

function removeMissingItems(previousItems: RecentDocumentsItemValue[], trashedNodeUid: string) {
  return previousItems.filter((item) => trashedNodeUid !== generateNodeUid(item.volumeId, item.linkId))
}
