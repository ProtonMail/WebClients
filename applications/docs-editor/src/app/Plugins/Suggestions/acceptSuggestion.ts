import { $isListItemNode, $isListNode } from '@lexical/list'
import type { ElementNode } from 'lexical'
import { $nodesOfType, $isElementNode } from 'lexical'
import { $unwrapSuggestionNode } from './Utils'
import { ProtonNode, $isSuggestionNode } from './ProtonNode'
import { $findMatchingParent } from '@lexical/utils'
import { $deleteTableColumn, $isTableCellNode, $isTableNode, $isTableRowNode } from '@lexical/table'

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
    } else {
      $unwrapSuggestionNode(node)
    }
  }
  return true
}
