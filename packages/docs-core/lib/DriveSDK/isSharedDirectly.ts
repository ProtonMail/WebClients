import type { NodeMeta } from '@proton/docs-shared/BasicTypes'
import { generateNodeUid, getDrive } from '@proton/drive/sdk'

import { traceErrorSDK } from './traceErrorSDK'

/**
 * Whether the user holds a membership on the document itself, as /doc's `useDriveSharing.ts` asks Drive.
 * `true` when Drive fails, so a new document goes to My files, which the user can always write to.
 */
export async function isSharedDirectly({ volumeId, linkId }: NodeMeta): Promise<boolean> {
  try {
    const node = await getDrive().getNode(generateNodeUid(volumeId, linkId))
    return !!node.membership
  } catch (error) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
    return true
  }
}
