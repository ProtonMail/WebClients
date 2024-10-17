import { createHeadlessEditor } from '@lexical/headless'
import { $createTextNode, $getRoot } from 'lexical'
import { AllNodes } from '../../AllNodes'
import {
  $duplicateTableColumnAsSuggestion,
  $duplicateTableRowAsSuggestion,
  $insertNewTableAsSuggestion,
  $insertNewTableColumnAsSuggestion,
  $insertNewTableRowAsSuggestion,
  $suggestTableColumnDeletion,
  $suggestTableDeletion,
  $suggestTableRowDeletion,
} from './handleTables'
import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { $isTableCellNode } from '@lexical/table'
import { $isTableRowNode } from '@lexical/table'
import { $isTableNode } from '@lexical/table'
import type { ProtonNode } from './ProtonNode'
import { $isSuggestionNode } from './ProtonNode'
import { $createTableNodeWithDimensions } from '../Table/CreateTableNodeWithDimensions'
import type { Logger } from '@proton/utils/logs'

const onSuggestionCreation = jest.fn()
const logger = {
  info: jest.fn(),
} as unknown as Logger

describe('$insertNewTableAsSuggestion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })
  editor.getRootElement = jest.fn().mockImplementation(() => {
    const root = {
      clientWidth: 320,
      paddingLeft: 10,
      paddingRight: 10,
    }
    return root
  })

  beforeEach(() => {
    editor.update(
      () => {
        const root = $getRoot()
        root.clear()
        root.selectEnd()
        $insertNewTableAsSuggestion({ rows: '2', columns: '2', fullWidth: false }, onSuggestionCreation)
      },
      {
        discrete: true,
      },
    )
  })

  test('should insert table', () => {
    editor.read(() => {
      const root = $getRoot()
      const table = root.getFirstChildOrThrow()
      expect($isTableNode(table)).toBe(true)
    })
  })

  test('should remove extra added empty paragraph', () => {
    editor.read(() => {
      expect($getRoot().getChildrenSize()).toBe(1)
    })
  })

  test('should prepend insert-table suggestion to all cells', () => {
    editor.read(() => {
      const table = $getRoot().getFirstChildOrThrow<TableNode>()
      const cells = table
        .getChildren<TableRowNode>()
        .map((row) => row.getChildren<TableCellNode>())
        .flat()
      for (const cell of cells) {
        expect(cell.getChildrenSize()).toBe(2)
        const suggestion = cell.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('insert-table')
      }
    })
  })
})

describe('$suggestTableDeletion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })
  editor.getRootElement = jest.fn().mockImplementation(() => {
    const root = {
      clientWidth: 320,
      paddingLeft: 10,
      paddingRight: 10,
    }
    return root
  })

  describe('suggest deleting existing table', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          const tableNode = $createTableNodeWithDimensions(2, 2, undefined, false)
          root.append(tableNode)
          $suggestTableDeletion(tableNode.__key, onSuggestionCreation, logger)
        },
        {
          discrete: true,
        },
      )
    })

    test('should prepend delete-table suggestion to all cells', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const cells = table
          .getChildren<TableRowNode>()
          .map((row) => row.getChildren<TableCellNode>())
          .flat()
        for (const cell of cells) {
          expect(cell.getChildrenSize()).toBe(2)
          const suggestion = cell.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion.getSuggestionTypeOrThrow()).toBe('delete-table')
        }
      })
    })
  })

  describe('suggest deleting table inserted as suggestion', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          $insertNewTableAsSuggestion({ rows: '2', columns: '2', fullWidth: false }, onSuggestionCreation)
          const tableNode = root.getFirstChildOrThrow()
          $suggestTableDeletion(tableNode.__key, onSuggestionCreation, logger)
        },
        {
          discrete: true,
        },
      )
    })

    test('should actually delete table', () => {
      editor.read(() => {
        expect($getRoot().getChildrenSize()).toBe(0)
      })
    })
  })
})

