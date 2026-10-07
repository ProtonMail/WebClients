import { generateNodeUid, getDrive } from '@proton/drive'
import type { PublicNodeMeta } from '@proton/docs-shared'
import { getPublicLinkInfo } from './getPublicDrive'

/**
 * Unlike legacy, which probes the authenticated document meta endpoint, this is answered from the public link info
 * when possible, so anonymous viewers and documents shared as the public link root make no request.
 */
export async function hasDirectAccessToPublicNode(nodeMeta: PublicNodeMeta): Promise<boolean> {
  const { hasDirectAccess, volumeId } = getPublicLinkInfo()
  if (hasDirectAccess !== undefined) {
    return hasDirectAccess
  }

  // Public link nodes carry no per-user permissions, so only the private client can tell
  const nodeUid = generateNodeUid(volumeId, nodeMeta.linkId)
  return getDrive()
    .getNode(nodeUid)
    .then(
      () => true,
      () => false,
    )
}
