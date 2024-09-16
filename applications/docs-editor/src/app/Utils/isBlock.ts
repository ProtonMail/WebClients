import {
  type LexicalNode,
  type ElementNode,
  type DecoratorNode,
  $isRootNode,
  $isDecoratorNode,
  $isElementNode,
  $isRootOrShadowRoot,
  $isLineBreakNode,
  $isTextNode,
} from 'lexical'

// https://github.com/facebook/lexical/blob/main/packages/lexical/src/LexicalUtils.ts#L1678
export function $isBlock(node: LexicalNode): node is ElementNode | DecoratorNode<unknown> {
  if ($isRootNode(node) || ($isDecoratorNode(node) && !node.isInline())) {
    return true
  }

  if (!$isElementNode(node) || $isRootOrShadowRoot(node)) {
    return false
  }

  const firstChild = node.getFirstChild()
  const isLeafElement =
    firstChild === null || $isLineBreakNode(firstChild) || $isTextNode(firstChild) || firstChild.isInline()

  return !node.isInline() && node.canBeEmpty() !== false && isLeafElement
}
