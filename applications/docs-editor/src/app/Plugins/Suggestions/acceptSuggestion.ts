import { $isListItemNode, $isListNode } from '@lexical/list'
import type { ElementNode } from 'lexical'
import { $nodesOfType, $isElementNode, $isRootOrShadowRoot } from 'lexical'
import { $joinNonInlineLeafElements, $unwrapSuggestionNode } from './Utils'
import { ProtonNode, $isSuggestionNode } from './ProtonNode'
import { $findMatchingParent } from '@lexical/utils'
import { $deleteTableColumn, $isTableCellNode, $isTableNode, $isTableRowNode } from '@lexical/table'
import { $isNonInlineLeafElement } from '../../Utils/isNonInlineLeafElement'

/**
 * Joins the closest non-inline leaf element parent of the given
 * suggestion node with the next, if available.
 * If the element about to be joined has block-level suggestions,
 * those will be removed and the related suggestion resolved if necessary.
 */
function $joinNonInlineLeafElementWithNext(suggestionNode: ProtonNode) {
  const closestNonInlineParent = $findMatchingParent(suggestionNode, $isNonInlineLeafElement)
  let siblingElementToJoin = closestNonInlineParent?.getNextSibling<ElementNode>()
  suggestionNode.remove()
  if (!closestNonInlineParent) {
    return
  }
  if (!siblingElementToJoin) {
    let grandparent = closestNonInlineParent.getParent()
    // If we are in a nested element, we walk up the tree to find
    // the next closest non-inline leaf element that should be joined.
    // This mostly only happens when attempting to join in a nested
    // list element.
    while (grandparent !== null && !$isRootOrShadowRoot(grandparent)) {
      const nextSibling = grandparent.getNextSibling()
      if (nextSibling && $isNonInlineLeafElement(nextSibling)) {
        siblingElementToJoin = nextSibling
        break
      } else if ($isElementNode(nextSibling)) {
        const firstChild = nextSibling.getFirstChild()
        if (firstChild && $isNonInlineLeafElement(firstChild)) {
          siblingElementToJoin = firstChild
          break
        }
      }
      grandparent = grandparent.getParent()
    }
  }
  if (!$isElementNode(siblingElementToJoin)) {
    return
  }
  const parentNextSiblingFirstChild = siblingElementToJoin.getFirstChild()
  if ($isListNode(siblingElementToJoin) && $isListItemNode(parentNextSiblingFirstChild)) {
    siblingElementToJoin = parentNextSiblingFirstChild
  }
  $joinNonInlineLeafElements(closestNonInlineParent, siblingElementToJoin)
}

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
      $joinNonInlineLeafElementWithNext(node)
    } else if (suggestionType === 'link-change') {
      $unwrapSuggestionNode(node)
    } else if (suggestionType === 'style-change') {
      $unwrapSuggestionNode(node)
    } else if (suggestionType === 'image-change') {
      $unwrapSuggestionNode(node)
    } else if (suggestionType === 'indent-change') {
      $unwrapSuggestionNode(node)
    } else if (suggestionType === 'insert-table') {
      node.remove()
    } else if (suggestionType === 'delete-table') {
      const table = $findMatchingParent(node, $isTableNode)
      node.remove()
      if (table) {
        table.remove()
      }
    } else if (suggestionType === 'insert-table-row' || suggestionType === 'duplicate-table-row') {
      node.remove()
    } else if (suggestionType === 'delete-table-row') {
      const row = $findMatchingParent(node, $isTableRowNode)
      node.remove()
      if (row) {
        row.remove()
      }
    } else if (suggestionType === 'insert-table-column' || suggestionType === 'duplicate-table-column') {
      node.remove()
    } else if (suggestionType === 'delete-table-column') {
      const cell = $findMatchingParent(node, $isTableCellNode)
      node.remove()
      if (cell) {
        const index = cell.getIndexWithinParent()
        const table = $findMatchingParent(cell, $isTableNode)
        if (!table) {
          continue
        }
        $deleteTableColumn(table, index)
      }
    } else if (suggestionType === 'block-type-change') {
      node.remove()
    } else if (suggestionType === 'align-change') {
      node.remove()
    } else if (suggestionType === 'clear-formatting') {
      $unwrapSuggestionNode(node)
    } else {
      $unwrapSuggestionNode(node)
    }
  }
  return true
}