describe('$insertNewTableRowAsSuggestion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })
  editor.getRootElement = jest.fn().mockImplementation(() => {
    const root = {
      clientWidth: 320,
      paddingLeft: 10,
      paddingRight: 10,
    }
    return root
  })

  describe('inside existing non-suggestion table', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          const tableNode = $createTableNodeWithDimensions(1, 1, undefined, false)
          const firstCell = tableNode.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>()
          firstCell.append($createTextNode('initial'))
          root.append(tableNode)
          firstCell.selectStart()
          $insertNewTableRowAsSuggestion(false, onSuggestionCreation)
          firstCell.selectStart()
          $insertNewTableRowAsSuggestion(true, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('table should have 3 rows in total', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        expect(table.getChildrenSize()).toBe(3)
      })
    })

    test('should add new row before initial', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const firstRow = table.getChildAtIndex<TableRowNode>(0)
        expect($isTableRowNode(firstRow)).toBe(true)
        expect(firstRow?.getTextContent().trim()).toBe('')
        const initialRow = table.getChildAtIndex<TableRowNode>(1)
        expect($isTableRowNode(initialRow)).toBe(true)
        expect(initialRow?.getTextContent().trim()).toBe('initial')
      })
    })

    test('should add new row after initial', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const initialRow = table.getChildAtIndex<TableRowNode>(1)
        expect($isTableRowNode(initialRow)).toBe(true)
        expect(initialRow?.getTextContent().trim()).toBe('initial')
        const lastRow = table.getChildAtIndex<TableRowNode>(2)
        expect($isTableRowNode(lastRow)).toBe(true)
        expect(lastRow?.getTextContent().trim()).toBe('')
      })
    })

    test('inserted row should have insert-table-row suggestion', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const firstRow = table.getChildAtIndex<TableRowNode>(0)
        expect($isTableRowNode(firstRow)).toBe(true)
        const suggestion = firstRow?.getFirstDescendant<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion?.getSuggestionTypeOrThrow()).toBe('insert-table-row')
      })
    })
  })

  describe('inside table inserted as suggestion', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          $insertNewTableAsSuggestion({ rows: '1', columns: '1', fullWidth: false }, onSuggestionCreation)
          const tableNode = $getRoot().getFirstChildOrThrow<TableNode>()
          const firstCell = tableNode.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>()
          firstCell.append($createTextNode('initial'))
          root.append(tableNode)
          firstCell.selectStart()
          $insertNewTableRowAsSuggestion(false, onSuggestionCreation)
          firstCell.selectStart()
          $insertNewTableRowAsSuggestion(true, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('table should have 3 rows in total', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        expect(table.getChildrenSize()).toBe(3)
      })
    })

    test('should not add insert-table-row suggestion', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const firstRow = table.getChildAtIndex<TableRowNode>(0)
        expect($isTableRowNode(firstRow)).toBe(true)
        expect(firstRow?.getChildrenSize()).toBe(1)
        const firstDescendant = firstRow?.getFirstDescendant<ProtonNode>()
        expect(firstDescendant?.getSuggestionTypeOrThrow()).not.toBe('insert-table-row')
      })
    })
  })
})

