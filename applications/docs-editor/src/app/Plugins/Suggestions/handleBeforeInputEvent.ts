import { $insertDataTransferForRichText } from '@lexical/clipboard'
import { $isCodeNode } from '@lexical/code'
import { $findMatchingParent } from '@lexical/utils'
import { GenerateUUID } from '@proton/docs-core'
import type { LexicalEditor, ElementNode, RangeSelection } from 'lexical'
import {
  UNDO_COMMAND,
  REDO_COMMAND,
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  $createParagraphNode,
  $isRootNode,
  $createTextNode,
  $isTextNode,
  $insertNodes,
  $isLineBreakNode,
} from 'lexical'
import { $isBlock } from '../../Utils/isBlock'
import { $splitNodeAtPoint } from '../../Utils/splitNodeAtPoint'
import { DeleteInputTypes, InsertionInputTypes } from './InputTypes'
import type { ProtonNode } from './ProtonNode'
import { $isSuggestionNode, $createSuggestionNode } from './ProtonNode'
import {
  getTargetRangeFromInputEvent,
  $isPointAtStartOfBlock,
  $wrapSelectionInSuggestionNode,
  getBoundaryForDeletion,
  $mergeWithExistingSuggestionNode,
} from './Utils'
import type { Logger } from '@proton/utils/logs'

/**
 * This is the main core of suggestion mode. It handles input events,
 * and based on the input type and data received, makes decisions on
 * how and where to create suggestion nodes.
 */
export function $handleBeforeInputEvent(
  editor: LexicalEditor,
  event: InputEvent,
  onSuggestionCreation: (id: string) => void,
  logger?: Logger,
): boolean {
  const inputType = event.inputType

  logger?.info('handleBeforeInput', inputType)

  if (inputType === 'historyUndo') {
    editor.dispatchCommand(UNDO_COMMAND, undefined)
    return false
  }

  if (inputType === 'historyRedo') {
    editor.dispatchCommand(REDO_COMMAND, undefined)
    return false
  }

  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    return true
  }

  const suggestionID = GenerateUUID()

  const focusNode = selection.focus.getNode()

  if ($findMatchingParent(focusNode, $isCodeNode)) {
    logger?.info('Aborting beforeinput because selection is inside a code-block')
    return true
  }

  if (DeleteInputTypes.includes(inputType)) {
    return $handleDeleteInput(inputType, selection, suggestionID, onSuggestionCreation, logger)
  }

  if (InsertionInputTypes.includes(inputType)) {
    return $handleInsertInput(editor, event, inputType, selection, suggestionID, onSuggestionCreation, logger)
  }

  return true
}

function $handleDeleteInput(
  inputType: string,
  selection: RangeSelection,
  suggestionID: string,
  onSuggestionCreation: (id: string) => void,
  logger?: Logger,
): boolean {
  const [boundary, isBackward] = getBoundaryForDeletion(inputType)

  let suggestionNode: ProtonNode | null = null

  const isSelectionCollapsed = selection.isCollapsed()

  logger?.info(
    'Handling delete: ',
    `boundary: ${boundary} `,
    `isBackward: ${isBackward} `,
    `isSelectionCollapsed: ${isSelectionCollapsed}`,
  )

  if (isSelectionCollapsed && boundary !== null) {
    if ($isPointAtStartOfBlock(selection.focus) && isBackward) {
      const focusNode = selection.focus.getNode()
      const topLevelElement = focusNode.getTopLevelElement()
      const topLevelPrevSibling = topLevelElement?.getPreviousSibling()
      if (!$isElementNode(topLevelPrevSibling)) {
        return true
      }

      const lastChild = topLevelPrevSibling.getLastChild()
      const doesJoinSuggestionAlreadyExist =
        $isSuggestionNode(lastChild) && lastChild.getSuggestionTypeOrThrow() === 'join'
      if (doesJoinSuggestionAlreadyExist) {
        return true
      }

      const joinSuggestion = $createSuggestionNode(suggestionID, 'join')
      topLevelPrevSibling.append(joinSuggestion)
      joinSuggestion.selectStart()
      onSuggestionCreation(suggestionID)
      return true
    }

    selection.modify('extend', isBackward, boundary)
  }

  const anchorNode = selection.anchor.getNode()
  const focusNode = selection.focus.getNode()
  const existingParentSuggestion = $findMatchingParent(focusNode, $isSuggestionNode)

  const isWholeSelectionInsideExistingSuggestion =
    existingParentSuggestion?.isParentOf(anchorNode) && existingParentSuggestion.isParentOf(focusNode)

  if (!isWholeSelectionInsideExistingSuggestion || existingParentSuggestion?.getSuggestionTypeOrThrow() !== 'delete') {
    suggestionNode = $wrapSelectionInSuggestionNode(selection, selection.isBackward(), suggestionID, 'delete')
  }

  if (isBackward && suggestionNode) {
    suggestionNode.selectPrevious()
  }

  if (!suggestionNode) {
    return true
  }

  if (isWholeSelectionInsideExistingSuggestion) {
    suggestionNode.remove()
    return true
  }

  const prevSibling = suggestionNode.getPreviousSibling()
  const nextSibling = suggestionNode.getNextSibling()
  if ($isSuggestionNode(prevSibling) && prevSibling.getSuggestionTypeOrThrow() === 'delete') {
    $mergeWithExistingSuggestionNode(suggestionNode, prevSibling, false)
    logger?.info('Merged delete suggestion with prev delete sibling')
  } else if ($isSuggestionNode(nextSibling) && nextSibling.getSuggestionTypeOrThrow() === 'delete') {
    $mergeWithExistingSuggestionNode(suggestionNode, nextSibling, true)
    logger?.info('Merged delete suggestion with next delete sibling')
  } else {
    onSuggestionCreation(suggestionID)
  }

  return true
}

