import type { NodeEntity } from '@proton/drive/sdk'

// Copied from docs-core `DriveSDK/getNodeName.ts`, which doc2 must not import.
export function getNodeName(node: Pick<NodeEntity, 'name'>): string | undefined {
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