describe('$insertNewTableColumnAsSuggestion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })
  editor.getRootElement = jest.fn().mockImplementation(() => {
    const root = {
      clientWidth: 320,
      paddingLeft: 10,
      paddingRight: 10,
    }
    return root
  })

  describe('inside existing non-suggestion table', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          const tableNode = $createTableNodeWithDimensions(1, 1, undefined, false)
          const firstCell = tableNode.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>()
          firstCell.append($createTextNode('initial'))
          root.append(tableNode)
          firstCell.selectStart()
          $insertNewTableColumnAsSuggestion(false, onSuggestionCreation)
          firstCell.selectStart()
          $insertNewTableColumnAsSuggestion(true, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('table should have 3 columns in total', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const row = table.getFirstChildOrThrow<TableRowNode>()
        expect(row.getChildrenSize()).toBe(3)
      })
    })

    test('should add new column before initial', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const row = table.getFirstChildOrThrow<TableRowNode>()
        const firstColumn = row.getChildAtIndex<TableCellNode>(0)
        expect($isTableCellNode(firstColumn)).toBe(true)
        expect(firstColumn?.getTextContent().trim()).toBe('')
        const initialColumn = row.getChildAtIndex<TableCellNode>(1)
        expect($isTableCellNode(initialColumn)).toBe(true)
        expect(initialColumn?.getTextContent().trim()).toBe('initial')
      })
    })

    test('should add new column after initial', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const row = table.getFirstChildOrThrow<TableRowNode>()
        const initialColumn = row.getChildAtIndex<TableCellNode>(1)
        expect($isTableCellNode(initialColumn)).toBe(true)
        expect(initialColumn?.getTextContent().trim()).toBe('initial')
        const lastColumn = row.getChildAtIndex<TableCellNode>(2)
        expect($isTableCellNode(lastColumn)).toBe(true)
        expect(lastColumn?.getTextContent().trim()).toBe('')
      })
    })

    test('inserted cell should have insert-table-column suggestion', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const row = table.getFirstChildOrThrow<TableRowNode>()
        const firstColumn = row.getChildAtIndex<TableCellNode>(0)
        const suggestion = firstColumn?.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion?.getSuggestionTypeOrThrow()).toBe('insert-table-column')
      })
    })
  })

  describe('inside table inserted as suggestion', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          $insertNewTableAsSuggestion({ rows: '1', columns: '1', fullWidth: false }, onSuggestionCreation)
          const tableNode = $getRoot().getFirstChildOrThrow<TableNode>()
          const firstCell = tableNode.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>()
          firstCell.append($createTextNode('initial'))
          root.append(tableNode)
          firstCell.selectStart()
          $insertNewTableColumnAsSuggestion(false, onSuggestionCreation)
          firstCell.selectStart()
          $insertNewTableColumnAsSuggestion(true, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('table should have 3 columns in total', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const row = table.getFirstChildOrThrow<TableRowNode>()
        expect(row.getChildrenSize()).toBe(3)
      })
    })

    test('should not add insert-table-column suggestion', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const firstRow = table.getChildAtIndex<TableRowNode>(0)
        const firstDescendant = firstRow?.getFirstDescendant<ProtonNode>()
        expect(firstDescendant?.getSuggestionTypeOrThrow()).not.toBe('insert-table-column')
      })
    })
  })
})

describe('$suggestTableRowDeletion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })
  editor.getRootElement = jest.fn().mockImplementation(() => {
    const root = {
      clientWidth: 320,
      paddingLeft: 10,
      paddingRight: 10,
    }
    return root
  })

  describe('suggest deleting row in existing table', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          const tableNode = $createTableNodeWithDimensions(2, 2, undefined, false)
          root.append(tableNode)
          const rowToDelete = tableNode.getChildAtIndex<TableRowNode>(1)!
          $suggestTableRowDeletion(rowToDelete, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('should prepend delete-table-row suggestion to all cells in row', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const rowToDelete = table.getChildAtIndex<TableRowNode>(1)!
        const cells = rowToDelete.getChildren<TableCellNode>()
        for (const cell of cells) {
          expect(cell.getChildrenSize()).toBe(2)
          const suggestion = cell.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion.getSuggestionTypeOrThrow()).toBe('delete-table-row')
        }
      })
    })
  })

  describe('suggest deleting row in table inserted as suggestion', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          $insertNewTableAsSuggestion({ rows: '2', columns: '2', fullWidth: false }, onSuggestionCreation)
          const tableNode = root.getFirstChildOrThrow<TableNode>()
          const rowToDelete = tableNode.getChildAtIndex<TableRowNode>(1)!
          $suggestTableRowDeletion(rowToDelete, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('should actually delete row', () => {
      editor.read(() => {
        const tableNode = $getRoot().getFirstChildOrThrow<TableNode>()
        expect(tableNode.getChildrenSize()).toBe(1)
      })
    })
  })

  describe('suggest deleting row inserted as suggestion', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          const tableNode = $createTableNodeWithDimensions(1, 1, undefined, false)
          const firstCell = tableNode.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>()
          firstCell.append($createTextNode('initial'))
          root.append(tableNode)
          firstCell.selectStart()
          $insertNewTableRowAsSuggestion(true, onSuggestionCreation)
          const rowToDelete = tableNode.getLastChildOrThrow<TableRowNode>()
          $suggestTableRowDeletion(rowToDelete, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('should actually delete row', () => {
      editor.read(() => {
        const tableNode = $getRoot().getFirstChildOrThrow<TableNode>()
        expect(tableNode.getChildrenSize()).toBe(1)
      })
    })
  })
})

