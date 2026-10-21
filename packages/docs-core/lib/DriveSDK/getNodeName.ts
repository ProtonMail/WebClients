import type { NodeEntity } from '@proton/drive/sdk'
import { c } from 'ttag'

export function getNodeNameOrFallback(node: Pick<NodeEntity, 'name'>) {
  return getNodeName(node) ?? c('Label').t`⚠️ Undecryptable name`
}

export function getNodeName(node: Pick<NodeEntity, 'name'>) {
  if (typeof node.name === 'string') {
    return node.name
  }
  if (node.name.ok) {
    return node.name.value
  }
  // Invalid name can still be used to display the node
  if (!(node.name.error instanceof Error) && node.name.error.name) {
    return node.name.error.name
  }
}
