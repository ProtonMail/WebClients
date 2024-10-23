import type { NodeKey, LexicalEditor } from 'lexical'
import { $getNodeByKey, $isTextNode } from 'lexical'
import type { SuggestionSummaryType } from '@proton/docs-shared'
import { $isSuggestionNode } from './ProtonNode'
import { getFormatsForFlag } from '../../Utils/TextFormatUtils'
import { $isLinkNode } from '@lexical/link'
import { $isImageNode } from '../Image/ImageNode'
import { $getElementBlockType, blockTypeToBlockName } from '../BlockTypePlugin'
import { $isHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'

export type SuggestionSummaryContent = { type: SuggestionSummaryType; content: string; replaceWith?: string }[]

const TextContentLimit = 80

const TypesToPrioritize: SuggestionSummaryType[] = ['insert', 'delete', 'replace']

export function generateSuggestionSummary(
  editor: LexicalEditor,
  markNodeMap: Map<string, Set<NodeKey>>,
  suggestionID: string,
): SuggestionSummaryContent {
  const summary: SuggestionSummaryContent = []

  editor.getEditorState().read(() => {
    const nodes = markNodeMap.get(suggestionID)

    if (!nodes || nodes.size === 0) {
      return
    }

    for (const key of nodes) {
      const node = $getNodeByKey(key)
      if (!$isSuggestionNode(node)) {
        continue
      }

      const currentType = node.getSuggestionTypeOrThrow()

      let type: SuggestionSummaryType = currentType

      let content = node.getTextContent().slice(0, TextContentLimit)

      let replaceWith: string | undefined = undefined

      const childrenSize = node.getChildrenSize()
      const firstChild = node.getFirstChild()
      const isFirstChildImage = $isImageNode(firstChild)
      const isFirstChildDivider = $isHorizontalRuleNode(firstChild)
      if (childrenSize === 1 && (isFirstChildImage || isFirstChildDivider)) {
        if (currentType === 'insert') {
          if (isFirstChildImage) {
            type = 'insert-image'
          } else if (isFirstChildDivider) {
            type = 'insert-divider'
          }
        } else if (currentType === 'delete') {
          if (isFirstChildImage) {
            type = 'delete-image'
          } else if (isFirstChildDivider) {
            type = 'delete-divider'
          }
        }
        content = ''
      }

      if (currentType === 'property-change') {
        const firstChild = node.getFirstChild()
        const currentFormat = $isTextNode(firstChild) ? firstChild.getFormat() : 0
        content = getFormatsForFlag(currentFormat).join(', ')
      }

      if (currentType === 'link-change') {
        const firstChild = node.getFirstChild()
        const initialURL: string | undefined = node.__properties.nodePropertiesChanged?.__url
        if (!$isLinkNode(firstChild)) {
          type = 'delete-link'
          content = `${initialURL}`
        } else if (!initialURL) {
          type = 'add-link'
          content = `${firstChild.getURL()}`
        } else {
          content = `${initialURL}`
          replaceWith = `${firstChild.getURL()}`
        }
      }

      if (currentType === 'style-change') {
        const changedProperties = node.__properties.nodePropertiesChanged
        content = Object.keys(changedProperties || {}).join(',')
      }

      if (currentType === 'block-type-change') {
        const currentBlockType = $getElementBlockType(node.getTopLevelElementOrThrow())
        if (currentBlockType) {
          content = blockTypeToBlockName[currentBlockType]
        }
      }

      if (currentType === 'clear-formatting') {
        content = ''
      }

      const lastItem = summary[summary.length - 1]
      if (!lastItem) {
        summary.push({ type, content, replaceWith })
        continue
      }

      const shouldPrioritizeLastItem = TypesToPrioritize.includes(lastItem.type)
      const shouldPrioritizeCurrentItem = TypesToPrioritize.includes(type)
      if (!shouldPrioritizeLastItem && shouldPrioritizeCurrentItem) {
        lastItem.type = type
        lastItem.content = content
        continue
      }
      if (shouldPrioritizeLastItem && !shouldPrioritizeCurrentItem) {
        continue
      }

      if (lastItem.type === type && type !== 'property-change') {
        if (lastItem.content === content) {
          continue
        }
        lastItem.content = (lastItem.content + content).slice(0, TextContentLimit)
        continue
      }

      const isReplace =
        (lastItem.type === 'insert' && currentType === 'delete') ||
        (lastItem.type === 'delete' && currentType === 'insert')
      if (isReplace) {
        const lastItemType = lastItem.type
        const lastItemContent = lastItem.content
        lastItem.type = 'replace'
        if (currentType === 'delete') {
          lastItem.content = content
          if (lastItemType === 'insert') {
            lastItem.replaceWith = lastItemContent
          }
        } else if (currentType === 'insert') {
          lastItem.replaceWith = content
          if (lastItemType === 'delete') {
            lastItem.content = lastItemContent
          }
        }
        continue
      }

      summary.push({ type, content, replaceWith })
    }
  })

  return summary
}
