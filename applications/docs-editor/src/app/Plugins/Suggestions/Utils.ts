import type { ElementNode, LexicalNode, RangeSelection, TextNode } from 'lexical'
import { $isDecoratorNode, $isElementNode, $isTextNode } from 'lexical'
import type { SuggestionType } from './Types'
import { $isImageNode } from '../Image/ImageNode'
import type { ProtonNode } from './ProtonNode'
import { $isSuggestionNode, $createSuggestionNode } from './ProtonNode'
import { $findMatchingParent } from '@lexical/utils'

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
): ProtonNode[] {
  const nodes = selection.getNodes()
  const anchorOffset = selection.anchor.offset
  const focusOffset = selection.focus.offset
  const nodesLength = nodes.length
  const startOffset = isBackward ? focusOffset : anchorOffset
  const endOffset = isBackward ? anchorOffset : focusOffset
  let currentNodeParent
  let lastCreatedMarkNode: ProtonNode | null = null

  const createdMarkNodes: ProtonNode[] = []

  // We only want wrap adjacent text nodes, line break nodes
  // and inline element nodes. For decorator nodes and block
  // element nodes, we step out of their boundary and start
  // again after, if there are more nodes.
  for (let i = 0; i < nodesLength; i++) {
    const node = nodes[i]
    if ($isElementNode(lastCreatedMarkNode) && lastCreatedMarkNode.isParentOf(node)) {
      // If the current node is a child of the last created mark node, there is nothing to do here
      continue
    }
    const isFirstNode = i === 0
    const isLastNode = i === nodesLength - 1
    let targetNode: LexicalNode | null = null

    if ($isTextNode(node)) {
      // Case 1: The node is a text node and we can split it
      const textContentSize = node.getTextContentSize()
      const startTextOffset = isFirstNode ? startOffset : 0
      const endTextOffset = isLastNode ? endOffset : textContentSize
      if (startTextOffset === 0 && endTextOffset === 0) {
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
          const joinNode = $createSuggestionNode(id, 'join')
          node.insertAfter(joinNode)
          lastCreatedMarkNode = joinNode
          createdMarkNodes.push(joinNode)
        }
        continue
      }
      targetNode =
        splitNodes.length > 1 &&
        (splitNodes.length === 3 || (isFirstNode && !isLastNode) || endTextOffset === textContentSize)
          ? splitNodes[1]
          : splitNodes[0]
    } else if ($isSuggestionNode(node)) {
      // Case 2: the node is a mark node and we can ignore it as a target,
      // moving on to its children. Note that when we make a mark inside
      // another mark, it may utlimately be unnested by a call to
      // `registerNestedElementResolver<SuggestionNode>` somewhere else in the
      // codebase.
      continue
    } else if ($isElementNode(node) && node.isInline()) {
      // Case 3: inline element nodes can be added in their entirety to the new
      // mark
      targetNode = node
    } else if ($isImageNode(node)) {
      targetNode = node
    }

    if (targetNode !== null) {
      // Now that we have a target node for wrapping with a mark, we can run
      // through special cases.
      if (targetNode && targetNode.is(currentNodeParent)) {
        // The current node is a child of the target node to be wrapped, there
        // is nothing to do here.
        continue
      }

      const parentNode = targetNode.getParent()
      if (parentNode == null || !parentNode.is(currentNodeParent)) {
        // If the parent node is not the current node's parent node, we can
        // clear the last created mark node.
        lastCreatedMarkNode = null
      }

      currentNodeParent = parentNode

      if (lastCreatedMarkNode === null) {
        // If we don't have a created mark node, we can make one
        lastCreatedMarkNode = $createSuggestionNode(id, type)
        targetNode.insertBefore(lastCreatedMarkNode)
        createdMarkNodes.push(lastCreatedMarkNode)
      }

      // Add the target node to be wrapped in the latest created mark node
      lastCreatedMarkNode.append(targetNode)
    } else {
      // If we don't have a target node to wrap we can clear our state and
      // continue on with the next node
      currentNodeParent = undefined
      lastCreatedMarkNode = null
    }
  }

  // Make selection collapsed at the end
  if ($isSuggestionNode(lastCreatedMarkNode)) {
    if (isBackward) {
      lastCreatedMarkNode.selectStart()
    } else {
      lastCreatedMarkNode.selectEnd()
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
