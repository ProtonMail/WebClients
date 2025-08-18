import { $wrapNodeInElement } from '@lexical/utils'
import type { TextFormatType, TextNode } from 'lexical'
import {
  $createRangeSelection,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $isTokenOrSegmented,
  $setSelection,
} from 'lexical'
import { GenerateUUID } from '@proton/docs-shared'
import { $isSuggestionNode, $createSuggestionNode } from './ProtonNode'
import type { PropertyChangeSuggestionProperties } from './Types'
import { $unwrapSuggestionNodeAndResolveIfNeeded } from './removeSuggestionNodeAndResolveIfNeeded'
import type { Logger } from '@proton/utils/logs'

export function $setTextNodeFormatAsSuggestion(
  node: TextNode,
  format: number,
  suggestionID: string,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
) {
  const parent = node.getParent()

  if ($isSuggestionNode(parent)) {
    logger.info('Directly updating format as node is in suggestion')
    node.setFormat(format)

    const isFormatChangeSuggestion = parent.getSuggestionTypeOrThrow() === 'property-change'
    if (isFormatChangeSuggestion) {
      logger.info('Existing suggestion is format change suggestion')

      const suggestionInitialProperties = parent.getSuggestionChangedProperties<PropertyChangeSuggestionProperties>()
      if (!suggestionInitialProperties) {
        return
      }

      const latestFormat = node.getFormat()
      const formatSuggestionInitialFormat = suggestionInitialProperties.__format
      if (latestFormat === formatSuggestionInitialFormat) {
        logger.info('Unwrapping existing suggestion since format was reset to original')
        $unwrapSuggestionNodeAndResolveIfNeeded(parent)
      }
    }

    return
  }

  logger.info('Updating format and wrapping node in suggestion node')
  const initialNodeFormat = node.getFormat()
  node.setFormat(format)
  $wrapNodeInElement(node, () =>
    $createSuggestionNode(suggestionID, 'property-change', {
      __format: initialNodeFormat,
    } satisfies PropertyChangeSuggestionProperties),
  )
  onSuggestionCreation(suggestionID)
}

/**
 * Wraps the current selection in a "property-change" suggestion
 * and toggles the given format for it, while storing the existing
 * format so that it can be reversed on rejection.
 */
export function $formatTextAsSuggestion(
  format: TextFormatType,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  logger.info('Formatting text as suggestion', format)

  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    logger.info('Expected range selection')
    return true
  }

  if (selection.isCollapsed()) {
    logger.info('Directly setting selection format since it is collapsed')
    selection.formatText(format)
    return true
  }

  const suggestionID = GenerateUUID()

  const selectedNodes = selection.getNodes()

  const selectedTextNodes: TextNode[] = []
  for (const selectedNode of selectedNodes) {
    if ($isTextNode(selectedNode)) {
      selectedTextNodes.push(selectedNode)
    }
  }

  const selectedTextNodesLength = selectedTextNodes.length
  if (selectedTextNodesLength === 0) {
    logger.info('Directly setting selection format since no text nodes selected')
    selection.toggleFormat(format)
    return true
  }

  const anchor = selection.anchor
  const focus = selection.focus
  const isBackward = selection.isBackward()
  const startPoint = isBackward ? focus : anchor
  const endPoint = isBackward ? anchor : focus

  let firstIndex = 0
  let firstNode = selectedTextNodes[0]
  let startOffset = startPoint.type === 'element' ? 0 : startPoint.offset

  // In case selection started at the end of text node use next text node
  if (startPoint.type === 'text' && startOffset === firstNode.getTextContentSize()) {
    firstIndex = 1
    firstNode = selectedTextNodes[1]
    startOffset = 0
  }

  if (firstNode == null) {
    logger.info('No usable first node found')
    return true
  }

  const firstNextFormat = firstNode.getFormatFlags(format, null)

  const lastIndex = selectedTextNodesLength - 1
  let lastNode = selectedTextNodes[lastIndex]
  const endOffset = endPoint.type === 'text' ? endPoint.offset : lastNode.getTextContentSize()

  let latestAnchorNode: TextNode | null = null
  const latestAnchorOffset = 0
  let latestFocusNode: TextNode | null = null
  let latestFocusOffset = 0
  let formatForLastSelection = 0
  function updatePointersForLastSelection(node: TextNode, format: number) {
    if (!latestAnchorNode) {
      latestAnchorNode = node
    }
    latestFocusNode = node
    latestFocusOffset = node.getTextContentSize()
    formatForLastSelection = format
  }

  const isSingleNodeSelected = firstNode.is(lastNode)
  if (isSingleNodeSelected) {
    logger.info('Only single node selected')

    const noTextIsSelected = startOffset === endOffset
    if (noTextIsSelected) {
      logger.info('No text selected, skipping')
      return true
    }

    const isEntireTextSelected = startOffset === 0 && endOffset === firstNode.getTextContentSize()

    if ($isTokenOrSegmented(firstNode) || isEntireTextSelected) {
      logger.info('Node is token or is fully selected')
      $setTextNodeFormatAsSuggestion(firstNode, firstNextFormat, suggestionID, onSuggestionCreation, logger)
      updatePointersForLastSelection(firstNode, firstNextFormat)
    } else {
      logger.info('Splitting partially selected node and setting format to the selected')
      const splitNodes = firstNode.splitText(startOffset, endOffset)
      const replacement = startOffset === 0 ? splitNodes[0] : splitNodes[1]
      $setTextNodeFormatAsSuggestion(replacement, firstNextFormat, suggestionID, onSuggestionCreation, logger)
      updatePointersForLastSelection(replacement, firstNextFormat)
    }
  } else {
    logger.info('Multiple nodes are selected')

    if (startOffset !== 0 && !$isTokenOrSegmented(firstNode)) {
      logger.info('First node is partially selected and is not a token, splitting')
      const [, splitNode] = firstNode.splitText(startOffset)
      firstNode = splitNode
      startOffset = 0
    }
    $setTextNodeFormatAsSuggestion(firstNode, firstNextFormat, suggestionID, onSuggestionCreation, logger)
    updatePointersForLastSelection(firstNode, firstNextFormat)

    const lastNextFormat = lastNode.getFormatFlags(format, firstNextFormat)

    if (endOffset > 0) {
      logger.info('Last node has text selected')

      const isNotFullySelected = endOffset !== lastNode.getTextContentSize()
      if (isNotFullySelected && !$isTokenOrSegmented(lastNode)) {
        logger.info('Last node is partially selected and not a token, splitting')
        const [splitNode] = lastNode.splitText(endOffset)
        lastNode = splitNode
      }
      $setTextNodeFormatAsSuggestion(lastNode, lastNextFormat, suggestionID, onSuggestionCreation, logger)
      updatePointersForLastSelection(lastNode, lastNextFormat)
    }

    // Process all text nodes in between
    for (let i = firstIndex + 1; i < lastIndex; i++) {
      const textNode = selectedTextNodes[i]
      const nextFormat = textNode.getFormatFlags(format, lastNextFormat)
      $setTextNodeFormatAsSuggestion(textNode, nextFormat, suggestionID, onSuggestionCreation, logger)
      updatePointersForLastSelection(textNode, nextFormat)
    }
  }

  if (latestAnchorNode && latestFocusNode) {
    logger.info('Fixing selection')
    const newSelection = $createRangeSelection()
    newSelection.setTextNodeRange(latestAnchorNode, latestAnchorOffset, latestFocusNode, latestFocusOffset)
    $setSelection(newSelection)
    newSelection.format = formatForLastSelection
  }

  return true
}
