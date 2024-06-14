import { $nodesOfType } from 'lexical'
import { Paragraph } from 'docx'
import { $isListItemNode, $isListNode, ListNode } from '@lexical/list'
import { getDocxChildrenFromElementNode } from './getDocxChildrenFromElementNode'

export function getDocxChildrenFromListNode(node: ListNode): Paragraph[] {
  const paragraphs: Paragraph[] = []

  let instance = 0
  if (node.getListType() === 'number') {
    const allListNodes = $nodesOfType(ListNode)
    instance = allListNodes.filter((listNode) => listNode.getListType() === 'number').indexOf(node)
  }

  for (const child of node.getChildren()) {
    if (!$isListItemNode(child)) {
      continue
    }
    if (child.getChildrenSize() === 1 && $isListNode(child.getFirstChild())) {
      const nestedList = getDocxChildrenFromListNode(child.getFirstChildOrThrow())
      paragraphs.push(...nestedList)
      continue
    }
    const children = getDocxChildrenFromElementNode(child)
    const listType = node.getListType()
    const level = child.getIndent()
    paragraphs.push(
      new Paragraph({
        children,
        bullet:
          listType !== 'number'
            ? {
                level,
              }
            : undefined,
        numbering: listType === 'number' ? { reference: 'numbering', level, instance } : undefined,
      }),
    )
  }

  return paragraphs
}
