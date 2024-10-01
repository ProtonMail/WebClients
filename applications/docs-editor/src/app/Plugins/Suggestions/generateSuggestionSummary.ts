import type { NodeKey, LexicalEditor } from 'lexical'
import { $getNodeByKey, $isTextNode } from 'lexical'
import type { SuggestionType } from './Types'
import { $isSuggestionNode } from './ProtonNode'
import { getFormatsForFlag } from '../../Utils/TextFormatUtils'

type SummaryType = SuggestionType | 'replace'

export type SuggestionSummaryContent = { type: SummaryType; content: string }[]

const TextContentLimit = 80

const TypesToPrioritize: SummaryType[] = ['insert', 'delete', 'replace']

export function generateSuggestionSummary(
  editor: LexicalEditor,
  markNodeMap: Map<string, Set<NodeKey>>,
  suggestionID: string,
) {
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

      let content = node.getTextContent().slice(0, TextContentLimit)

      if (currentType === 'property-change') {
        const firstChild = node.getFirstChild()
        const currentFormat = $isTextNode(firstChild) ? firstChild.getFormat() : 0
        content = getFormatsForFlag(currentFormat).join(', ')
      }

      const lastItem = summary[summary.length - 1]
      if (!lastItem) {
        summary.push({ type: currentType, content })
        continue
      }

      const shouldPrioritizeLastItem = TypesToPrioritize.includes(lastItem.type)
      const shouldPrioritizeCurrentItem = TypesToPrioritize.includes(currentType)
      if (!shouldPrioritizeLastItem && shouldPrioritizeCurrentItem) {
        lastItem.type = currentType
        lastItem.content = content
        continue
      }
      if (shouldPrioritizeLastItem && !shouldPrioritizeCurrentItem) {
        continue
      }

      if (lastItem.type === currentType && currentType !== 'property-change') {
        lastItem.content = (lastItem.content + content).slice(0, TextContentLimit)
        continue
      }

      const isReplace =
        (lastItem.type === 'insert' && currentType === 'delete') ||
        (lastItem.type === 'delete' && currentType === 'insert')
      if (isReplace) {
        lastItem.type = 'replace'
        if (currentType === 'delete') {
          lastItem.content = content
        }
        continue
      }

      summary.push({ type: currentType, content })
    }
  })

  return summary
}
