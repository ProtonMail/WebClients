import { addClassNamesToElement, removeClassNamesFromElement } from '@lexical/utils'
import {
  $applyNodeReplacement,
  EditorConfig,
  LexicalNode,
  NodeKey,
  Spread,
  ElementNode,
  $isElementNode,
  TextNode,
  $isTextNode,
  SerializedElementNode,
  RangeSelection,
  $isRangeSelection,
  BaseSelection,
} from 'lexical'

export type SerializedCommentThreadMarkNode = Spread<
  {
    ids: string[]
    resolved: boolean
  },
  SerializedElementNode
>

export class CommentThreadMarkNode extends ElementNode {
  /** @internal */
  __ids: string[]
  __resolved: boolean

  static getType(): string {
    return 'comment-thread-mark'
  }

  static clone(node: CommentThreadMarkNode): CommentThreadMarkNode {
    return new CommentThreadMarkNode(node.__ids ? Array.from(node.__ids) : [], node.__resolved, node.__key)
  }

  static importDOM(): null {
    return null
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
      ids: this.getIDs(),
      resolved: this.__resolved,
      version: 1,
    }
  }

  constructor(ids: string[], resolved?: boolean, key?: NodeKey) {
    super(key)
    this.__ids = ids || []
    this.__resolved = resolved ?? false
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('mark')
    addClassNamesToElement(element, config.theme.mark)
    if (this.getIDs()?.length > 1) {
      addClassNamesToElement(element, config.theme.markOverlap)
    }
    addClassNamesToElement(element, 'Lexical__commentThreadMark')
    return element
  }

  updateDOM(prevNode: CommentThreadMarkNode, element: HTMLElement, config: EditorConfig): boolean {
    const prevIDs = prevNode.getIDs() || []
    const nextIDs = this.getIDs() || []
    const prevIDsCount = prevIDs.length
    const nextIDsCount = nextIDs.length
    const overlapTheme = config.theme.markOverlap

    if (prevIDsCount !== nextIDsCount) {
      if (prevIDsCount === 1) {
        if (nextIDsCount === 2) {
          addClassNamesToElement(element, overlapTheme)
        }
      } else if (nextIDsCount === 1) {
        removeClassNamesFromElement(element, overlapTheme)
      }
    }

    addClassNamesToElement(element, 'Lexical__commentThreadMark')

    if (this.__resolved) {
      addClassNamesToElement(element, 'resolved')
    } else {
      removeClassNamesFromElement(element, 'resolved')
    }

    return false
  }

  hasID(id: string): boolean {
    const ids = this.getIDs()
    for (let i = 0; i < ids.length; i++) {
      if (id === ids[i]) {
        return true
      }
    }
    return false
  }

  getIDs(): string[] {
    const self = this.getLatest()
    return $isCommentThreadMarkNode(self) ? self.__ids : []
  }

  addID(id: string): void {
    const self = this.getWritable()
    if ($isCommentThreadMarkNode(self)) {
      const ids = self.__ids
      self.__ids = ids
      for (let i = 0; i < ids.length; i++) {
        // If we already have it, don't add again
        if (id === ids[i]) {
          return
        }
      }
      ids.push(id)
    }
  }

  deleteID(id: string): void {
    const self = this.getWritable()
    if ($isCommentThreadMarkNode(self)) {
      const ids = self.__ids
      self.__ids = ids
      for (let i = 0; i < ids.length; i++) {
        if (id === ids[i]) {
          ids.splice(i, 1)
          return
        }
      }
    }
  }

  getResolved(): boolean {
    return this.getLatest().__resolved
  }

  setResolved(resolved: boolean): void {
    const writable = this.getWritable()
    writable.__resolved = resolved
  }

  insertNewAfter(_selection: RangeSelection, restoreSelection = true): null | ElementNode {
    const markNode = $createCommentThreadMarkNode(this.__ids)
    this.insertAfter(markNode, restoreSelection)
    return markNode
  }

  canInsertTextBefore(): false {
    return false
  }

  canInsertTextAfter(): false {
    return false
  }

  canBeEmpty(): false {
    return false
  }

  isInline(): true {
    return true
  }

  extractWithChild(child: LexicalNode, selection: BaseSelection, destination: 'clone' | 'html'): boolean {
    if (!$isRangeSelection(selection) || destination === 'html') {
      return false
    }
    const anchor = selection.anchor
    const focus = selection.focus
    const anchorNode = anchor.getNode()
    const focusNode = focus.getNode()
    const isBackward = selection.isBackward()
    const selectionLength = isBackward ? anchor.offset - focus.offset : focus.offset - anchor.offset
    return this.isParentOf(anchorNode) && this.isParentOf(focusNode) && this.getTextContent().length === selectionLength
  }

  excludeFromCopy(destination: 'clone' | 'html'): boolean {
    return destination !== 'clone'
  }
}

