/* eslint-disable no-nested-ternary */
import { $patchStyleText, getStyleObjectFromCSS } from '@lexical/selection'
import type { Logger } from '@proton/utils/logs'
import type { TextNode } from 'lexical'
import { $getSelection, $isElementNode, $isRangeSelection, $isTextNode, $setSelection } from 'lexical'
import { GenerateUUID } from '@proton/docs-core'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode } from './ProtonNode'
import { $wrapNodeInElement } from '@lexical/utils'

export function $patchStyleAsSuggestion(
  property: string,
  value: string | null,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  logger.info(`Patching style as suggestion ${property} ${value}`)
  const selection = $getSelection()

  const patch = {
    [property]: value,
  }

  if (!$isRangeSelection(selection)) {
    logger.info('Selection is not range selection')
    return true
  }

  if (selection.isCollapsed()) {
    logger.info('Patching selection directly as it is collapsed')
    $patchStyleText(selection, patch)
    return true
  }

  const suggestionID = GenerateUUID()

  const nodes = selection.getNodes()
  const nodesLength = nodes.length

  const anchorOffset = selection.anchor.offset
  const focusOffset = selection.focus.offset

  const isBackward = selection.isBackward()
  const startOffset = isBackward ? focusOffset : anchorOffset
  const endOffset = isBackward ? anchorOffset : focusOffset

  let currentNodeParent
  let lastCreatedMarkNode: ProtonNode | null = null

  for (let i = 0; i < nodesLength; i++) {
    const node = nodes[i]

    if ($isElementNode(lastCreatedMarkNode) && lastCreatedMarkNode.isParentOf(node)) {
      // If the current node is a child of the last created mark node, there is nothing to do here
      continue
    }

    const isFirstNode = i === 0
    const isLastNode = i === nodesLength - 1
    let targetNode: TextNode | null = null

    if (!$isTextNode(node)) {
      logger.info('Node is not text node')
      continue
    }

    const textContentSize = node.getTextContentSize()
    const startTextOffset = isFirstNode ? startOffset : 0
    const endTextOffset = isLastNode ? endOffset : textContentSize
    if (startTextOffset === 0 && endTextOffset === 0) {
      logger.info('Start and end offset are both 0')
      continue
    }

    const splitNodes = node.splitText(startTextOffset, endTextOffset)
    const isAtEndOfTextNode = splitNodes.length === 1 && startTextOffset === textContentSize
    if (isAtEndOfTextNode) {
      logger.info('Is at end of text node')
      continue
    }

    targetNode =
      splitNodes.length > 1 &&
      (splitNodes.length === 3 || (isFirstNode && !isLastNode) || endTextOffset === textContentSize)
        ? splitNodes[1]
        : splitNodes[0]

    if (targetNode === null) {
      logger.info('No target node, clearing state and moving onto next')
      currentNodeParent = undefined
      lastCreatedMarkNode = null
      continue
    }

    const parentNode = targetNode.getParent()
    if (parentNode == null || !parentNode.is(currentNodeParent)) {
      // If the parent node is not the current node's parent node, we can
      // clear the last created mark node.
      lastCreatedMarkNode = null
    }

    currentNodeParent = parentNode

    const styleObj = getStyleObjectFromCSS(targetNode.getStyle())
    const existingValue = styleObj[property] || null

    lastCreatedMarkNode = $wrapNodeInElement(targetNode, () =>
      $createSuggestionNode(suggestionID, 'style-change', {
        [property]: existingValue,
      }),
    ) as ProtonNode

    const selectionToPatch = targetNode.select(0, targetNode.getTextContentSize())
    $patchStyleText(selectionToPatch, patch)
  }

  $setSelection(selection.clone())

  onSuggestionCreation(suggestionID)

  return true
}
