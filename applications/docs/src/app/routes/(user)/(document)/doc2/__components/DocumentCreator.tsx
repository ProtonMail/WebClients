import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import type { NodeMeta } from '@proton/docs-shared/BasicTypes'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { c } from 'ttag'

import { useCreateDocument } from '../__utils/useCreateDocument'
import { OpenActionError } from './OpenActionError'

export type DocumentCreatorProps = { parent?: NodeMeta; driveCompat: DriveCompat; onRetry: () => void }

export function DocumentCreator({ parent, driveCompat, onRetry }: DocumentCreatorProps) {
  const { failed } = useCreateDocument(parent, driveCompat)

  if (failed) {
    return <OpenActionError reason="creationFailed" onRetry={onRetry} />
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <CircleLoader size="large" />
      <div className="text-center">{c('Info').t`Creating new document...`}</div>
    </div>
  )
}
