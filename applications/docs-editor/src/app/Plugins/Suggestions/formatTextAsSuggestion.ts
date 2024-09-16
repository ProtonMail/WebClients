import { $wrapNodeInElement } from '@lexical/utils'
import type { TextFormatType, TextNode } from 'lexical'
import { $createRangeSelection, $getSelection, $isRangeSelection, $isTextNode, $setSelection } from 'lexical'
import { GenerateUUID } from '@proton/docs-core'
import { $isSuggestionNode, $createSuggestionNode } from './ProtonNode'

/**
 * Wraps the current selection in a "property-change" suggestion
 * and toggles the given format for it, while storing the existing
 * format so that it can be reversed on rejection.
 */
export function $formatTextAsSuggestion(format: TextFormatType, onSuggestionCreation: (id: string) => void): boolean {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    return true
  }
  if (selection.isCollapsed()) {
    selection.formatText(format)
    return true
  }
  const suggestionID = GenerateUUID()
  const nodes = selection.extract()
  let anchorNode: TextNode | null = null
  let anchorOffset = 0
  let focusNode: TextNode | null = null
  let focusOffset = 0
  let didCreateSuggestionNode = false
  for (const node of nodes) {
    if (!$isTextNode(node)) {
      continue
    }
    if ($isSuggestionNode(node.getParent())) {
      node.toggleFormat(format)
      continue
    }
    $wrapNodeInElement(node, () =>
      $createSuggestionNode(suggestionID, 'property-change', {
        __format: node.getFormat(),
      }),
    )
    didCreateSuggestionNode = true
    node.toggleFormat(format)
    if (!anchorNode) {
      anchorNode = node
    }
    focusNode = node
    focusOffset = node.getTextContentSize()
  }
  if (didCreateSuggestionNode) {
    onSuggestionCreation(suggestionID)
  }
  if (anchorNode && focusNode) {
    const newSelection = $createRangeSelection()
    newSelection.setTextNodeRange(anchorNode, anchorOffset, focusNode, focusOffset)
    $setSelection(newSelection)
  }
  return true
}
