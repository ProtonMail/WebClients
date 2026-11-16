import type { NodeMeta } from '@proton/docs-shared/BasicTypes'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'

import { useCreateDocument } from '../__utils/useCreateDocument'
import { DocumentShell } from './DocumentShell'
import { LoadingScreen } from './LoadingScreen'
import { OpenActionError } from './OpenActionError'

export type DocumentCreatorProps = { parent?: NodeMeta; driveCompat: DriveCompat; onRetry: () => void }

// Adapted from `applications/docs/src/app/routes/(user)/(document)/doc/page.tsx`, its `creating_new_document` phase.
export function DocumentCreator({ parent, driveCompat, onRetry }: DocumentCreatorProps) {
  const { failed } = useCreateDocument(parent, driveCompat)

  if (failed) {
    return <OpenActionError reason="creationFailed" onRetry={onRetry} />
  }

  return <DocumentShell header={null} loadingScreen={<LoadingScreen status="creating" />} />
}
