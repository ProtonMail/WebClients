import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../../AllNodes'
import type { TableNode, TableRowNode } from '@lexical/table'
import { $createTableNode, $createTableRowNode } from '@lexical/table'
import { $createTableNodeWithDimensions } from '@lexical/table'
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isRootNode,
} from 'lexical'
import { $cleanupTableIfEmpty } from './cleanupTableIfEmpty'
import { assertCondition } from '../../Suggestions/TestUtils'

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

  describe('selection after cleaning up', () => {
    test('has prev sibling', () => {
      let paragraphKey: string | undefined
      editor.update(
        () => {
          const table = $createTableNode()
          const paragraph = $createParagraphNode()
          paragraphKey = paragraph.__key
          $getRoot().append(paragraph, table)
          $cleanupTableIfEmpty(table)
        },
        { discrete: true },
      )
      editor.read(() => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(1)
        const selection = $getSelection()
        assertCondition($isRangeSelection(selection))
        const focusNode = selection.focus.getNode()
        assertCondition($isParagraphNode(focusNode))
        expect(focusNode.__key).toBe(paragraphKey)
      })
    })

    test('has next sibling', () => {
      let paragraphKey: string | undefined
      editor.update(
        () => {
          const table = $createTableNode()
          const paragraph = $createParagraphNode()
          paragraphKey = paragraph.__key
          $getRoot().append(table, paragraph)
          $cleanupTableIfEmpty(table)
        },
        { discrete: true },
      )
      editor.read(() => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(1)
        const selection = $getSelection()
        assertCondition($isRangeSelection(selection))
        const focusNode = selection.focus.getNode()
        assertCondition($isParagraphNode(focusNode))
        expect(focusNode.__key).toBe(paragraphKey)
      })
    })

    test('has neither sibling', () => {
      editor.update(
        () => {
          const table = $createTableNode()
          $getRoot().append(table)
          $cleanupTableIfEmpty(table)
        },
        { discrete: true },
      )
      editor.read(() => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(0)
        const selection = $getSelection()
        assertCondition($isRangeSelection(selection))
        const focusNode = selection.focus.getNode()
        assertCondition($isRootNode(focusNode))
      })
    })
  })
})
