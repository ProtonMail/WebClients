import type { NodeEntity } from '@proton/drive/sdk'
import { getNodeNameOrFallback } from '@proton/docs-core/lib/DriveSDK/getNodeName'

/**
 *
 * @param ancestry root first, most immediate parent last
 */
export function getFullPathFromAncestry(ancestry: NodeEntity[]) {
  const [_root, ...children] = ancestry
  return children.map(getNodeNameOrFallback)
}
