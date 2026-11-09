import { useState } from 'react'
import { useNotifications } from '@proton/app-context/useNotifications'
import type { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'
import { generateNodeUid, type ProtonDriveClient } from '@protontech/drive-sdk'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { trashManyAndNotify } from '~/homepage'
import { useApplication } from '~/utils/application-context'
import { useEvent } from '~/utils/misc'
import { useHomepageView } from './homepage-view-sdk-utils'

type BulkTrashDependencies = { drive: ProtonDriveClient }

export function useBulkTrash({ drive }: BulkTrashDependencies) {
  const application = useApplication()
  const { createNotification } = useNotifications()
  const { updateRecentDocuments } = useHomepageView()
  const [isTrashing, setIsTrashing] = useState(false)

  const trash = useEvent(async (documents: RecentDocumentsItem[]): Promise<RecentDocumentsItem[]> => {
    const byUid = new Map(documents.map((document) => [generateNodeUid(document.volumeId, document.linkId), document]))

    setIsTrashing(true)
    let batch
    try {
      batch = await trashManyAndNotify(drive, createNotification, [...byUid.keys()], () => {
        void updateRecentDocuments()
      })
    } finally {
      setIsTrashing(false)
    }
    const { succeeded, failed } = batch

    if (succeeded.length > 0) {
      void updateRecentDocuments()
      succeeded.forEach(() => application.metrics.reportHomepageTelemetry(TelemetryDocsHomepageEvents.document_trashed))
    }

    return failed.flatMap(({ uid }) => byUid.get(uid) ?? [])
  })

  return { trash, isTrashing }
}
