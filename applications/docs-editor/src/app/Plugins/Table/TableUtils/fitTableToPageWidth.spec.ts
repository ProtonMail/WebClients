import { createHeadlessEditor } from '@lexical/headless'
import { $createParagraphNode } from 'lexical'
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  type TableCellNode,
  type TableRowNode,
} from '@lexical/table'
import { AllNodes } from '../../../AllNodes'
import { $fitTableToPageWidth, $getPastedTablesWithoutExplicitWidths } from './fitTableToPageWidth'

describe('fitTableToPageWidth', () => {
  const editor = createHeadlessEditor({
    editable: false,
    namespace: 'fit-table-to-page-width',
    nodes: AllNodes,
    onError: console.error,
  })

  const rootElement = {
    clientWidth: 320,
    paddingLeft: '10px',
    paddingRight: '10px',
  } as unknown as HTMLElement

  jest
    .spyOn(window, 'getComputedStyle')
    .mockImplementation((element) => element as unknown as CSSStyleDeclaration)

  function $createTable(rows: number, columns: number, width?: number) {
    const table = $createTableNode()
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const row = $createTableRowNode()
      for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        row.append($createTableCellNode(0, 1, width).append($createParagraphNode()))
      }
      table.append(row)
    }
    return table
  }

  describe('$fitTableToPageWidth', () => {
    it('sets equal column widths using the editor width minus its padding', () => {
      editor.update(
        () => {
          const table = $createTable(2, 3, 20)
          $fitTableToPageWidth(table, rootElement)

          for (const row of table.getChildren<TableRowNode>()) {
            expect(row.getChildren<TableCellNode>().map((cell) => cell.getWidth())).toEqual([100, 100, 100])
          }
        },
        { discrete: true },
      )
    })
  })

  describe('$getPastedTablesWithoutExplicitWidths', () => {
    it('returns pasted tables without explicit widths', () => {
      editor.update(
        () => {
          const tableWithoutWidths = $createTable(1, 2)
          const tableWithWidths = $createTable(1, 2, 50)

          expect(
            $getPastedTablesWithoutExplicitWidths([$createParagraphNode(), tableWithoutWidths, tableWithWidths]),
          ).toEqual([tableWithoutWidths])
        },
        { discrete: true },
      )
    })
  })
})