function $handleInsertInput(
  editor: LexicalEditor,
  event: InputEvent,
  inputType: string,
  selection: RangeSelection,
  suggestionID: string,
  onSuggestionCreation: (id: string) => void,
  logger?: Logger,
): boolean {
  const focusNode = selection.focus.getNode()
  const existingParentSuggestion = $findMatchingParent(focusNode, $isSuggestionNode)

  const data = event.data
  const dataTransfer = event.dataTransfer
  const targetRange = getTargetRangeFromInputEvent(event)

  logger?.info(
    'Handling insert input type: ',
    `Has data: ${data} `,
    `Has data transfer: ${!!dataTransfer} `,
    `Has targetRange: ${!!targetRange}`,
  )

  if (!selection.isCollapsed()) {
    logger?.info('Wrapping non-collapsed selection in a delete suggestion')
    const suggestionNode = $wrapSelectionInSuggestionNode(selection, selection.isBackward(), suggestionID, 'delete')
    if (existingParentSuggestion) {
      logger?.info('Removing the wrapped suggestion as it is inside an existing one')
      suggestionNode?.remove()
    } else {
      onSuggestionCreation(suggestionID)
    }
  }

  const latestSelection = $getSelection()
  if (!$isRangeSelection(latestSelection)) {
    return true
  }

  if (inputType === 'insertParagraph') {
    return $handleInsertParagraph(latestSelection, suggestionID, onSuggestionCreation, logger)
  }

  if (
    inputType !== 'insertText' &&
    latestSelection.isCollapsed() &&
    !$isRootNode(latestSelection.anchor.getNode()) &&
    targetRange
  ) {
    logger?.info('Applying targetRange to current selection')
    latestSelection.applyDOMRange(targetRange)
  }

  if (data === null && dataTransfer !== null) {
    logger?.info('Inserting data transfer')
    $insertDataTransferForRichText(dataTransfer, latestSelection, editor)
    return true
  }

  if (data !== null && dataTransfer === null) {
    return $handleInsertTextData(data, selection, existingParentSuggestion, onSuggestionCreation, suggestionID, logger)
  }

  return true
}

function $handleInsertParagraph(
  selection: RangeSelection,
  suggestionID: string,
  onSuggestionCreation: (id: string) => void,
  logger?: Logger,
): boolean {
  const currentElement = selection.focus.getNode().getTopLevelElement()
  if (!currentElement) {
    return true
  }

  if ($isPointAtStartOfBlock(selection.focus)) {
    logger?.info('Will create a paragraph with a split suggestion since selection is at start of the block')
    const paragraph = $createParagraphNode()
    const split = $createSuggestionNode(suggestionID, 'split')
    paragraph.append(split)
    if ($isElementNode(currentElement.getPreviousSibling())) {
      const lastChild = currentElement.getPreviousSibling<ElementNode>()!.getLastChild()
      if ($isSuggestionNode(lastChild) && lastChild.getSuggestionTypeOrThrow() === 'split') {
        split.setSuggestionId(lastChild.getSuggestionIdOrThrow())
      }
    }
    currentElement.insertBefore(paragraph)
    onSuggestionCreation(split.getSuggestionIdOrThrow())
    return true
  }

  const insertedNode = selection.insertParagraph()
  if (!insertedNode) {
    return true
  }

  const splitStart = $createSuggestionNode(suggestionID, 'split')
  const prevSibling = insertedNode.getPreviousSibling()
  if (!$isElementNode(prevSibling)) {
    return false
  }

  prevSibling.append(splitStart)

  const splitSuggestionPrevSibling = splitStart.getPreviousSibling()
  if ($isSuggestionNode(splitSuggestionPrevSibling)) {
    splitStart.setSuggestionId(splitSuggestionPrevSibling.getSuggestionIdOrThrow())
  } else if ($isElementNode(currentElement.getPreviousSibling())) {
    const lastChild = currentElement.getPreviousSibling<ElementNode>()!.getLastChild()
    if ($isSuggestionNode(lastChild) && lastChild.getSuggestionTypeOrThrow() === 'split') {
      splitStart.setSuggestionId(lastChild.getSuggestionIdOrThrow())
    }
  }

  logger?.info('Created new paragraph by splitting existing one and added split suggestion to the previous')
  onSuggestionCreation(splitStart.getSuggestionIdOrThrow())

  return true
}

