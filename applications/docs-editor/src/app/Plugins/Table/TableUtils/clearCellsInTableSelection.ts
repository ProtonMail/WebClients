import { $isTableCellNode, $isTableSelection } from '@lexical/table'
import { $createParagraphNode, $createTextNode, $getSelection, $isElementNode } from 'lexical'

export function $clearCellsInTableSelection() {
  const selection = $getSelection()
  if (!$isTableSelection(selection)) {
    return
  }
  const cells = selection.getNodes().filter($isTableCellNode)
  for (const cell of cells) {
    if ($isElementNode(cell)) {
      const paragraphNode = $createParagraphNode()
      const textNode = $createTextNode()
      paragraphNode.append(textNode)
      cell.append(paragraphNode)
      cell.getChildren().forEach((child) => {
        if (child !== paragraphNode) {
          child.remove()
        }
      })
    }
  }
  cells[0].selectStart()
}
