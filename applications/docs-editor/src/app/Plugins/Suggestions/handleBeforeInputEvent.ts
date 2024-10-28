import { $generateNodesFromSerializedNodes, $insertGeneratedNodes } from '@lexical/clipboard'
import { $isCodeNode } from '@lexical/code'
import { $findMatchingParent } from '@lexical/utils'
import { GenerateUUID } from '@proton/docs-core'
import type { LexicalEditor, ElementNode, RangeSelection, LexicalNode, DecoratorNode } from 'lexical'
import { $isDecoratorNode } from 'lexical'
import {
  UNDO_COMMAND,
  REDO_COMMAND,
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  $isRootNode,
  $createTextNode,
  $isTextNode,
  $insertNodes,
  $createTabNode,
  $createParagraphNode,
} from 'lexical'
import { $isNonInlineLeafElement } from '../../Utils/isNonInlineLeafElement'
import { $splitNodeAtPoint } from '../../Utils/splitNodeAtPoint'
import { DeleteInputTypes, InsertionInputTypes } from './InputTypes'
import type { ProtonNode } from './ProtonNode'
import { $isSuggestionNode, $createSuggestionNode } from './ProtonNode'
import {
  getTargetRangeFromInputEvent,
  $wrapSelectionInSuggestionNode,
  getBoundaryForDeletion,
  $mergeWithExistingSuggestionNode,
  $isWholeSelectionInsideSuggestion,
} from './Utils'
import { $generateNodesFromDOM } from '@lexical/html'
import type { Logger } from '@proton/utils/logs'
import { INSERT_FILE_COMMAND } from '../../Commands/Events'
import { TextEditingSuggestionTypes } from './Types'

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
    logger?.info('Current selection is not a range selection')
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

  let suggestionNodes: ProtonNode[] = []

  const isSelectionCollapsed = selection.isCollapsed()

  logger?.info(
    'Handling delete: ',
    `boundary: ${boundary} `,
    `isBackward: ${isBackward} `,
    `isSelectionCollapsed: ${isSelectionCollapsed}`,
  )

  let focusNode = selection.focus.getNode()

  const currentBlock = focusNode.getTopLevelElement()
  const isAtStartOfBlock =
    isSelectionCollapsed && focusNode.is(currentBlock?.getFirstDescendant()) && selection.focus.offset === 0

  let didModifySelection = false

  if (isAtStartOfBlock) {
    const previousBlock = currentBlock?.getPreviousSibling<ElementNode | DecoratorNode<unknown>>()
    if ($isDecoratorNode(previousBlock)) {
      const key = previousBlock.getKey()
      selection.anchor.set(key, 0, 'element')
      selection.focus.set(key, 0, 'element')
      didModifySelection = true
    }
  }

  if (!didModifySelection && isSelectionCollapsed && boundary !== null) {
    selection.modify('extend', isBackward, boundary)
  }

  focusNode = selection.focus.getNode()
  const existingParentSuggestion = $findMatchingParent(focusNode, $isSuggestionNode)

  const isWholeSelectionInsideExistingSuggestion = $isWholeSelectionInsideSuggestion(selection)

  if (!isWholeSelectionInsideExistingSuggestion || existingParentSuggestion?.getSuggestionTypeOrThrow() !== 'delete') {
    suggestionNodes = $wrapSelectionInSuggestionNode(selection, selection.isBackward(), suggestionID, 'delete', logger)
  }

  if (!suggestionNodes.length) {
    logger?.info('No suggestion nodes were created')
    return true
  }

  if (isBackward) {
    suggestionNodes[0].selectPrevious()
  }

  const existingParentSuggestionType = existingParentSuggestion?.getSuggestionTypeOrThrow()

  const shouldActuallyDelete =
    isWholeSelectionInsideExistingSuggestion &&
    (existingParentSuggestionType === 'delete' || existingParentSuggestionType === 'insert')

  if (shouldActuallyDelete) {
    for (const node of suggestionNodes) {
      node.remove()
    }
    return true
  }

  if (suggestionNodes.length === 1) {
    const node = suggestionNodes[0]
    const prevSibling = node.getPreviousSibling()
    const nextSibling = node.getNextSibling()
    if ($isSuggestionNode(prevSibling) && prevSibling.getSuggestionTypeOrThrow() === 'delete') {
      $mergeWithExistingSuggestionNode(node, prevSibling, false)
      logger?.info('Merged delete suggestion with prev delete sibling')
    } else if ($isSuggestionNode(nextSibling) && nextSibling.getSuggestionTypeOrThrow() === 'delete') {
      $mergeWithExistingSuggestionNode(node, nextSibling, true)
      logger?.info('Merged delete suggestion with next delete sibling')
    } else {
      onSuggestionCreation(suggestionID)
    }
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

  /**
   * When inserting nodes generated from a dataTransfer, we want to let the `selectionInsertClipboardNodes`
   * handle wrapping any existing non-collapsed selection in a "delete" suggestion instead of doing it
   * here which will collapse the selection and make it difficult to create a selection of the inserted nodes.
   */
  if (!selection.isCollapsed() && data !== null && dataTransfer === null) {
    logger?.info('Wrapping non-collapsed selection in a delete suggestion')
    const isInsideExistingSelection = $isWholeSelectionInsideSuggestion(selection)
    const nodes = $wrapSelectionInSuggestionNode(selection, selection.isBackward(), suggestionID, 'delete', logger)
    if (isInsideExistingSelection) {
      logger?.info('Removing the wrapped suggestion as it is inside an existing one')
      for (const node of nodes) {
        node.remove()
      }
    } else {
      onSuggestionCreation(suggestionID)
    }
  }

  const latestSelection = $getSelection()
  if (!$isRangeSelection(latestSelection)) {
    logger?.info('Latest selection is not range selection')
    return true
  }

  if (inputType === 'insertParagraph') {
    return $handleInsertParagraph(latestSelection, suggestionID, onSuggestionCreation, logger)
  }

  const canApplyTargetRangeForInputType = inputType !== 'insertText' && inputType !== 'insertFromPaste'

  if (
    canApplyTargetRangeForInputType &&
    latestSelection.isCollapsed() &&
    !$isRootNode(latestSelection.anchor.getNode()) &&
    targetRange
  ) {
    logger?.info('Applying targetRange to current selection')
    latestSelection.applyDOMRange(targetRange)
  }

  if (inputType === 'insertReplacementText' && existingParentSuggestion?.getSuggestionTypeOrThrow() === 'insert') {
    return $handleReplacementTextInsideInsertSuggestion(latestSelection, data, dataTransfer, logger)
  }

  if (data === null && dataTransfer !== null) {
    const types = dataTransfer.types
    logger?.info('Inserting data transfer', types)
    $insertDataTransferAsSuggestion(dataTransfer, latestSelection, editor)
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
  const currentNonInlineElement = $findMatchingParent(
    selection.focus.getNode(),
    (node): node is ElementNode => $isElementNode(node) && !node.isInline(),
  )
  if (!currentNonInlineElement) {
    return true
  }

  const insertedNode = selection.insertParagraph()
  if (!insertedNode) {
    return true
  }

  const splitNode = $createSuggestionNode(suggestionID, 'split')
  const prevSibling = insertedNode.getPreviousSibling()
  if (!$isElementNode(prevSibling)) {
    return false
  }

  prevSibling.append(splitNode)

  const splitSuggestionPrevSibling = splitNode.getPreviousSibling()
  const shouldUseSameSuggestionAsPrevSibling = $isSuggestionNode(splitSuggestionPrevSibling)
  const isSplitNodeFirstChild = splitNode.getPreviousSibling() === null
  if (shouldUseSameSuggestionAsPrevSibling) {
    splitNode.setSuggestionId(splitSuggestionPrevSibling.getSuggestionIdOrThrow())
  } else if ($isElementNode(currentNonInlineElement.getPreviousSibling())) {
    const lastChild = currentNonInlineElement.getPreviousSibling<ElementNode>()!.getLastChild()
    const isConsecutiveSplit =
      $isSuggestionNode(lastChild) && lastChild.getSuggestionTypeOrThrow() === 'split' && isSplitNodeFirstChild
    if (isConsecutiveSplit) {
      splitNode.setSuggestionId(lastChild.getSuggestionIdOrThrow())
    }
  }

  logger?.info('Created new paragraph by splitting existing one and added split suggestion to the previous')
  onSuggestionCreation(splitNode.getSuggestionIdOrThrow())

  return true
}

function $canTextDataBeInsertedDirectlyIntoSuggestion(suggestion: ProtonNode | null): boolean {
  if (!suggestion) {
    return false
  }

  const type = suggestion.getSuggestionTypeOrThrow()
  if (type === 'insert' || type === 'delete') {
    return true
  }

  return false
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

  const canInsertTextDataDirectly = $canTextDataBeInsertedDirectlyIntoSuggestion(existingParentSuggestion)

  const shouldSplitExistingSuggestionBeforeInserting = existingParentSuggestion && !canInsertTextDataDirectly
  if (shouldSplitExistingSuggestionBeforeInserting) {
    logger?.info('Will split existing non-insert suggestion and insert new insert suggestion')
    const focus = selection.focus
    let node = focus.getNode()
    let offset = focus.offset

    /**
     * We split until we reach the node where we can insert
     * the new suggestion node.
     */
    while (!$isNonInlineLeafElement(node)) {
      ;[node, offset] = $splitNodeAtPoint(node, offset)
    }

    const nodeToInsertBefore = node.getChildAtIndex(offset)
    const id =
      existingParentSuggestion.getSuggestionTypeOrThrow() !== 'link-change'
        ? existingParentSuggestion.getSuggestionIdOrThrow()
        : suggestionID
    const suggestionNode = $createSuggestionNode(id, 'insert')
    suggestionNode.append(textNode)

    if (nodeToInsertBefore) {
      nodeToInsertBefore.insertBefore(suggestionNode)
    } else {
      logger?.info('Could not find node to insert before')
      $insertNodes([suggestionNode])
    }

    suggestionNode.selectEnd()

    onSuggestionCreation(suggestionNode.getSuggestionIdOrThrow())

    return true
  }

  const isInsideExistingInsertSuggestion =
    existingParentSuggestion && existingParentSuggestion.getSuggestionTypeOrThrow() === 'insert'

  const isFocusNodeText = $isTextNode(focusNode)
  const isAtEndOfInlineCode =
    isFocusNodeText && focusNode.hasFormat('code') && selection.focus.offset === focusNode.getTextContentSize()
  const shouldExitInlineCode = isAtEndOfInlineCode && data === ' '
  if (shouldExitInlineCode) {
    const textNode = $createTextNode(data)
    const node = isInsideExistingInsertSuggestion
      ? textNode
      : $createSuggestionNode(suggestionID, 'insert').append(textNode)
    focusNode.insertAfter(node)
    node.selectEnd()
    return true
  }

  if (existingParentSuggestion && canInsertTextDataDirectly) {
    logger?.info('Will just insert text as already inside insert suggestion')
    if (isFocusNodeText) {
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

  // eslint-disable-next-line no-nested-ternary
  const suggestionSibling = isPrevSiblingSuggestion ? prevSibling : isNextSiblingSuggestion ? nextSibling : null

  if (suggestionSibling) {
    const suggestionSiblingType = suggestionSibling.getSuggestionTypeOrThrow()

    const shouldMergeWithSibling = suggestionSiblingType === 'insert'

    /* When inserting text next to a non-insert suggestion sibling, we only want to
    continue to that suggestion if it is a text editing suggestion and not if it is
    a formatting, style or other kind of chnage */
    const shouldUseSameIDAsSibling = TextEditingSuggestionTypes.includes(suggestionSiblingType)

    if (shouldMergeWithSibling) {
      $mergeWithExistingSuggestionNode(suggestionNode, suggestionSibling, isNextSiblingSuggestion)
      logger?.info('Merged with existing insert suggestion sibling')
      if (isNextSiblingSuggestion) {
        logger?.info('Updating cursor position after merging')
        const selection = suggestionSibling.selectStart()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          throw new Error('Latest selection is not correct')
        }
        selection.anchor.offset += data.length
        selection.focus.offset = selection.anchor.offset
      }
    } else if (shouldUseSameIDAsSibling) {
      suggestionNode.setSuggestionId(suggestionSibling.getSuggestionIdOrThrow())
    }
  } else if (!prevSibling && $isSuggestionNode(lastChildOfPrevBlock)) {
    suggestionNode.setSuggestionId(lastChildOfPrevBlock.getSuggestionIdOrThrow())
  }

  onSuggestionCreation(suggestionNode.getSuggestionIdOrThrow())
  return true
}

/**
 * Generates nodes from a given dataTransfer and inserts them in the
 * current selection as a suggestion using the `SELECTION_INSERT_CLIPBOARD_NODES_COMMAND`
 * command.
 *
 * Adapted from https://github.com/facebook/lexical/blob/main/packages/lexical-clipboard/src/clipboard.ts#L131
 * since the original function doesn't trigger the aforementioned command when the data transfer
 * only has plaintext data.
 */
function $insertDataTransferAsSuggestion(dataTransfer: DataTransfer, selection: RangeSelection, editor: LexicalEditor) {
  const types = dataTransfer.types

  const lexicalString = dataTransfer.getData('application/x-lexical-editor')
  if (lexicalString) {
    try {
      const payload = JSON.parse(lexicalString)
      if (payload.namespace === editor._config.namespace && Array.isArray(payload.nodes)) {
        const nodes = $generateNodesFromSerializedNodes(payload.nodes)
        return $insertGeneratedNodes(editor, nodes, selection)
      }
    } catch {
      // Fail silently.
    }
  }

  const htmlString = dataTransfer.getData('text/html')
  if (htmlString) {
    try {
      const parser = new DOMParser()
      const dom = parser.parseFromString(htmlString, 'text/html')
      const nodes = $generateNodesFromDOM(editor, dom)
      return $insertGeneratedNodes(editor, nodes, selection)
    } catch {
      // Fail silently.
    }
  }

  if (types.includes('Files')) {
    for (const file of dataTransfer.files) {
      editor.dispatchCommand(INSERT_FILE_COMMAND, file)
    }
    return true
  }

  // Multi-line plain text in rich text mode pasted as separate paragraphs
  // instead of single paragraph with linebreaks.
  // Webkit-specific: Supports read 'text/uri-list' in clipboard.
  const text = dataTransfer.getData('text/plain') || dataTransfer.getData('text/uri-list')
  if (!text) {
    return
  }
  const parts = text.split(/\r?\n/)
  if (parts[parts.length - 1] === '') {
    parts.pop()
  }
  const nodes: LexicalNode[] = []
  if (parts.length === 1) {
    nodes.push($createTextNode(parts[0]))
  } else {
    for (const part of parts) {
      const paragraph = $createParagraphNode()
      const splitByTabs = part.split(/(\t)/)
      for (const split of splitByTabs) {
        if (split === '\t') {
          paragraph.append($createTabNode())
        } else {
          paragraph.append($createTextNode(split))
        }
      }
      nodes.push(paragraph)
    }
  }
  $insertGeneratedNodes(editor, nodes, selection)
}

/**
 * If we're already inside an insert suggestion, we don't want to create a
 * replace suggestion when we select a word correction (which is generally
 * what triggers the `insertReplacementText`)
 * We only do this if we're inside an insert suggestion because otherwise
 * we would end up deleting existing text from the document.
 */
function $handleReplacementTextInsideInsertSuggestion(
  selection: RangeSelection,
  data: string | null,
  dataTransfer: DataTransfer | null,
  logger?: Logger,
): boolean {
  let newText = ''
  if (data) {
    newText = data
  } else if (dataTransfer) {
    newText = dataTransfer.getData('text/plain')
  }
  if (!newText) {
    return true
  }
  logger?.info('Will insert replacement text', newText)
  const anchor = selection.anchor
  const focusOffset = selection.focus.offset
  const toDelete = focusOffset - anchor.offset
  selection.focus.set(anchor.key, anchor.offset, anchor.type)
  const node = anchor.getNode()
  if (!$isTextNode(node)) {
    logger?.info('Current anchor node is not text node', node)
    return true
  }
  node.spliceText(anchor.offset, toDelete, newText)
  const newOffset = anchor.offset + newText.length
  node.select(newOffset, newOffset)
  return true
}
