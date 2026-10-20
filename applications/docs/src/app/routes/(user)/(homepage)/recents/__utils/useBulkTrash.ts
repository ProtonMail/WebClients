import { useState } from 'react'
import { useNotifications } from '@proton/app-context/useNotifications'
import type { RecentDocumentsItem } from '@proton/docs-core'
import { generateNodeUid } from '@proton/drive'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { trashManyAndNotify } from '~/drive-sdk/trash-restore-notify'
import { useApplication } from '~/utils/application-context'
import { useEvent } from '~/utils/misc'
import { useHomepageView } from './homepage-view'

export function useBulkTrash() {
  const application = useApplication()
  const { createNotification } = useNotifications()
  const { updateRecentDocuments } = useHomepageView()
  const [isTrashing, setIsTrashing] = useState(false)

  const trash = useEvent(async (documents: RecentDocumentsItem[]): Promise<RecentDocumentsItem[]> => {
    const byUid = new Map(documents.map((document) => [generateNodeUid(document.volumeId, document.linkId), document]))

    setIsTrashing(true)
    let batch
    try {
      batch = await trashManyAndNotify(createNotification, [...byUid.keys()], () => {
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
