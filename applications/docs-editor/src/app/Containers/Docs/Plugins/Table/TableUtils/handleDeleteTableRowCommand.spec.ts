import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../../AllNodes'
import type { TableNode, TableRowNode } from '@lexical/table'
import { $createTableNodeWithDimensions } from '@lexical/table'
import { $getRoot, $getSelection, $isRangeSelection, $isRootNode } from 'lexical'
import { $handleDeleteTableRowCommand } from './handleDeleteTableRowCommand'

describe('handleDeleteTableRowCommand', () => {
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

  describe('sibling is available', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(2, 2, false)
          $getRoot().append(table)
          const row = table.getFirstChildOrThrow<TableRowNode>()
          $handleDeleteTableRowCommand(row)
        },
        { discrete: true },
      )
    })

    testEditorState('table should have 1 row remaining', () => {
      const table = $getRoot().getFirstChildOrThrow<TableNode>()
      expect(table.getChildrenSize()).toBe(1)
    })

    testEditorState('selection should be within remaining row', () => {
      const table = $getRoot().getFirstChildOrThrow<TableNode>()
      const selection = $getSelection()!
      if (!$isRangeSelection(selection)) {
        throw new Error('expected range selection')
      }
      expect(selection.isCollapsed()).toBe(true)
      const anchor = selection.anchor.getNode()
      expect(table.getFirstDescendant()?.is(anchor)).toBe(true)
    })
  })

  describe('sibling is not available', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(1, 2, false)
          $getRoot().append(table)
          const row = table.getFirstChildOrThrow<TableRowNode>()
          $handleDeleteTableRowCommand(row)
        },
        { discrete: true },
      )
    })

    testEditorState('table should be cleaned up', () => {
      expect($getRoot().getChildrenSize()).toBe(0)
    })

    testEditorState('selection should be at root', () => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) {
        throw new Error('expected range selection')
      }
      expect(selection.isCollapsed()).toBe(true)
      const anchor = selection.anchor.getNode()
      expect($isRootNode(anchor)).toBe(true)
    })
  })
})
