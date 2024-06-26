import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../../AllNodes'
import { $createTableNodeWithDimensions } from '../CreateTableNodeWithDimensions'
import { $createParagraphNode, $createTextNode, $getRoot, $setSelection } from 'lexical'
import { $createTableSelection, TableCellNode, TableRowNode } from '@lexical/table'
import { $clearCellsInTableSelection } from './clearCellsInTableSelection'

describe('clearCellsInTableSelection', () => {
  const editor = createHeadlessEditor({
    editable: false,
    editorState: undefined,
    namespace: 'export-editor',
    nodes: AllNodes,
    onError: console.error,
  })

  editor.getRootElement = jest.fn()
  it('should clear cells in table selection', () => {
    editor.update(
      () => {
        const table = $createTableNodeWithDimensions(2, 2)
        const getCells = () =>
          table
            .getChildren<TableRowNode>()
            .map((row) => row.getChildren<TableCellNode>())
            .flat()
        let index = 1
        for (const cell of getCells()) {
          const paragraph = $createParagraphNode()
          const text = $createTextNode(index.toString())
          paragraph.append(text)
          cell.append(paragraph)
          index++
        }
        $getRoot().append(table)
        for (const cell of getCells()) {
          expect(cell.getTextContentSize()).toBeGreaterThan(0)
        }
        const tableSelection = $createTableSelection()
        const firstCell = table.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>()
        const lastCell = table.getLastChildOrThrow<TableRowNode>().getLastChildOrThrow<TableCellNode>()
        tableSelection.set(table.getKey(), firstCell.getKey(), lastCell.getKey())
        $setSelection(tableSelection)
        $clearCellsInTableSelection()
        for (const cell of getCells()) {
          expect(cell.getTextContentSize()).toBe(0)
        }
      },
      {
        discrete: true,
      },
    )
  })
})
