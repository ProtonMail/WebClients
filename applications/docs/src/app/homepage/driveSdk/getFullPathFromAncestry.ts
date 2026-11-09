import type { NodeEntity } from '@protontech/drive-sdk'
import { getNodeNameOrFallback } from '@proton/docs-core/DriveSDK/getNodeName'

/**
 * @param ancestry root first, most immediate parent last
 */
export function getFullPathFromAncestry(ancestry: NodeEntity[]) {
  const [_root, ...children] = ancestry
  return children.map(getNodeNameOrFallback)
}
