import type { ElementFormatType } from 'lexical'
import { $isElementNode, $isParagraphNode, type ElementNode } from 'lexical'
import { AlignmentType, Paragraph, Table, TableCell, TableRow } from 'docx'
import { $isHeadingNode } from '@lexical/rich-text'
import { $isListNode } from '@lexical/list'
import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { $isTableCellNode, $isTableNode, $isTableRowNode } from '@lexical/table'
import { getDocxChildrenFromElementNode } from './getDocxChildrenFromElementNode'
import { getDocxChildrenFromListNode } from './getDocxChildrenFromListNode'
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

async function getChildrenFromTableNode(node: TableNode, context: DocxExportContext): Promise<Table> {
  const rows: TableRow[] = []

  const nodeChildren = context.state.read(() => node.getChildren())
  for (const child of nodeChildren) {
    if (!$isTableRowNode(child)) {
      continue
    }
    const cells = await getCellsFromTableRow(child, context)
    rows.push(
      new TableRow({
        children: cells,
      }),
    )
  }

  return new Table({
    rows,
    width: {
      size: `100%`,
      type: 'pct',
    },
  })
}

async function getCellsFromTableRow(node: TableRowNode, context: DocxExportContext): Promise<TableCell[]> {
  const cells: TableCell[] = []

  const nodeChildren = context.state.read(() => node.getChildren())
  for (const child of nodeChildren) {
    if (!$isTableCellNode(child)) {
      continue
    }
    const children = await getChildrenFromCellNode(child, context)
    cells.push(
      new TableCell({
        children: children.flat(),
      }),
    )
  }

  return cells
}

async function getChildrenFromCellNode(node: TableCellNode, context: DocxExportContext): Promise<TopLevelChildren[]> {
  const children: TopLevelChildren[] = []

  const nodeChildren = context.state.read(() => node.getChildren())
  for (const child of nodeChildren) {
    if ($isElementNode(child)) {
      children.push(await getTopLevelChildrenFromElementNode(child, context))
    }
  }

  return children
}