export function $createCommentThreadMarkNode(ids: string[], resolved?: boolean): CommentThreadMarkNode {
  return $applyNodeReplacement(new CommentThreadMarkNode(ids, resolved))
}

export function $isCommentThreadMarkNode(node: LexicalNode | null): node is CommentThreadMarkNode {
  return node instanceof CommentThreadMarkNode
}

export function $unwrapCommentThreadMarkNode(node: CommentThreadMarkNode): void {
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

export function $wrapSelectionInCommentThreadMarkNode(
  selection: RangeSelection,
  isBackward: boolean,
  id: string,
): void {
  const nodes = selection.getNodes()
  const anchorOffset = selection.anchor.offset
  const focusOffset = selection.focus.offset
  const nodesLength = nodes.length
  const startOffset = isBackward ? focusOffset : anchorOffset
  const endOffset = isBackward ? anchorOffset : focusOffset
  let currentNodeParent
  let lastCreatedMarkNode

  // We only want wrap adjacent text nodes, line break nodes
  // and inline element nodes. For decorator nodes and block
  // element nodes, we step out of their boundary and start
  // again after, if there are more nodes.
  for (let i = 0; i < nodesLength; i++) {
    const node = nodes[i]
    if ($isElementNode(lastCreatedMarkNode) && lastCreatedMarkNode.isParentOf(node)) {
      // If the current node is a child of the last created mark node, there is nothing to do here
      continue
    }
    const isFirstNode = i === 0
    const isLastNode = i === nodesLength - 1
    let targetNode: LexicalNode | null = null

    if ($isTextNode(node)) {
      // Case 1: The node is a text node and we can split it
      const textContentSize = node.getTextContentSize()
      const startTextOffset = isFirstNode ? startOffset : 0
      const endTextOffset = isLastNode ? endOffset : textContentSize
      if (startTextOffset === 0 && endTextOffset === 0) {
        continue
      }
      const splitNodes = node.splitText(startTextOffset, endTextOffset)
      targetNode =
        splitNodes.length > 1 &&
        (splitNodes.length === 3 || (isFirstNode && !isLastNode) || endTextOffset === textContentSize)
          ? splitNodes[1]
          : splitNodes[0]
    } else if ($isCommentThreadMarkNode(node)) {
      // Case 2: the node is a mark node and we can ignore it as a target,
      // moving on to its children. Note that when we make a mark inside
      // another mark, it may utlimately be unnested by a call to
      // `registerNestedElementResolver<CommentThreadMarkNode>` somewhere else in the
      // codebase.

      continue
    } else if ($isElementNode(node) && node.isInline()) {
      // Case 3: inline element nodes can be added in their entirety to the new
      // mark
      targetNode = node
    }

    if (targetNode !== null) {
      // Now that we have a target node for wrapping with a mark, we can run
      // through special cases.
      if (targetNode && targetNode.is(currentNodeParent)) {
        // The current node is a child of the target node to be wrapped, there
        // is nothing to do here.
        continue
      }
      const parentNode = targetNode.getParent()
      if (parentNode == null || !parentNode.is(currentNodeParent)) {
        // If the parent node is not the current node's parent node, we can
        // clear the last created mark node.
        lastCreatedMarkNode = undefined
      }

      currentNodeParent = parentNode

      if (lastCreatedMarkNode === undefined) {
        // If we don't have a created mark node, we can make one
        lastCreatedMarkNode = $createCommentThreadMarkNode([id])
        targetNode.insertBefore(lastCreatedMarkNode)
      }

      // Add the target node to be wrapped in the latest created mark node
      lastCreatedMarkNode.append(targetNode)
    } else {
      // If we don't have a target node to wrap we can clear our state and
      // continue on with the next node
      currentNodeParent = undefined
      lastCreatedMarkNode = undefined
    }
  }
  // Make selection collapsed at the end
  if ($isElementNode(lastCreatedMarkNode)) {
    if (isBackward) {
      lastCreatedMarkNode.selectStart()
    } else {
      lastCreatedMarkNode.selectEnd()
    }
  }
}

export function $getCommentThreadMarkIDs(node: TextNode, offset: number): null | string[] {
  let currentNode: LexicalNode | null = node
  while (currentNode !== null) {
    if ($isCommentThreadMarkNode(currentNode)) {
      return currentNode.getIDs()
    } else if ($isTextNode(currentNode) && offset === currentNode.getTextContentSize()) {
      const nextSibling = currentNode.getNextSibling()
      if ($isCommentThreadMarkNode(nextSibling)) {
        return nextSibling.getIDs()
      }
    }
    currentNode = currentNode.getParent()
  }
  return null
}
