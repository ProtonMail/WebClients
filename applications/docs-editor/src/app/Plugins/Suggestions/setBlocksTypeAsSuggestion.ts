import { $getRoot, $getSelection, $isElementNode, $isRootOrShadowRoot } from 'lexical'
import type { BlockType } from '../BlockTypePlugin'
import { $getElementBlockType, blockTypeToCreateElementFn } from '../BlockTypePlugin'
import { GenerateUUID } from '@proton/docs-core'
import { $insertFirst } from '@lexical/utils'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import type { Logger } from '@proton/utils/logs'

export function $setBlocksTypeAsSuggestion(
  blockType: BlockType,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  logger.info('Setting block(s) type for selection', blockType)

  const selection = $getSelection()
  if (selection === null) {
    logger.info('No selection found to set blocks type')
    return true
  }

  if (blockType === 'code') {
    logger.info('Bailing as code block suggestions are not supported')
    return true
  }

  const createElement = blockTypeToCreateElementFn[blockType]

  const anchorAndFocus = selection.getStartEndPoints()
  const anchor = anchorAndFocus ? anchorAndFocus[0] : null

  const suggestionID = GenerateUUID()

  if (anchor !== null && anchor.key === 'root') {
    logger.info('Anchor is root node')

    const element = createElement()
    const root = $getRoot()
    const firstChild = root.getFirstChild()

    if (firstChild) {
      firstChild.replace(element, true)
    } else {
      root.append(element)
    }

    $insertFirst(
      element,
      $createSuggestionNode(suggestionID, 'block-type-change', {
        initialBlockType: 'paragraph',
      }),
    )

    onSuggestionCreation(suggestionID)

    return true
  }

  const nodes = selection.getNodes()
  const firstSelectedBlock = anchor !== null ? anchor.getNode().getTopLevelElementOrThrow() : false
  if (firstSelectedBlock && nodes.indexOf(firstSelectedBlock) === -1) {
    nodes.push(firstSelectedBlock)
  }

  let didCreateSuggestion = false

  for (const node of nodes) {
    const isBlockLevel = $isElementNode(node) && !node.isInline() && $isRootOrShadowRoot(node.getParent())
    if (!isBlockLevel) {
      logger.info(`Skipping node of type ${node.__type} as its not a block-level element`)
      continue
    }

    const nodeBlockType = $getElementBlockType(node)
    if (!nodeBlockType) {
      logger.info(`Skipping node because changing its block type is not yet supported`)
      continue
    }

    const targetElement = createElement()
    targetElement.setFormat(node.getFormatType())
    targetElement.setIndent(node.getIndent())
    node.replace(targetElement, true)

    const existingSuggestion = targetElement
      .getChildren()
      .find(
        (node): node is ProtonNode =>
          $isSuggestionNode(node) && node.getSuggestionTypeOrThrow() === 'block-type-change',
      )
    if (existingSuggestion) {
      const initialBlockType = existingSuggestion.__properties.nodePropertiesChanged?.initialBlockType
      if (!initialBlockType) {
        throw new Error("Existing block-type-change suggestion doesn't have initialBlockType")
      }
      if (initialBlockType === blockType) {
        existingSuggestion.remove()
      }
    } else {
      $insertFirst(
        targetElement,
        $createSuggestionNode(suggestionID, 'block-type-change', {
          initialBlockType: nodeBlockType,
        }),
      )
    }

    didCreateSuggestion = true
  }

  if (didCreateSuggestion) {
    onSuggestionCreation(suggestionID)
  }

  return true
}
