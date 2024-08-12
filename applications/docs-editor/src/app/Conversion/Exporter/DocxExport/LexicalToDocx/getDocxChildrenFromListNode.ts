import { $nodesOfType } from 'lexical'
import { Paragraph } from 'docx'
import { $isListItemNode, $isListNode, ListNode } from '@lexical/list'
import { getDocxChildrenFromElementNode } from './getDocxChildrenFromElementNode'
import type { DocxExportContext } from './Context'

export async function getDocxChildrenFromListNode(node: ListNode, context: DocxExportContext): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = []

  const state = context.state

  let instance = 0
  const listType = state.read(() => node.getListType())
  if (listType === 'number') {
    const allListNodes = state.read(() => $nodesOfType(ListNode))
    instance = allListNodes.filter((listNode) => listNode.getListType() === 'number').indexOf(node)
  }

  const nodeChildren = state.read(() => node.getChildren())
  for (const child of nodeChildren) {
    if (!$isListItemNode(child)) {
      continue
    }
    const childChildrenSize = state.read(() => child.getChildrenSize())
    const childFirstChild = state.read(() => child.getFirstChild())
    if (childChildrenSize === 1 && $isListNode(childFirstChild)) {
      const nestedList = await getDocxChildrenFromListNode(childFirstChild, context)
      paragraphs.push(...nestedList)
      continue
    }
    const children = await getDocxChildrenFromElementNode(child, context)
    const level = state.read(() => child.getIndent())
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
