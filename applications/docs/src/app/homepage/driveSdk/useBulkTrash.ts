import { useState } from 'react'
import type { RecentDocumentsItem } from '../recentDocumentsItem'
import { generateNodeUid, type ProtonDriveClient } from '@protontech/drive-sdk'
import { trashManyAndNotify } from './trashRestoreNotify'
import { useEvent } from '../utils/useEvent'
import { useHomepageView } from '../homepageViewContext'
import { TelemetryEvent } from '../utils/telemetry'

type BulkTrashDependencies = { drive: ProtonDriveClient }

export function useBulkTrash({ drive }: BulkTrashDependencies) {
  const { updateRecentDocuments, reportTelemetry, createNotification, errorTracking } = useHomepageView()
  const [isTrashing, setIsTrashing] = useState(false)

  const trash = useEvent(async (documents: RecentDocumentsItem[]): Promise<RecentDocumentsItem[]> => {
    const byUid = new Map(documents.map((document) => [generateNodeUid(document.volumeId, document.linkId), document]))

    setIsTrashing(true)
    let batch
    try {
      batch = await trashManyAndNotify(drive, createNotification, errorTracking, [...byUid.keys()], () => {
        void updateRecentDocuments()
      })
    } finally {
      setIsTrashing(false)
    }
    const { succeeded, failed } = batch

    if (succeeded.length > 0) {
      void updateRecentDocuments()
      succeeded.forEach(() => reportTelemetry(TelemetryEvent.document_trashed))
    }

    return failed.flatMap(({ uid }) => byUid.get(uid) ?? [])
  })

  return { trash, isTrashing }
}
