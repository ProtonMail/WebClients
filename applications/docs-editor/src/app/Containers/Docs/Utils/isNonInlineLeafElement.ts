import {
  type LexicalNode,
  type ElementNode,
  $isDecoratorNode,
  $isElementNode,
  $isRootOrShadowRoot,
  $isLineBreakNode,
  $isTextNode,
} from 'lexical'

// https://github.com/facebook/lexical/blob/main/packages/lexical/src/LexicalUtils.ts#L1678
/**
 * This function can be used to determine whether the given node is a non-inline
 * element which can be empty and where inline nodes can generally be inserted.
 * This is named `INTERNAL_$isBlock` in the Lexical codebase, however that doesn't
 * correctly convey the usecase since this element doesn't have to be a top-level
 * block (i.e. a node whose parent is root or a shadow root node)
 */
export function $isNonInlineLeafElement(node: LexicalNode): node is ElementNode {
  if ($isDecoratorNode(node)) {
    return false
  }

  if (!$isElementNode(node) || $isRootOrShadowRoot(node)) {
    return false
  }

  const firstChild = node.getFirstChild()
  const isLeafElement =
    firstChild === null || $isLineBreakNode(firstChild) || $isTextNode(firstChild) || firstChild.isInline()

  return !node.isInline() && node.canBeEmpty() !== false && isLeafElement
}
