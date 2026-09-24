import type { ElementNode, LexicalNode } from 'lexical'
import { $createParagraphNode, $createRangeSelection, $getRoot, $isElementNode, $isTextNode } from 'lexical'

// https://github.com/facebook/lexical/blob/main/packages/lexical/src/LexicalSelection.ts#L2754
export function $splitNodeAtPoint(node: LexicalNode, offset: number): [parent: ElementNode, offset: number] {
  const parent = node.getParent()
  if (!parent) {
    const paragraph = $createParagraphNode()
    $getRoot().append(paragraph)
    paragraph.select()
    return [$getRoot(), 0]
  }

  if ($isTextNode(node)) {
    const split = node.splitText(offset)
    if (split.length === 0) {
      return [parent, node.getIndexWithinParent()]
    }
    const x = offset === 0 ? 0 : 1
    const index = split[0].getIndexWithinParent() + x

    return [parent, index]
  }

  if (!$isElementNode(node) || offset === 0) {
    return [parent, node.getIndexWithinParent()]
  }

  const firstToAppend = node.getChildAtIndex(offset)
  if (firstToAppend) {
    const insertPoint = $createRangeSelection()
    insertPoint.anchor.set(node.__key, offset, 'element')
    insertPoint.focus.set(node.__key, offset, 'element')
    insertPoint.format = 0
    insertPoint.style = ''
    const newElement = node.insertNewAfter(insertPoint) as ElementNode | null
    if (newElement) {
      newElement.append(firstToAppend, ...firstToAppend.getNextSiblings())
    }
  }
  return [parent, node.getIndexWithinParent() + 1]
}
