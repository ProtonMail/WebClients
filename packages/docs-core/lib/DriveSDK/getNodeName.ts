import type { NodeEntity } from '@proton/drive'

export function getNodeName(node: Pick<NodeEntity, 'name'>) {
  if (typeof node.name === 'string') {
    return node.name
  }
  if (node.name.ok) {
    return node.name.value
  }
}
