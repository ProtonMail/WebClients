import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../../AllNodes'
import { $createTableNodeWithDimensions } from '../CreateTableNodeWithDimensions'
import { TableCellHeaderStates, TableCellNode, TableRowNode } from '@lexical/table'
import { $toggleTableHeaderColumn } from './toggleTableHeaderColumn'

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
        $toggleTableHeaderColumn(headerlessTable)
        const firstColumnCells = headerlessTable
          .getChildren<TableRowNode>()
          .map((row) => row.getFirstChildOrThrow<TableCellNode>())
        for (const cell of firstColumnCells) {
          expect(cell.getHeaderStyles()).toBe(TableCellHeaderStates.COLUMN)
        }

        const tableWithExistingHeader = $createTableNodeWithDimensions(2, 2, { rows: false, columns: true })
        $toggleTableHeaderColumn(tableWithExistingHeader)
        const firstColumnCells2 = tableWithExistingHeader
          .getChildren<TableRowNode>()
          .map((row) => row.getFirstChildOrThrow<TableCellNode>())
        for (const cell of firstColumnCells2) {
          expect(cell.getHeaderStyles()).toBe(TableCellHeaderStates.NO_STATUS)
        }
      },
      {
        discrete: true,
      },
    )
  })

  it('should not toggle header row state when toggling column state', () => {
    editor.update(
      () => {
        const table = $createTableNodeWithDimensions(2, 2, { rows: true, columns: true })
        $toggleTableHeaderColumn(table)
        const firstColumnCells = table
          .getChildren<TableRowNode>()
          .map((row) => row.getFirstChildOrThrow<TableCellNode>())
        for (const cell of firstColumnCells) {
          const isFirstCell = cell === firstColumnCells[0]
          const state = cell.getHeaderStyles()
          if (isFirstCell) {
            expect(state).toBe(TableCellHeaderStates.ROW)
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
