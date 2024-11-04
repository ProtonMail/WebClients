import type { ListNode } from '@lexical/list'
import { $createListItemNode, $isListItemNode, $isListNode, type ListType } from '@lexical/list'
import type { ElementNode, LexicalNode, NodeKey, TextNode } from 'lexical'
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isLeafNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  type LexicalEditor,
} from 'lexical'
import type { Logger } from '@proton/utils/logs'
import type { CustomListMarker, CustomListStyleType } from '../CustomList/CustomListTypes'
import { $createCustomListNode } from '../CustomList/$createCustomListNode'
import { $getListInfo } from '../CustomList/$getListInfo'
import { $insertFirst } from '@lexical/utils'
import { $createSuggestionNode } from './ProtonNode'
import { GenerateUUID } from '@proton/docs-core'
import { $getElementBlockType } from '../BlockTypePlugin'
import { $isEmptyListItemExceptForSuggestions } from './Utils'

export function $insertListAsSuggestion(
  editor: LexicalEditor,
  listType: ListType,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
  styleType?: CustomListStyleType,
  marker?: CustomListMarker,
): boolean {
  logger.info('Inserting list as suggestion', listType, styleType, marker)

  let selection = $getSelection()
  if (!selection) {
    logger.info('No existing selection')
    return true
  }

  const startEndPoints = selection.getStartEndPoints()
  if (!startEndPoints) {
    logger.info('No start/end points for selection')
    return true
  }

  const [anchor] = startEndPoints
  if (anchor.key === 'root') {
    logger.info('Resetting selection because it is at root')
    const root = $getRoot()
    const firstChild = root.getFirstChild()
    if (firstChild) {
      logger.info('Selecting first existing child of root')
      selection = firstChild.selectStart()
    } else {
      logger.info('Creating new paragraph and selecting it')
      const paragraph = $createParagraphNode()
      root.append(paragraph)
      selection = paragraph.select()
    }
  }

  const nodes = selection.getNodes()

  const suggestionID = GenerateUUID()

  if ($isRangeSelection(selection)) {
    const anchorNode = selection.anchor.getNode()
    const emptyListItem = $isSelectingEmptyListItem(anchorNode, nodes)
    if ($isListItemNode(emptyListItem)) {
      logger.info('Handling empty list item')

      const parent = emptyListItem.getParent()
      if (!$isListNode(parent)) {
        logger.info('Parent is not list node')
        return true
      }

      $replaceList(parent, listType, suggestionID, logger, onSuggestionCreation, styleType, marker)
      return true
    }
  }

  const handled = new Set<NodeKey>()

  let createdSuggestions = 0
  const incrementSuggestionCounter = () => createdSuggestions++

  for (const node of nodes) {
    const isEmptyElementNode = $isElementNode(node) && node.isEmpty()
    const nodeHasBeenHandled = handled.has(node.getKey())

    if (isEmptyElementNode && !$isListItemNode(node) && !nodeHasBeenHandled) {
      logger.info('Is empty element node that has not been handled')
      $changeBlockTypeToList(node, listType, suggestionID, logger, incrementSuggestionCounter, styleType, marker)
      continue
    }

    if (!$isLeafNode(node)) {
      continue
    }

    let parent = node.getParent()
    while (parent != null) {
      const parentKey = parent.getKey()
      if ($isListNode(parent)) {
        logger.info('Parent is list node')
        if (!handled.has(parentKey)) {
          handled.add(parentKey)
          const list = $replaceList(
            parent,
            listType,
            suggestionID,
            logger,
            incrementSuggestionCounter,
            styleType,
            marker,
          )
          handled.add(list.getKey())
        }
        break
      } else {
        const grandParent = parent.getParent()

        const parentIsTopLevelAndUnhandled = $isRootOrShadowRoot(grandParent) && !handled.has(parentKey)
        if (parentIsTopLevelAndUnhandled) {
          handled.add(parentKey)
          logger.info('Changing leaf node non-list parent to list')
          const list = $changeBlockTypeToList(
            parent,
            listType,
            suggestionID,
            logger,
            incrementSuggestionCounter,
            styleType,
            marker,
          )
          handled.add(list.getKey())
          break
        }

        parent = grandParent
      }
    }
  }

  if (createdSuggestions > 0) {
    onSuggestionCreation(suggestionID)
  }

  return true
}

function $changeBlockTypeToList(
  node: ElementNode,
  listType: ListType,
  suggestionID: string,
  logger: Logger,
  onSuggestionCreation: (id: string) => void,
  styleType?: CustomListStyleType,
  marker?: CustomListMarker,
) {
  logger.info('Change node block type to list')

  if ($isListNode(node)) {
    logger.info('Node is already list node')
    return node
  }

  const children = node.getChildren()

  const blockType = $getElementBlockType(node)
  if (!blockType) {
    throw new Error('Could not get block type for current block')
  }

  const formatType = node.getFormatType()
  const indent = node.getIndent()

  const newList = $createCustomListNode(listType, undefined, styleType, marker)
  const listItem = $createListItemNode()
  listItem.append(...children)
  newList.append(listItem)
  node.replace(newList)

  $insertFirst(
    listItem,
    $createSuggestionNode(suggestionID, 'block-type-change', {
      initialBlockType: blockType,
      initialFormatType: formatType,
      initialIndent: indent,
    }),
  )
  onSuggestionCreation(suggestionID)

  listItem.setFormat(formatType)
  listItem.setIndent(indent)

  return newList
}

function $replaceList(
  node: ListNode,
  listType: ListType,
  suggestionID: string,
  logger: Logger,
  onSuggestionCreation: (id: string) => void,
  styleType?: CustomListStyleType,
  marker?: CustomListMarker,
): ListNode {
  logger.info(`Replacing exist list (key: ${node.__key}) with list type ${listType}`)
  const list = $createCustomListNode(listType, undefined, styleType, marker)

  const listInfo = $getListInfo(node)
  const children = node.getChildren()
  for (const child of children) {
    if (!$isElementNode(child)) {
      logger.info('Child is not element')
      continue
    }

    const formatType = child.getFormatType()
    const indent = child.getIndent()
    $insertFirst(
      child,
      $createSuggestionNode(suggestionID, 'block-type-change', {
        initialBlockType: listInfo.listType,
        initialFormatType: formatType,
        initialIndent: indent,
        listInfo,
      }),
    )

    logger.info('Inserted block-type-change suggestion to child')
    onSuggestionCreation(suggestionID)
  }

  list.append(...children)
  node.replace(list, true)

  return list
}

function $isSelectingEmptyListItem(anchorNode: ElementNode | TextNode, nodes: LexicalNode[]) {
  if (nodes.length === 0) {
    if ($isListItemNode(anchorNode)) {
      return anchorNode
    }
    return null
  }
  if (nodes.length === 1) {
    return $isEmptyListItemExceptForSuggestions(anchorNode)
  }
  return null
}
