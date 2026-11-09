import type { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'
import type { ReactNode } from 'react'
import { generateNodeUid } from '@protontech/drive-sdk'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { useApplication } from '~/utils/application-context'
import { useEvent } from './useEvent'
import { useHomepageView } from './homepageViewContext'

export type UseMoveItemsModal = () => {
  moveItemsModal: ReactNode
  showMoveItemsModal: (props: { nodeUids: string[]; onMoved?: (result: { movedUids: string[] }) => void }) => void
}

type BulkMoveDependencies = { useMoveItemsModal: UseMoveItemsModal }

/**
 * The move modal needs every node under one root, so pass only documents in My files.
 * It notifies successes and failures itself. The documents it moved show in their new folder right away, rather than on their events.
 * `onMoved` gets the documents that moved, as soon as the move finishes.
 */
export function useBulkMove({ useMoveItemsModal }: BulkMoveDependencies) {
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
