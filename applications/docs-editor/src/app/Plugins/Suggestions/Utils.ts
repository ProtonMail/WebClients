import type { ElementNode, LexicalNode, RangeSelection, TextNode } from 'lexical'
import { $isDecoratorNode, $isElementNode, $isTextNode } from 'lexical'
import type { SuggestionProperties } from './Types'
import type { SuggestionType } from '@proton/docs-shared/lib/SuggestionType'
import { $isImageNode } from '../Image/ImageNode'
import type { ProtonNode } from './ProtonNode'
import { $isSuggestionNode, $createSuggestionNode } from './ProtonNode'
import { $findMatchingParent, $insertFirst } from '@lexical/utils'
import type { Logger } from '@proton/utils/logs'
import type { TableCellNode, TableRowNode } from '@lexical/table'
import { $isTableNode } from '@lexical/table'

/**
 * Wraps a given selection with suggestion node(s), splitting
 * text nodes where required and making sure not to wrap whole
 * block nodes.
 */
export function $wrapSelectionInSuggestionNode(
  selection: RangeSelection,
  isBackward: boolean,
  id: string,
  type: SuggestionType,
  logger?: Logger,
  changedProperties?: SuggestionProperties['nodePropertiesChanged'],
): ProtonNode[] {
  const nodes = selection.getNodes()

  const anchor = selection.anchor
  const anchorOffset = selection.anchor.offset

  const focus = selection.focus
  const focusOffset = selection.focus.offset

  const nodesLength = nodes.length
  const startOffset = isBackward ? focusOffset : anchorOffset
  const endOffset = isBackward ? anchorOffset : focusOffset

  let currentNodeParent
  let lastCreatedMarkNode: ProtonNode | null = null

  const info = { nodesLength, anchorOffset, focusOffset, isBackward, startOffset, endOffset }
  logger?.info('Wrapping selection in suggestion node', info)

  const createdMarkNodes: ProtonNode[] = []

  // We only want wrap adjacent text nodes, line break nodes
  // and inline element nodes. For decorator nodes and block
  // element nodes, we step out of their boundary and start
  // again after, if there are more nodes.
  for (let i = 0; i < nodesLength; i++) {
    const node = nodes[i]

    if ($isElementNode(lastCreatedMarkNode) && lastCreatedMarkNode.isParentOf(node)) {
      logger?.info('Last created suggestion node is parent of current node')
      continue
    }

    const isFirstNode = i === 0
    const isLastNode = i === nodesLength - 1
    const nodeInfo = { type: node.__type, isFirstNode, isLastNode }
    logger?.info('Current node:', nodeInfo)

    let targetNode: LexicalNode | null = null

    if ($isTextNode(node)) {
      const textContentSize = node.getTextContentSize()
      const startTextOffset = isFirstNode ? startOffset : 0
      const endTextOffset = isLastNode ? endOffset : textContentSize
      const loggerInfo = { textContentSize, startTextOffset, endTextOffset }
      logger?.info('Splitting text node', loggerInfo)

      if (startTextOffset === 0 && endTextOffset === 0) {
        logger?.info('Not splitting text node because start and end offset are both 0')
        continue
      }

      const splitNodes = node.splitText(startTextOffset, endTextOffset)

      const isAtEndOfTextNode = splitNodes.length === 1 && startTextOffset === textContentSize
      if (isAtEndOfTextNode) {
        const nonInlineParent = $findMatchingParent(
          node,
          (node): node is ElementNode => $isElementNode(node) && !node.isInline(),
        )
        const isLastDescendant = node.is(nonInlineParent?.getLastDescendant())
        if (type === 'delete' && isLastDescendant) {
          logger?.info('Adding join node because start offset is at end of text node which is also the last descendant')
          const joinNode = $createSuggestionNode(id, 'join')
          node.insertAfter(joinNode)
          lastCreatedMarkNode = joinNode
          createdMarkNodes.push(joinNode)
        }
        logger?.info('Not splitting text not because at end of text node')
        continue
      }

      targetNode =
        splitNodes.length > 1 &&
        (splitNodes.length === 3 || (isFirstNode && !isLastNode) || endTextOffset === textContentSize)
          ? splitNodes[1]
          : splitNodes[0]
    } else if ($isSuggestionNode(node)) {
      logger?.info('Ignoring existing suggestion node')
      continue
    } else if ($isElementNode(node) && node.isInline()) {
      logger?.info('Node is inline element node')

      const isFullyWithinSelection = !node.isParentOf(anchor.getNode()) && !node.isParentOf(focus.getNode())
      if (isFullyWithinSelection) {
        logger?.info('Node is fully within selection')
        targetNode = node
      }
    } else if ($isImageNode(node)) {
      logger?.info('Node is image node')
      targetNode = node
    } else if ($isTableNode(node)) {
      logger?.info('Node is table node')

      if (type !== 'delete' && type !== 'insert') {
        // We only want to wrap whole table node if it is a insert
        // or delete suggestion
        continue
      }

      const isFullyWithinSelection = !node.isParentOf(anchor.getNode()) && !node.isParentOf(focus.getNode())
      if (!isFullyWithinSelection) {
        continue
      }

      const tableRows = node.getChildren<TableRowNode>()
      const tableCells = tableRows.map((row) => row.getChildren<TableCellNode>()).flat()
      const tableSuggestionType: SuggestionType = type === 'insert' ? 'insert-table' : 'delete-table'
      for (const cell of tableCells) {
        $insertFirst(cell, $createSuggestionNode(id, tableSuggestionType))
      }
    }

    if (targetNode !== null) {
      if (targetNode && targetNode.is(currentNodeParent)) {
        logger?.info('Current node is a child of the target node to be wrapped')
        continue
      }

      const parentNode = targetNode.getParent()
      if (parentNode == null || !parentNode.is(currentNodeParent)) {
        logger?.info("Parent node is not the current node's parent node")
        lastCreatedMarkNode = null
      }

      currentNodeParent = parentNode

      if (lastCreatedMarkNode === null) {
        logger?.info('Creating new suggestion node')
        lastCreatedMarkNode = $createSuggestionNode(id, type, changedProperties)
        targetNode.insertBefore(lastCreatedMarkNode)
        createdMarkNodes.push(lastCreatedMarkNode)
      }

      logger?.info('Appending target node to last created suggestion node', lastCreatedMarkNode)
      lastCreatedMarkNode.append(targetNode)
    } else {
      logger?.info('Clearing state because no target node found')
      currentNodeParent = undefined
      lastCreatedMarkNode = null
    }
  }

  if (createdMarkNodes.length > 0) {
    logger?.info('Collapsing selection')
    if (isBackward) {
      createdMarkNodes[0].selectStart()
    } else {
      createdMarkNodes[createdMarkNodes.length - 1].selectEnd()
    }
  }

  return createdMarkNodes
}

