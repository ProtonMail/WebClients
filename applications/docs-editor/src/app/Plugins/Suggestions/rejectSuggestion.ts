import { $isListItemNode, $isListNode } from '@lexical/list'
import type { ElementNode } from 'lexical'
import { $nodesOfType, $isElementNode } from 'lexical'
import { $unwrapSuggestionNode } from './Utils'
import { ProtonNode, $isSuggestionNode } from './ProtonNode'

export function $rejectSuggestion(suggestionID: string): boolean {
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
      node.remove()
    } else if (suggestionType === 'delete') {
      $unwrapSuggestionNode(node)
    } else if (suggestionType === 'property-change') {
      const children = node.getChildren()
      const changedProperties = node.__properties.nodePropertiesChanged
      if (!changedProperties) {
        $unwrapSuggestionNode(node)
        continue
      }
      for (const child of children) {
        for (const [key, value] of Object.entries(changedProperties)) {
          const writable = child.getWritable()
          ;(writable as any)[key] = value
        }
      }
      $unwrapSuggestionNode(node)
    } else if (suggestionType === 'split') {
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
    } else if (suggestionType === 'join') {
      node.remove()
    } else {
      node.remove()
    }
  }
  return true
}
