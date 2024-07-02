import { ElementNode } from 'lexical'
import { Paragraph, Table } from 'docx'
import { $isHeadingNode } from '@lexical/rich-text'
import { $isListNode } from '@lexical/list'
import { $isTableNode } from '@lexical/table'
import { getDocxChildrenFromElementNode } from './getDocxChildrenFromElementNode'
import { getDocxChildrenFromListNode } from './getDocxChildrenFromListNode'
import { getChildrenFromTableNode } from './getChildrenFromTableNode'
import { DocxExportContext } from './Context'

export type TopLevelChildren = Paragraph | Paragraph[] | Table

export async function getTopLevelChildrenFromElementNode(
  node: ElementNode,
  context: DocxExportContext,
): Promise<TopLevelChildren> {
  if ($isListNode(node)) {
    return getDocxChildrenFromListNode(node, context)
  }

  if ($isTableNode(node)) {
    return getChildrenFromTableNode(node, context)
  }

  const children = await getDocxChildrenFromElementNode(node, context)

  if ($isHeadingNode(node)) {
    const level = node.getTag().slice(1) as '1' | '2' | '3' | '4' | '5' | '6'
    return new Paragraph({
      children,
      heading: `Heading${level}`,
    })
  }

  return new Paragraph({
    children,
  })
}
