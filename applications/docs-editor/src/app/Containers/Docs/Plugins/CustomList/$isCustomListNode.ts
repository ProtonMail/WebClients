import type { LexicalNode } from 'lexical'
import { CustomListNode } from './CustomListNode'

export function $isCustomListNode(node: LexicalNode | null | undefined): node is CustomListNode {
  return node instanceof CustomListNode
}
