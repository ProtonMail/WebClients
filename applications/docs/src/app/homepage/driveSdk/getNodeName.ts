import type { NodeEntity } from '@protontech/drive-sdk'
import { createNamesMessages } from '../messages/names'

export function getNodeNameOrFallback(node: Pick<NodeEntity, 'name'>) {
  return getNodeName(node) ?? createNamesMessages().names.undecryptable
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
