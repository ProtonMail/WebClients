import { ElementNode } from 'lexical'
import { Paragraph, Table } from 'docx'
import { $isHeadingNode } from '@lexical/rich-text'
import { $isListNode } from '@lexical/list'
import { $isTableNode } from '@lexical/table'
import { getDocxChildrenFromElementNode } from './getDocxChildrenFromElementNode'
import { getDocxChildrenFromListNode } from './getDocxChildrenFromListNode'
import { getChildrenFromTableNode } from './getChildrenFromTableNode'

export type TopLevelChildren = Paragraph | Paragraph[] | Table

export function getTopLevelChildrenFromElementNode(node: ElementNode): TopLevelChildren {
  if ($isListNode(node)) {
    return getDocxChildrenFromListNode(node)
  }

  if ($isTableNode(node)) {
    return getChildrenFromTableNode(node)
  }

  const children = getDocxChildrenFromElementNode(node)

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
