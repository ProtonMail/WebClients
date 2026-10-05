import { $insertNodeToNearestRoot } from '@lexical/utils'
import { v4 as uuidv4 } from 'uuid'
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical'
import { $createPageBreakNode } from '../PageBreak/PageBreakNode'
import { $createSuggestionNode } from './ProtonNode'

export function $insertPageBreakAsSuggestion(onSuggestionCreation: (id: string) => void): boolean {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    return true
  }

  const suggestionID = uuidv4()
  const pageBreakNode = $createPageBreakNode()
  const suggestionNode = $createSuggestionNode(suggestionID, 'insert')
  suggestionNode.append(pageBreakNode)

  const insertedNode = $insertNodeToNearestRoot(suggestionNode)
  if (!insertedNode.getNextSibling()) {
    const paragraph = $createParagraphNode()
    insertedNode.insertAfter(paragraph)
    paragraph.selectEnd()
  }

  onSuggestionCreation(suggestionID)

  return true
}
