import { $getNearestBlockElementAncestorOrThrow, $wrapNodeInElement } from '@lexical/utils'
import { GenerateUUID } from '@proton/docs-shared'
import { $getSelection, $isRangeSelection, $isTextNode } from 'lexical'
import { $createSuggestionNode } from './ProtonNode'

export function $clearFormattingAsSuggestion(onSuggestionCreation: (id: string) => void): boolean {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    return true
  }

  const anchor = selection.anchor
  const focus = selection.focus
  const nodes = selection.getNodes()
  const extractedNodes = selection.extract()

  const isCollapsed = anchor.key === focus.key && anchor.offset === focus.offset
  if (isCollapsed) {
    return true
  }

  if (!nodes.length) {
    return true
  }

  const suggestionID = GenerateUUID()

  let didCreateSuggestion = false

  for (let index = 0; index < nodes.length; index++) {
    let node = nodes[index]
    if (!node) {
      throw new Error('Could not find node at index')
    }

    // We split the first and last node by the selection
    // So that we don't format unselected text inside those nodes
    if ($isTextNode(node)) {
      // Use a separate variable to ensure TS does not lose the refinement
      let textNode = node
      if (index === 0 && anchor.offset !== 0) {
        textNode = textNode.splitText(anchor.offset)[1] || textNode
      }
      if (index === nodes.length - 1) {
        textNode = textNode.splitText(focus.offset)[0] || textNode
      }

      /**
       * If the selected text has one format applied
       * selecting a portion of the text, could
       * clear the format to the wrong portion of the text.
       *
       * The cleared text is based on the length of the selected text.
       */
      // We need this in case the selected text only has one format
      const extractedTextNode = extractedNodes[0]
      if (nodes.length === 1 && $isTextNode(extractedTextNode)) {
        textNode = extractedTextNode
      }

      const initialStyle = textNode.__style
      const initialFormat = textNode.__format

      if (textNode.__style !== '') {
        textNode.setStyle('')
      }
      if (textNode.__format !== 0) {
        textNode.setFormat(0)
        $getNearestBlockElementAncestorOrThrow(textNode).setFormat('')
      }

      $wrapNodeInElement(textNode, () =>
        $createSuggestionNode(suggestionID, 'clear-formatting', {
          initialStyle,
          initialFormat,
        }),
      )
      didCreateSuggestion = true

      node = textNode
    }
  }

  if (didCreateSuggestion) {
    onSuggestionCreation(suggestionID)
  }

  return true
}