function $handleInsertTextData(
  data: string,
  selection: RangeSelection,
  existingParentSuggestion: ProtonNode | null,
  onSuggestionCreation: (id: string) => void,
  suggestionID: string,
  logger?: Logger,
): boolean {
  logger?.info('Inserting text data: ', data)

  const focusNode = selection.focus.getNode()

  const textNode = $createTextNode(data)
  textNode.setFormat(selection.format)
  textNode.setStyle(selection.style)

  const isInsideExistingNonInsertSuggestion =
    existingParentSuggestion && existingParentSuggestion.getSuggestionTypeOrThrow() !== 'insert'
  if (isInsideExistingNonInsertSuggestion) {
    logger?.info('Will split existing non-insert suggestion and insert new insert suggestion')
    const focus = selection.focus
    let node = focus.getNode()
    let offset = focus.offset

    while (!$isBlock(node)) {
      ;[node, offset] = $splitNodeAtPoint(node, offset)
    }

    const nodeToInsertBefore = node.getChildAtIndex(offset)
    if (nodeToInsertBefore) {
      const suggestionNode = $createSuggestionNode(existingParentSuggestion.getSuggestionIdOrThrow(), 'insert')
      suggestionNode.append(textNode)
      nodeToInsertBefore.insertBefore(suggestionNode)
      suggestionNode.selectEnd()
      onSuggestionCreation(suggestionNode.getSuggestionIdOrThrow())
    }

    return true
  }

  const isInsideExistingInsertSuggestion =
    existingParentSuggestion && existingParentSuggestion.getSuggestionTypeOrThrow() === 'insert'
  if (isInsideExistingInsertSuggestion) {
    logger?.info('Will just insert text as already inside insert suggestion')
    if ($isTextNode(focusNode)) {
      const latestFocusOffset = selection.focus.offset
      focusNode.spliceText(latestFocusOffset, 0, data)
      const newOffset = latestFocusOffset + data.length
      focusNode.select(newOffset, newOffset)
    } else {
      $insertNodes([textNode])
    }
    return true
  }

  const suggestionNode = $createSuggestionNode(suggestionID, 'insert')
  suggestionNode.append(textNode)
  $insertNodes([suggestionNode])

  logger?.info('Created and inserted new insert suggestion')

  const prevSibling = suggestionNode.getPreviousSibling()

  const lastChildOfPrevBlock = suggestionNode.getTopLevelElement()?.getPreviousSibling<ElementNode>()?.getLastChild()

  const nextSibling = suggestionNode.getNextSibling()

  const isPrevSiblingSuggestion = $isSuggestionNode(prevSibling)
  const isNextSiblingSuggestion = $isSuggestionNode(nextSibling)

  // Remove placeholder line-break node when typing in newly added
  // paragraph
  if ($isLineBreakNode(prevSibling) && isNextSiblingSuggestion) {
    prevSibling.remove()
  }

  // eslint-disable-next-line no-nested-ternary
  const suggestionSibling = isPrevSiblingSuggestion ? prevSibling : isNextSiblingSuggestion ? nextSibling : null

  if (suggestionSibling) {
    if (suggestionSibling.getSuggestionTypeOrThrow() === 'insert') {
      $mergeWithExistingSuggestionNode(suggestionNode, suggestionSibling, isNextSiblingSuggestion)
      logger?.info('Merged with existing insert suggestion sibling')
    } else {
      suggestionNode.setSuggestionId(suggestionSibling.getSuggestionIdOrThrow())
    }
  } else if (!prevSibling && $isSuggestionNode(lastChildOfPrevBlock)) {
    suggestionNode.setSuggestionId(lastChildOfPrevBlock.getSuggestionIdOrThrow())
  }

  onSuggestionCreation(suggestionNode.getSuggestionIdOrThrow())
  return true
}
