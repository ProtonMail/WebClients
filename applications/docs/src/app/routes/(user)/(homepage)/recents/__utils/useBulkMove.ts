import type { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'
import { useMoveItemsModal } from '@proton/drive/public/moveItemsModal'
import { generateNodeUid } from '@proton/drive/sdk'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { useApplication } from '~/utils/application-context'
import { useEvent } from '~/utils/misc'
import { useHomepageView } from './homepage-view-sdk-utils'

/**
 * The move modal needs every node under one root, so pass only documents in My files.
 * It notifies successes and failures itself. The documents it moved show in their new folder right away, rather than on their events.
 * `onMoved` gets the documents that moved, as soon as the move finishes.
 */
export function useBulkMove() {
  const application = useApplication()
  const { updateMovedDocuments } = useHomepageView()
  const { moveItemsModal, showMoveItemsModal } = useMoveItemsModal()

  const move = useEvent((documents: RecentDocumentsItem[], onMoved?: (moved: RecentDocumentsItem[]) => void) => {
    showMoveItemsModal({
      nodeUids: documents.map(({ volumeId, linkId }) => generateNodeUid(volumeId, linkId)),
      onMoved: ({ movedUids }) => {
        void updateMovedDocuments?.(movedUids)
        onMoved?.(documents.filter(({ volumeId, linkId }) => movedUids.includes(generateNodeUid(volumeId, linkId))))
      },
    })
    documents.forEach(() => application.metrics.reportHomepageTelemetry(TelemetryDocsHomepageEvents.document_moved))
  })

  return { move, moveItemsModal }
}
