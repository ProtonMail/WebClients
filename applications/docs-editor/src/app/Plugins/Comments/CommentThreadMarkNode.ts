import { MarkNode, SerializedMarkNode } from '@lexical/mark'
import { addClassNamesToElement, removeClassNamesFromElement } from '@lexical/utils'
import { $applyNodeReplacement, EditorConfig, LexicalNode, NodeKey, Spread } from 'lexical'

export type SerializedCommentThreadMarkNode = Spread<
  {
    resolved: boolean
  },
  SerializedMarkNode
>

export class CommentThreadMarkNode extends MarkNode {
  __resolved: boolean

  static getType(): string {
    return 'comment-thread-mark'
  }

  static clone(node: CommentThreadMarkNode): CommentThreadMarkNode {
    return new CommentThreadMarkNode(Array.from(node.__ids), node.__resolved, node.__key)
  }

  static importJSON(serializedNode: SerializedCommentThreadMarkNode): CommentThreadMarkNode {
    const node = $createCommentThreadMarkNode(serializedNode.ids, serializedNode.resolved)
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  exportJSON(): SerializedCommentThreadMarkNode {
    return {
      ...super.exportJSON(),
      type: 'comment-thread-mark',
      resolved: this.__resolved,
      version: 1,
    }
  }

  constructor(ids: string[], resolved?: boolean, key?: NodeKey) {
    super(ids, key)
    this.__resolved = resolved ?? false
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config)
    addClassNamesToElement(element, 'Lexical__commentThreadMark')
    return element
  }

  updateDOM(prevNode: MarkNode, element: HTMLElement, config: EditorConfig): boolean {
    super.updateDOM(prevNode, element, config)
    addClassNamesToElement(element, 'Lexical__commentThreadMark')
    if (this.__resolved) {
      addClassNamesToElement(element, 'resolved')
    } else {
      removeClassNamesFromElement(element, 'resolved')
    }
    return false
  }

  getResolved(): boolean {
    return this.getLatest().__resolved
  }

  setResolved(resolved: boolean): void {
    const writable = this.getWritable()
    writable.__resolved = resolved
  }
}

export function $createCommentThreadMarkNode(ids: string[], resolved?: boolean): CommentThreadMarkNode {
  return $applyNodeReplacement(new CommentThreadMarkNode(ids, resolved))
}

export function $isCommentThreadMarkNode(node: LexicalNode | null): node is CommentThreadMarkNode {
  return node instanceof CommentThreadMarkNode
}
