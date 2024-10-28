import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../../AllNodes'
import type { TableNode, TableRowNode } from '@lexical/table'
import { $createTableNode, $createTableRowNode } from '@lexical/table'
import { $createTableNodeWithDimensions } from '@lexical/table'
import { $getRoot } from 'lexical'
import { $cleanupTableIfEmpty } from './cleanupTableIfEmpty'

describe('cleanupTableIfEmpty', () => {
  const editor = createHeadlessEditor({
    editable: false,
    editorState: undefined,
    namespace: 'export-editor',
    nodes: AllNodes,
    onError: console.error,
  })

  editor.getRootElement = jest.fn()

  beforeEach(() => {
    editor.update(
      () => {
        const root = $getRoot()
        root.clear()
      },
      { discrete: true },
    )
  })

  const testEditorState = (name: string, fn: () => void) => {
    test(name, () => {
      editor.read(fn)
    })
  }

  describe('normal table', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(2, 2, false)
          $getRoot().append(table)
          $cleanupTableIfEmpty(table)
        },
        { discrete: true },
      )
    })

    testEditorState('table should not be cleaned up', () => {
      const root = $getRoot()
      expect(root.getChildrenSize()).toBe(1)

      const table = root.getFirstChildOrThrow<TableNode>()
      expect(table.getChildrenSize()).toBe(2)

      for (const row of table.getChildren<TableRowNode>()) {
        expect(row.getChildrenSize()).toBe(2)
      }
    })
  })

  describe('table with no rows', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const table = $createTableNode()
          $getRoot().append(table)
          $cleanupTableIfEmpty(table)
        },
        { discrete: true },
      )
    })

    testEditorState('table should be cleaned up', () => {
      const root = $getRoot()
      expect(root.getChildrenSize()).toBe(0)
    })
  })

  describe('table with empty rows', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const table = $createTableNode()
          table.append($createTableRowNode(), $createTableRowNode())
          $getRoot().append(table)
          $cleanupTableIfEmpty(table)
        },
        { discrete: true },
      )
    })

    testEditorState('table should be cleaned up', () => {
      const root = $getRoot()
      expect(root.getChildrenSize()).toBe(0)
    })
  })
})
