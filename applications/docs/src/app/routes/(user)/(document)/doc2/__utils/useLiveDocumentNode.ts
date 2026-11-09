import { useEffect, useState } from 'react'

import { type DriveEvent, type NodeEntity, getDrive } from '@proton/drive/sdk'

import { getEventSubscriber } from '~/drive-sdk/event-subscriber'
import { useApplication } from '~/utils/application-context'

/**
 * The document's Drive node, refetched whenever Drive reports it updated (renamed or moved elsewhere), as /doc's
 * `DocumentViewer.tsx` does. It uses the app's one Drive event subscriber, as /doc does: a second one would poll Drive's
 * events twice. The document session doesn't depend on it, so nothing reopens.
 */
export function useLiveDocumentNode(node: NodeEntity | undefined): NodeEntity | undefined {
  const { logger } = useApplication()
  const [liveNode, setLiveNode] = useState(node)

  useEffect(() => {
    setLiveNode(node)
    if (!node) {
      return
    }
    let stopped = false
    const refreshOnUpdate = async (event: DriveEvent) => {
      if (event.type !== 'node_updated' || event.nodeUid !== node.uid) {
        return
      }
      const updated = await getDrive().getNode(node.uid)
      if (!stopped) {
        setLiveNode(updated)
      }
    }
    const eventSubscriber = getEventSubscriber()
    eventSubscriber
      .initialize(node.treeEventScopeId, [refreshOnUpdate])
      .catch((error) => logger.warn('Failed to listen to Drive events for the document', error))
    return () => {
      stopped = true
      eventSubscriber.reset()
    }
  }, [logger, node])

  return liveNode
}
