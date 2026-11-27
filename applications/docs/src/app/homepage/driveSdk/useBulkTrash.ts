import { useState } from 'react'
import type { RecentDocumentsItem } from '../recentDocumentsItem'
import { generateNodeUid, type ProtonDriveClient } from '@protontech/drive-sdk'
import { trashManyAndNotify } from './trashRestoreNotify'
import { useEvent } from '../utils/useEvent'
import { useHomepageView } from '../homepageViewContext'
import { useHomepageMessages } from '../messages/HomepageMessagesProvider'
import { TelemetryEvent } from '../utils/telemetry'

type BulkTrashDependencies = { drive: ProtonDriveClient }

export function useBulkTrash({ drive }: BulkTrashDependencies) {
  const { updateRecentDocuments, removeDocuments, reportTelemetry, createNotification, errorTracking } =
    useHomepageView()
  const messages = useHomepageMessages().trash
  const [isTrashing, setIsTrashing] = useState(false)

  const trash = useEvent(async (documents: RecentDocumentsItem[]): Promise<RecentDocumentsItem[]> => {
    const byUid = new Map(documents.map((document) => [generateNodeUid(document.volumeId, document.linkId), document]))

    setIsTrashing(true)
    let batch
    try {
      batch = await trashManyAndNotify(
        drive,
        createNotification,
        errorTracking,
        [...byUid.keys()],
        () => {
          void updateRecentDocuments()
        },
        documents.every((document) => !document.isSharedWithMe),
        messages,
      )
    } finally {
      setIsTrashing(false)
    }
    const { succeeded, failed } = batch

    if (succeeded.length > 0) {
      // Not a reload: it would show the loader in place of the table, which drops the selection of the failed ones.
      removeDocuments(succeeded)
      succeeded.forEach(() => reportTelemetry(TelemetryEvent.document_trashed))
    }

    return failed.flatMap(({ uid }) => byUid.get(uid) ?? [])
  })

  return { trash, isTrashing }
}