describe('$suggestTableColumnDeletion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })
  editor.getRootElement = jest.fn().mockImplementation(() => {
    const root = {
      clientWidth: 320,
      paddingLeft: 10,
      paddingRight: 10,
    }
    return root
  })

  describe('suggest deleting column in existing table', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          const tableNode = $createTableNodeWithDimensions(2, 2, undefined, false)
          root.append(tableNode)
          const columnToDelete = tableNode.getFirstChildOrThrow<TableRowNode>().getChildAtIndex<TableCellNode>(1)!
          $suggestTableColumnDeletion(columnToDelete, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('should prepend delete-table-column suggestion to all cells in column', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        for (const row of table.getChildren<TableRowNode>()) {
          const cellToDelete = row.getChildAtIndex<TableCellNode>(1)!
          expect(cellToDelete.getChildrenSize()).toBe(2)
          const suggestion = cellToDelete.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion.getSuggestionTypeOrThrow()).toBe('delete-table-column')
        }
      })
    })
  })

  describe('suggest deleting row in table inserted as suggestion', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          $insertNewTableAsSuggestion({ rows: '2', columns: '2', fullWidth: false }, onSuggestionCreation)
          const tableNode = root.getFirstChildOrThrow<TableNode>()
          const columnToDelete = tableNode.getFirstChildOrThrow<TableRowNode>().getChildAtIndex<TableCellNode>(1)!
          $suggestTableColumnDeletion(columnToDelete, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('should actually delete column', () => {
      editor.read(() => {
        const tableNode = $getRoot().getFirstChildOrThrow<TableNode>()
        for (const row of tableNode.getChildren<TableRowNode>()) {
          expect(row.getChildrenSize()).toBe(1)
        }
      })
    })
  })

  describe('suggest deleting column inserted as suggestion', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          const tableNode = $createTableNodeWithDimensions(2, 1, undefined, false)
          const firstCell = tableNode.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>()
          firstCell.append($createTextNode('initial'))
          root.append(tableNode)
          firstCell.selectStart()
          $insertNewTableColumnAsSuggestion(true, onSuggestionCreation)
          const columnToDelete = tableNode.getFirstChildOrThrow<TableRowNode>().getChildAtIndex<TableCellNode>(1)!
          $suggestTableColumnDeletion(columnToDelete, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('should actually delete column', () => {
      editor.read(() => {
        const tableNode = $getRoot().getFirstChildOrThrow<TableNode>()
        for (const row of tableNode.getChildren<TableRowNode>()) {
          expect(row.getChildrenSize()).toBe(1)
        }
      })
    })
  })
})

describe('$duplicateTableRowAsSuggestion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })
  editor.getRootElement = jest.fn().mockImplementation(() => {
    const root = {
      clientWidth: 320,
      paddingLeft: 10,
      paddingRight: 10,
    }
    return root
  })

  describe('inside existing non-suggestion table', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          const tableNode = $createTableNodeWithDimensions(1, 1, undefined, false)
          const firstCell = tableNode.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>()
          firstCell.append($createTextNode('initial'))
          root.append(tableNode)
          firstCell.selectStart()
          const rowToDuplicate = tableNode.getFirstChildOrThrow<TableRowNode>()
          $duplicateTableRowAsSuggestion(rowToDuplicate, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('table should have 2 rows in total', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        expect(table.getChildrenSize()).toBe(2)
      })
    })

    test('should duplicate row', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const initialRow = table.getChildAtIndex<TableRowNode>(0)
        expect($isTableRowNode(initialRow)).toBe(true)
        expect(initialRow?.getTextContent().trim()).toBe('initial')
        const duplicatedRow = table.getChildAtIndex<TableRowNode>(1)
        expect($isTableRowNode(duplicatedRow)).toBe(true)
        expect(duplicatedRow?.getTextContent().trim()).toBe('initial')
      })
    })

    test('duplicated row should have duplicate-table-row suggestion', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const duplicatedRow = table.getChildAtIndex<TableRowNode>(1)
        expect($isTableRowNode(duplicatedRow)).toBe(true)
        const suggestion = duplicatedRow?.getFirstDescendant<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion?.getSuggestionTypeOrThrow()).toBe('duplicate-table-row')
      })
    })
  })

  describe('inside table inserted as suggestion', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          $insertNewTableAsSuggestion({ rows: '1', columns: '1', fullWidth: false }, onSuggestionCreation)
          const tableNode = $getRoot().getFirstChildOrThrow<TableNode>()
          const firstCell = tableNode.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>()
          firstCell.append($createTextNode('initial'))
          root.append(tableNode)
          firstCell.selectStart()
          const rowToDuplicate = tableNode.getFirstChildOrThrow<TableRowNode>()
          $duplicateTableRowAsSuggestion(rowToDuplicate, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('table should have 2 rows in total', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        expect(table.getChildrenSize()).toBe(2)
      })
    })

    test('should not add duplicate-table-row suggestion', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const duplicatedRow = table.getChildAtIndex<TableRowNode>(0)
        expect($isTableRowNode(duplicatedRow)).toBe(true)
        expect(duplicatedRow?.getChildrenSize()).toBe(1)
        const firstDescendant = duplicatedRow?.getFirstDescendant<ProtonNode>()
        expect(firstDescendant?.getSuggestionTypeOrThrow()).not.toBe('duplicate-table-row')
      })
    })
  })
})

