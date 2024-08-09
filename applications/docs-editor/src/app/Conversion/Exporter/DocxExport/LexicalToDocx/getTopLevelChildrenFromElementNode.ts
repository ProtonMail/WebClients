import type { ElementFormatType } from 'lexical'
import { $isParagraphNode, type ElementNode } from 'lexical'
import type { Table } from 'docx'
import { AlignmentType, Paragraph } from 'docx'
import { $isHeadingNode } from '@lexical/rich-text'
import { $isListNode } from '@lexical/list'
import { $isTableNode } from '@lexical/table'
import { getDocxChildrenFromElementNode } from './getDocxChildrenFromElementNode'
import { getDocxChildrenFromListNode } from './getDocxChildrenFromListNode'
import { getChildrenFromTableNode } from './getChildrenFromTableNode'
import type { DocxExportContext } from './Context'

export type TopLevelChildren = Paragraph | Paragraph[] | Table

const LexicalToDocxAlignmentMappping: {
  [key in ElementFormatType]?: (typeof AlignmentType)[keyof typeof AlignmentType]
} = {
  left: AlignmentType.LEFT,
  start: AlignmentType.START,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  end: AlignmentType.END,
  justify: AlignmentType.BOTH,
}

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
    const level = context.state.read(() => node.getTag()).slice(1) as '1' | '2' | '3' | '4' | '5' | '6'
    return new Paragraph({
      children,
      heading: `Heading${level}`,
    })
  }

  if ($isParagraphNode(node)) {
    const lexicalAlignment = context.state.read(() => node.getFormatType())
    const docxAlignment = LexicalToDocxAlignmentMappping[lexicalAlignment]

    return new Paragraph({
      children,
      alignment: docxAlignment ?? AlignmentType.LEFT,
    })
  }

  return new Paragraph({
    children,
  })
}
