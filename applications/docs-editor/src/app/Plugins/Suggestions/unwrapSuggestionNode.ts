import type { ProtonNode } from './ProtonNode'

/**
 * Unwraps a given suggestion node i.e. removes the wrapper
 * suggestion node while keeping the children intent
 */
export function $unwrapSuggestionNode(node: ProtonNode): void {
  const children = node.getChildren()
  let target = null
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (target === null) {
      node.insertBefore(child)
    } else {
      target.insertAfter(child)
    }
    target = child
  }
  node.remove()
}