describe('$duplicateTableColumnAsSuggestion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })
  editor.getRootElement = jest.fn().mockImplementation(() => {
    const root = {
      clientWidth: 320,
      paddingLeft: 10,
      paddingRight: 10,
    }
    return root
  })

  describe('inside existing non-suggestion table', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          const tableNode = $createTableNodeWithDimensions(2, 1, undefined, false)
          root.append(tableNode)
          const firstCell = tableNode.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>()
          const secondCell = tableNode.getLastChildOrThrow<TableRowNode>().getLastChildOrThrow<TableCellNode>()
          firstCell.append($createTextNode('1'))
          secondCell.append($createTextNode('2'))
          const columnToDuplicate = tableNode.getFirstDescendant<TableCellNode>()!
          $duplicateTableColumnAsSuggestion(columnToDuplicate, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('table should have 2 columns', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        for (const row of table.getChildren<TableRowNode>()) {
          expect(row.getChildrenSize()).toBe(2)
        }
      })
    })

    test('should duplicate column', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        for (const row of table.getChildren<TableRowNode>()) {
          const firstCell = row.getFirstChildOrThrow<TableCellNode>()
          expect($isTableCellNode(firstCell)).toBe(true)
          const duplicatedCell = row.getLastChildOrThrow<TableCellNode>()
          expect($isTableCellNode(duplicatedCell)).toBe(true)
          expect(firstCell.getTextContent()).toBe(duplicatedCell.getTextContent())
        }
      })
    })

    test('duplicated column should have duplicate-table-column suggestion', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        for (const row of table.getChildren<TableRowNode>()) {
          const duplicatedCell = row.getLastChildOrThrow<TableCellNode>()
          expect($isTableCellNode(duplicatedCell)).toBe(true)
          const suggestion = duplicatedCell?.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion?.getSuggestionTypeOrThrow()).toBe('duplicate-table-column')
        }
      })
    })
  })

  describe('inside table inserted as suggestion', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
          root.selectEnd()
          $insertNewTableAsSuggestion({ rows: '2', columns: '1', fullWidth: false }, onSuggestionCreation)
          const tableNode = $getRoot().getFirstChildOrThrow<TableNode>()
          const firstCell = tableNode.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>()
          const secondCell = tableNode.getLastChildOrThrow<TableRowNode>().getLastChildOrThrow<TableCellNode>()
          firstCell.append($createTextNode('1'))
          secondCell.append($createTextNode('2'))
          const columnToDuplicate = tableNode.getFirstDescendant<TableCellNode>()!
          $duplicateTableColumnAsSuggestion(columnToDuplicate, onSuggestionCreation)
        },
        {
          discrete: true,
        },
      )
    })

    test('table should have 2 columns', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        for (const row of table.getChildren<TableRowNode>()) {
          expect(row.getChildrenSize()).toBe(2)
        }
      })
    })

    test('should not add duplicate-table-column suggestion', () => {
      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        for (const row of table.getChildren<TableRowNode>()) {
          const duplicatedCell = row.getLastChildOrThrow<TableCellNode>()
          expect($isTableCellNode(duplicatedCell)).toBe(true)
          const suggestion = duplicatedCell?.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion?.getSuggestionTypeOrThrow()).not.toBe('duplicate-table-column')
        }
      })
    })
  })
})
