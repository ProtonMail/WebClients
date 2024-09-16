import { $isListItemNode, $isListNode } from '@lexical/list'
import type { ElementNode } from 'lexical'
import { $nodesOfType, $isElementNode } from 'lexical'
import { $unwrapSuggestionNode } from './Utils'
import { ProtonNode, $isSuggestionNode } from './ProtonNode'

export function $acceptSuggestion(suggestionID: string): boolean {
  const nodes = $nodesOfType(ProtonNode)
  for (const node of nodes) {
    if (!$isSuggestionNode(node)) {
      continue
    }
    const nodeSuggestionID = node.getSuggestionIdOrThrow()
    if (nodeSuggestionID !== suggestionID) {
      continue
    }
    const suggestionType = node.getSuggestionTypeOrThrow()
    if (suggestionType === 'insert') {
      $unwrapSuggestionNode(node)
    } else if (suggestionType === 'delete') {
      node.remove()
    } else if (suggestionType === 'property-change') {
      $unwrapSuggestionNode(node)
    } else if (suggestionType === 'split') {
      node.remove()
    } else if (suggestionType === 'join') {
      const parent = node.getParent()
      let parentNextSibling = parent?.getNextSibling<ElementNode>()
      node.remove()
      if (!$isElementNode(parent) || !$isElementNode(parentNextSibling)) {
        continue
      }
      const parentNextSiblingFirstChild = parentNextSibling.getFirstChild()
      if ($isListNode(parentNextSibling) && $isListItemNode(parentNextSiblingFirstChild)) {
        parentNextSibling = parentNextSiblingFirstChild
      }
      for (const child of parentNextSibling.getChildren()) {
        child.remove()
        parent.append(child)
      }
      parentNextSibling.remove()
    } else {
      node.remove()
    }
  }
  return true
}
