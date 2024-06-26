import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../../AllNodes'
import { $createTableNodeWithDimensions } from '../CreateTableNodeWithDimensions'
import { $toggleTableHeaderRow } from './toggleTableHeaderRow'
import { TableCellHeaderStates, TableCellNode, TableRowNode } from '@lexical/table'

describe('clearCellsInTableSelection', () => {
  const editor = createHeadlessEditor({
    editable: false,
    editorState: undefined,
    namespace: 'export-editor',
    nodes: AllNodes,
    onError: console.error,
  })

  editor.getRootElement = jest.fn()

  it('should toggle table header row', () => {
    editor.update(
      () => {
        const headerlessTable = $createTableNodeWithDimensions(2, 2, { rows: false, columns: false })
        $toggleTableHeaderRow(headerlessTable)
        const firstRowCells = headerlessTable.getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
        for (const cell of firstRowCells) {
          expect(cell.getHeaderStyles()).toBe(TableCellHeaderStates.ROW)
        }

        const tableWithExistingHeader = $createTableNodeWithDimensions(2, 2, { rows: true, columns: false })
        $toggleTableHeaderRow(tableWithExistingHeader)
        const firstRowCells2 = tableWithExistingHeader.getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
        for (const cell of firstRowCells2) {
          expect(cell.getHeaderStyles()).toBe(TableCellHeaderStates.NO_STATUS)
        }
      },
      {
        discrete: true,
      },
    )
  })

  it('should not toggle header column state when toggling row state', () => {
    editor.update(
      () => {
        const table = $createTableNodeWithDimensions(2, 2, { rows: true, columns: true })
        $toggleTableHeaderRow(table)
        const firstRowCells = table.getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
        for (const cell of firstRowCells) {
          const isFirstCell = cell === firstRowCells[0]
          const state = cell.getHeaderStyles()
          if (isFirstCell) {
            expect(state).toBe(TableCellHeaderStates.COLUMN)
          } else {
            expect(state).toBe(TableCellHeaderStates.NO_STATUS)
          }
        }
      },
      {
        discrete: true,
      },
    )
  })
})
