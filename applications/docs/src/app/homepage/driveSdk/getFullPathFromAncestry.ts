import type { NodeEntity } from '@protontech/drive-sdk'
import type { HomepageMessages } from '../messages/defaultHomepageMessages'
import { getNodeNameOrFallback } from './getNodeName'

/**
 * @param ancestry root first, most immediate parent last
 */
export function getFullPathFromAncestry(ancestry: NodeEntity[], names: HomepageMessages['names']) {
  const [_root, ...children] = ancestry
  return children.map((child) => getNodeNameOrFallback(child, names))
}
