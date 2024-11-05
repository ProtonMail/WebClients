import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { GenerateUUID } from '@proton/docs-core'
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical'
import { $createSuggestionNode } from './ProtonNode'

export function $insertDividerAsSuggestion(onSuggestionCreation: (id: string) => void): boolean {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    return true
  }

  const suggestionID = GenerateUUID()
  const dividerNode = $createHorizontalRuleNode()
  const suggestionNode = $createSuggestionNode(suggestionID, 'insert')
  suggestionNode.append(dividerNode)

  const insertedNode = $insertNodeToNearestRoot(suggestionNode)
  if (!insertedNode.getNextSibling()) {
    const paragraph = $createParagraphNode()
    insertedNode.insertAfter(paragraph)
    paragraph.selectEnd()
  }

  onSuggestionCreation(suggestionID)

  return true
}
