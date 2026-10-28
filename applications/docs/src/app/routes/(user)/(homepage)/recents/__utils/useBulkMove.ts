import type { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'
import { useMoveItemsModal } from '@proton/drive/public/moveItemsModal'
import { generateNodeUid } from '@proton/drive/sdk'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { useApplication } from '~/utils/application-context'
import { useEvent } from '~/utils/misc'

/**
 * The move modal needs every node under one root, so pass only documents in My files.
 * It notifies successes and failures itself. Recents loaded through the Drive SDK update from the moved documents' events.
 */
export function useBulkMove() {
  const application = useApplication()
  const { moveItemsModal, showMoveItemsModal } = useMoveItemsModal()

  const move = useEvent((documents: RecentDocumentsItem[]) => {
    showMoveItemsModal({
      nodeUids: documents.map(({ volumeId, linkId }) => generateNodeUid(volumeId, linkId)),
    })
    documents.forEach(() => application.metrics.reportHomepageTelemetry(TelemetryDocsHomepageEvents.document_moved))
  })

  return { move, moveItemsModal }
}
