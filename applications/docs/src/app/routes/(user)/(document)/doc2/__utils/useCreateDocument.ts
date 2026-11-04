import { useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'

import type { NodeMeta } from '@proton/docs-shared/BasicTypes'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { getPlatformFriendlyDateForFileName } from '@proton/shared/lib/docs/utils/getPlatformFriendlyDateForFileName'
import { c } from 'ttag'

import { useApplication } from '~/utils/application-context'
import { DOCUMENT_V2_PATH } from '~/utils/docs-url-bar'

/**
 * Creates a text document in `parent`, or in My files without one, then replaces the URL with the doc2 URL that opens
 * it. Runs once per mount: unmounting during creation leaves the URL alone, even if the document got created.
 * Creation goes through Drive compat whatever `DocsDriveCompatSDK` says, so doc2 adds no document-creation crypto.
 */
export function useCreateDocument(parent: NodeMeta | undefined, driveCompat: DriveCompat) {
  const { logger } = useApplication()
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)

  useEffectOnce(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function createDocument() {
      const date = getPlatformFriendlyDateForFileName()
      const name = c('Title').t`Untitled document ${date}`
      const folder = parent ?? (await driveCompat.getMyFilesNodeMeta())
      if (signal.aborted) {
        return
      }
      const { volumeId, linkId } = await driveCompat.createDocumentNode(folder, name, 'doc')
      if (signal.aborted) {
        return
      }
      const search = new URLSearchParams({ mode: 'open', volumeId, linkId })
      navigate({ pathname: DOCUMENT_V2_PATH, search: `?${search}` }, { replace: true })
    }

    createDocument().catch((error) => {
      if (signal.aborted) {
        return
      }
      logger.error('Failed to create a document', error)
      setFailed(true)
    })

    return () => controller.abort()
  })

  return { failed }
}
