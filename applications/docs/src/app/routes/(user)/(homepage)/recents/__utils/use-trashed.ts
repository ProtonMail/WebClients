import useNotifications from '@proton/components/hooks/useNotifications'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import { generateNodeUid, getDrive } from '@proton/drive'
import { mimeTypeToProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { DriveEvent, NodeEntity, ProtonDriveClient } from '@proton/drive'
import { useCallback, useState } from 'react'
import { c } from 'ttag'
import { nodeToTrashedDocumentItem } from './create-document-items'
import { traceError, SentryRealtimeInitiatives } from '@proton/shared/lib/helpers/sentry'
import type { SDKEventListener } from '~/drive-sdk/event-subscriber'

export function useTrashed(drive: ProtonDriveClient) {
  const { createNotification } = useNotifications()

  const [trashedDocumentItems, setTrashedDocumentItems] = useState<RecentDocumentsItemValue[]>([])
  const [isTrashLoading, setIsTrashLoading] = useState(false)

  const fetchTrashed = useCallback(async () => {
    setIsTrashLoading(true)

    const nodes: NodeEntity[] = []
    try {
      // TODO replace with "iterateTrashedNodeUids" and use AbortController (not time critical)
      for await (const node of drive.iterateTrashedNodes()) {
        if (!mimeTypeToProtonDocumentType(node.mediaType)) {
          continue
        }
        nodes.push(node)
      }
    } catch (error: any) {
      traceError(error, {
        tags: {
          initiative: SentryRealtimeInitiatives.SDK_SWITCH,
          feature: 'DocsLoadRecentsWithDriveSDK',
        },
      })
      createNotification({
        type: 'error',
        text: c('Error').t`Some trashed documents could not be loaded`,
      })
    }

    setTrashedDocumentItems(nodes.map(nodeToTrashedDocumentItem))
    setIsTrashLoading(false)
  }, [createNotification, drive])

  const trashedListener: SDKEventListener = useCallback(async (event: DriveEvent) => {
    const drive = getDrive()

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
  }, [])

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