/**
 * Unwraps a given suggestion node i.e. removes the wrapper
 * suggestion node while keeping the children intent
 */
export function $unwrapSuggestionNode(node: ProtonNode): void {
  const children = node.getChildren()
  let target = null
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (target === null) {
      node.insertBefore(child)
    } else {
      target.insertAfter(child)
    }
    target = child
  }
  node.remove()
}

/**
 * Gets the parent suggestion ID for a given text node.
 * Used for getting the ID of the currently active
 * suggestion, i.e., the suggestion which the cursor is inside of.
 */
export function $getSuggestionID(node: TextNode, offset: number): string | null {
  let currentNode: LexicalNode | null = node
  while (currentNode !== null) {
    if ($isSuggestionNode(currentNode)) {
      return currentNode.getSuggestionIdOrThrow()
    } else if ($isTextNode(currentNode) && offset === currentNode.getTextContentSize()) {
      const nextSibling = currentNode.getNextSibling()
      if ($isSuggestionNode(nextSibling)) {
        return nextSibling.getSuggestionIdOrThrow()
      }
    }
    currentNode = currentNode.getParent()
  }
  return null
}

/**
 * Gets the target range from a given InputEvent,
 * which can then be used to be update the Lexical
 * selection before insertion.
 *
 * https://github.com/facebook/lexical/blob/main/packages/lexical/src/LexicalEvents.ts#L496
 */
export function getTargetRangeFromInputEvent(event: InputEvent): null | StaticRange {
  if (!event.getTargetRanges) {
    return null
  }
  const targetRanges = event.getTargetRanges()
  if (targetRanges.length === 0) {
    return null
  }
  return targetRanges[0]
}

/**
 * Determines whether a node is not inline
 * https://github.com/facebook/lexical/blob/main/packages/lexical/src/LexicalSelection.ts#L1344
 */
export function $isNodeNotInline(node: LexicalNode) {
  return ($isElementNode(node) || $isDecoratorNode(node)) && !node.isInline()
}

/**
 * Given a certain inputType, it returns what selection boundary should be used for deletion and whether the
 * deletion is forward or backward.
 */
export function getBoundaryForDeletion(inputType: string): ['character' | 'word' | 'lineboundary' | null, boolean] {
  switch (inputType) {
    case 'deleteContentBackward':
      return ['character', true]
    case 'deleteContent':
    case 'deleteContentForward':
      return ['character', false]
    case 'deleteWordBackward':
      return ['word', true]
    case 'deleteWordForward':
      return ['word', false]
    case 'deleteHardLineBackward':
    case 'deleteSoftLineBackward':
      return ['lineboundary', true]
    case 'deleteHardLineForward':
    case 'deleteSoftLineForward':
      return ['lineboundary', false]
    default:
      return [null, false]
  }
}

export function $mergeWithExistingSuggestionNode(node: ProtonNode, mergeWith: ProtonNode, isBackward = false) {
  for (const child of node.getChildren()) {
    const lastChild = mergeWith.getLastChild()
    if (lastChild) {
      child.remove()
      if (isBackward) {
        lastChild.insertBefore(child)
      } else {
        lastChild.insertAfter(child)
      }
    }
  }
  node.remove()
}

/**
 * Checks if the given selection is fully within a suggestion
 */
export function $isWholeSelectionInsideSuggestion(selection: RangeSelection): boolean {
  const focusNode = selection.focus.getNode()
  const focusSuggestionParent = $findMatchingParent(focusNode, $isSuggestionNode)
  if (!focusSuggestionParent) {
    return false
  }

  const anchorNode = selection.anchor.getNode()
  const anchorSuggestionParent = $findMatchingParent(anchorNode, $isSuggestionNode)
  if (!anchorSuggestionParent) {
    return false
  }

  const isSameSuggestion =
    focusSuggestionParent.getSuggestionIdOrThrow() === anchorSuggestionParent.getSuggestionIdOrThrow()

  return isSameSuggestion
}
