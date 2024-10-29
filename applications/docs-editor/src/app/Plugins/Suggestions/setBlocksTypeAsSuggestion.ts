import { $getRoot, $getSelection } from 'lexical'
import type { BlockType } from '../BlockTypePlugin'
import { $getElementBlockType, blockTypeToCreateElementFn } from '../BlockTypePlugin'
import { GenerateUUID } from '@proton/docs-core'
import { $findMatchingParent, $insertFirst } from '@lexical/utils'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import type { Logger } from '@proton/utils/logs'
import { $isListItemNode } from '@lexical/list'
import type { ListInfo } from '../CustomList/$getListInfo'
import { $getListInfo } from '../CustomList/$getListInfo'
import { $isNonInlineLeafElement } from '../../Utils/isNonInlineLeafElement'

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
  const firstSelectedBlock = anchor !== null ? $findMatchingParent(anchor.getNode(), $isNonInlineLeafElement) : false
  if (firstSelectedBlock && nodes.indexOf(firstSelectedBlock) === -1) {
    nodes.push(firstSelectedBlock)
  }

  let didCreateSuggestion = false

  for (const node of nodes) {
    if (!$isNonInlineLeafElement(node)) {
      logger.info(`Skipping node of type ${node.__type} as its not a block-level element`)
      continue
    }

    const nodeBlockType = $getElementBlockType(node)
    if (!nodeBlockType) {
      logger.info(`Skipping node because changing its block type is not yet supported`)
      continue
    }

    let listInfo: ListInfo | undefined
    if ($isListItemNode(node)) {
      listInfo = $getListInfo(node)
      if (!listInfo) {
        continue
      }
    }

    const initialFormatType = node.getFormatType()
    const initialIndent = node.getIndent()

    const targetElement = createElement()
    targetElement.setFormat(initialFormatType)
    targetElement.setIndent(initialIndent)
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
      const properties = {
        initialBlockType: nodeBlockType,
        initialFormatType,
        initialIndent,
        listInfo,
      }
      const suggestionNode = $createSuggestionNode(suggestionID, 'block-type-change', properties)
      $insertFirst(targetElement, suggestionNode)
    }

    didCreateSuggestion = true
  }

  if (didCreateSuggestion) {
    onSuggestionCreation(suggestionID)
  }

  return true
}
