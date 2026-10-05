import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { v4 as uuidv4 } from 'uuid'
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical'
import { $createSuggestionNode } from './ProtonNode'

export function $insertDividerAsSuggestion(onSuggestionCreation: (id: string) => void): boolean {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    return true
  }

  const suggestionID = uuidv4()
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
