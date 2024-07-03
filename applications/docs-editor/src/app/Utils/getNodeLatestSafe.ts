import { LexicalNode } from 'lexical'

/**
 * Non-throwing version of LexicalNode.getLatest().
 * Returns the latest version of the node from the active EditorState.
 * This is used to avoid getting values from stale node references.
 */
export function getNodeLatestSafe<Node extends LexicalNode>(node: Node | null): Node | null {
  if (!node) {
    return null
  }
  try {
    return node.getLatest()
  } catch (error) {
    return null
  }
}
