import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../AllNodes'
import { $createTableNodeWithDimensions } from './CreateTableNodeWithDimensions'
import { TableCellHeaderStates, TableCellNode, TableRowNode } from '@lexical/table'

describe('CreateTableNodeWithDimensions', () => {
  const editor = createHeadlessEditor({
    editable: false,
    editorState: undefined,
    namespace: 'export-editor',
    nodes: AllNodes,
    onError: console.error,
  })

  const getComputedStyleSpy = jest.spyOn(window, 'getComputedStyle')
  getComputedStyleSpy.mockImplementation((obj: any) => obj)

  editor.getRootElement = jest.fn().mockImplementation(() => {
    const root = {
      clientWidth: 320,
      paddingLeft: 10,
      paddingRight: 10,
    }
    return root
  })

  it('should create table node with dimensions', () => {
    editor.update(
      () => {
        const table = $createTableNodeWithDimensions(3, 3)
        const rows = table.getChildren<TableRowNode>()
        expect(rows.length).toBe(3)

        for (const row of rows) {
          const columns = row.getChildren()
          expect(columns.length).toBe(3)
        }
      },
      { discrete: true },
    )
  })

  describe('row/column header states', () => {
    it('should not add column header when column is false (default case)', () => {
      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(3, 3)
          const rows = table.getChildren<TableRowNode>()
          for (const row of rows) {
            const columns = row.getChildren<TableCellNode>()
            const isFirstRow = table.getFirstChild() === row
            for (const column of columns) {
              const headerStyle = column.getHeaderStyles()
              if (isFirstRow) {
                expect(headerStyle).toBe(TableCellHeaderStates.ROW)
              } else {
                expect(headerStyle).toBe(TableCellHeaderStates.NO_STATUS)
              }
            }
          }
        },
        { discrete: true },
      )
    })

    it('should not add row header if row is false', () => {
      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(3, 3, {
            rows: false,
            columns: true,
          })
          const rows = table.getChildren<TableRowNode>()
          for (const row of rows) {
            const columns = row.getChildren<TableCellNode>()
            for (const column of columns) {
              const isFirstColumn = row.getFirstChild() === column
              const headerStyle = column.getHeaderStyles()
              if (isFirstColumn) {
                expect(headerStyle).toBe(TableCellHeaderStates.COLUMN)
              } else {
                expect(headerStyle).toBe(TableCellHeaderStates.NO_STATUS)
              }
            }
          }
        },
        { discrete: true },
      )
    })

    it('should add row and column header if both are true', () => {
      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(3, 3, {
            rows: true,
            columns: true,
          })
          const rows = table.getChildren<TableRowNode>()
          for (const row of rows) {
            const columns = row.getChildren<TableCellNode>()
            const isFirstRow = table.getFirstChild() === row
            for (const column of columns) {
              const isFirstColumn = row.getFirstChild() === column
              const headerStyle = column.getHeaderStyles()
              if (isFirstRow && isFirstColumn) {
                expect(headerStyle).toBe(TableCellHeaderStates.BOTH)
              } else if (isFirstColumn) {
                expect(headerStyle).toBe(TableCellHeaderStates.COLUMN)
              } else if (isFirstRow) {
                expect(headerStyle).toBe(TableCellHeaderStates.ROW)
              } else {
                expect(headerStyle).toBe(TableCellHeaderStates.NO_STATUS)
              }
            }
          }
        },
        { discrete: true },
      )
    })
  })

  describe('column width', () => {
    it('should add full-width table with equally-sized columns by default', () => {
      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(3, 3)
          const columns = table.getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
          for (const column of columns) {
            const width = column.getWidth()
            expect(width).toBe(100)
          }
        },
        { discrete: true },
      )
    })

    it('should not add any set column width if fullWidth is false', () => {
      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(3, 3, undefined, false)
          const columns = table.getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
          for (const column of columns) {
            const width = column.getWidth()
            expect(width).toBe(undefined)
          }
        },
        { discrete: true },
      )
    })
  })
})
