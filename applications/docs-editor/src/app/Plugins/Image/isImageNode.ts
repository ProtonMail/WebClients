import type { LexicalNode } from 'lexical'
import { ImageNode } from './ImageNode'

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}
