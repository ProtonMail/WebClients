import type { LexicalEditor } from 'lexical'
import type { Root } from 'react-dom/client'
import { $createParagraphNode, $createTextNode, $getRoot, $insertNodes, $isParagraphNode } from 'lexical'
import { AllNodes } from '../../AllNodes'
import { createRoot } from 'react-dom/client'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React from 'react'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ProtonContentEditable } from '../../ContentEditable/ProtonContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import * as ReactTestUtils from '../../Utils/react-test-utils'
import { assertCondition } from '../Suggestions/TestUtils'
import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import {
  $createTableCellNode,
  $createTableNode,
  $createTableNodeWithDimensions,
  $createTableRowNode,
  $isTableNode,
  $isTableRowNode,
} from '@lexical/table'
import { $generateNodesFromDOM } from '@lexical/html'
import { TablePlugin } from './TablePlugin'
import { mergedCellsHTML, TablesWithUnalignedRowsAndColumns } from './__mocks__/TestTables'
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text'

jest.mock('../../Lib/useEditorStateValues', () => ({
  useEditorStateValues: () => ({ isSuggestionMode: false }),
}))

describe('TablePlugin', () => {
  let container: HTMLElement
  let reactRoot: Root
  let editor: LexicalEditor | null = null

  async function update(fn: () => void) {
    await ReactTestUtils.act(async () => {
      await editor!.update(fn)
    })
  }

  async function init() {
    function TestBase() {
      function TestPlugin() {
        ;[editor] = useLexicalComposerContext()
        return null
      }
      return (
        <LexicalComposer
          initialConfig={{
            namespace: 'test',
            nodes: AllNodes,
            onError: console.error,
          }}
        >
          <RichTextPlugin
            contentEditable={<ProtonContentEditable isSuggestionMode={true} />}
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <TestPlugin />
          <TablePlugin />
        </LexicalComposer>
      )
    }

    await ReactTestUtils.act(async () => {
      reactRoot.render(<TestBase />)
      await Promise.resolve().then()
    })

    await update(() => {
      $getRoot().clear()
    })

    await Promise.resolve().then()
  }

  beforeEach(async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    reactRoot = createRoot(container)
    await init()
  })

  afterEach(async () => {
    // Ensure we are clearing out any React state and running effects with
    // act
    await ReactTestUtils.act(async () => {
      reactRoot.unmount()
      await Promise.resolve().then()
    })
    document.body.removeChild(container)
  })

  function testEditorState(name: string, fn: () => void) {
    test(name, () => {
      editor!.read(fn)
    })
  }

  const parser = new DOMParser()

  async function insertTableHTML(html: string) {
    await update(() => {
      const dom = parser.parseFromString(html, 'text/html')
      const generatedNodes = $generateNodesFromDOM(editor!, dom)
      $getRoot().selectEnd()
      $insertNodes(generatedNodes)
    })
  }

  function $getTables() {
    const root = $getRoot()
    const tables: TableNode[] = []
    for (const child of root.getChildren()) {
      if ($isTableNode(child)) {
        tables.push(child)
      }
    }
    return tables
  }

  describe('should add paragraphs if table doesnt have sibling(s)', () => {
    describe('doesnt have prev sibling', () => {
      beforeEach(async () => {
        await update(() => {
          const table = $createTableNodeWithDimensions(1, 1)
          const heading = $createHeadingNode('h1').append($createTextNode('h1'))
          $getRoot().append(table, heading)
        })
      })

      testEditorState('should add paragraph before table', () => {
        const children = $getRoot().getChildren()
        expect(children.length).toBe(3)
        expect($isParagraphNode(children[0])).toBe(true)
        expect($isTableNode(children[1])).toBe(true)
        expect($isHeadingNode(children[2])).toBe(true)
      })
    })

    describe('doesnt have next sibling', () => {
      beforeEach(async () => {
        await update(() => {
          const heading = $createHeadingNode('h1').append($createTextNode('h1'))
          const table = $createTableNodeWithDimensions(1, 1)
          $getRoot().append(heading, table)
        })
      })

      testEditorState('should add paragraph after table', () => {
        const children = $getRoot().getChildren()
        expect(children.length).toBe(3)
        expect($isHeadingNode(children[0])).toBe(true)
        expect($isTableNode(children[1])).toBe(true)
        expect($isParagraphNode(children[2])).toBe(true)
      })
    })

    describe('doesnt have both siblings', () => {
      beforeEach(async () => {
        await update(() => {
          const table = $createTableNodeWithDimensions(1, 1)
          $getRoot().append(table)
        })
      })

      testEditorState('should add paragraph after table', () => {
        const children = $getRoot().getChildren()
        expect(children.length).toBe(3)
        expect($isParagraphNode(children[0])).toBe(true)
        expect($isTableNode(children[1])).toBe(true)
        expect($isParagraphNode(children[2])).toBe(true)
      })
    })

    describe('has table sibling', () => {
      beforeEach(async () => {
        await update(() => {
          const table = $createTableNodeWithDimensions(1, 1)
          const table2 = $createTableNodeWithDimensions(1, 1)
          $getRoot().append($createParagraphNode(), table, table2, $createParagraphNode())
        })
      })

      testEditorState('should add paragraph between tables', () => {
        const children = $getRoot().getChildren()
        expect(children.length).toBe(5)
        expect($isTableNode(children[1])).toBe(true)
        expect($isParagraphNode(children[2])).toBe(true)
        expect($isTableNode(children[3])).toBe(true)
      })
    })
  })

  describe('should unmerge cells that have rowspan/colspan', () => {
    beforeEach(async () => {
      await insertTableHTML(mergedCellsHTML)
    })

    testEditorState('table should be imported', () => {
      const tables = $getTables()
      expect(tables.length).toBe(1)
      const table = tables[0]
      assertCondition($isTableNode(table))
    })

    testEditorState('table should have 4 rows', () => {
      const table = $getTables()[0]
      const children = table.getChildren()
      expect(children.length).toBe(4)
      expect(children.every($isTableRowNode)).toBe(true)
    })

    testEditorState('every row should have equal number of cells', () => {
      const table = $getTables()[0]
      const rows = table.getChildren<TableRowNode>()
      const countSet = new Set<number>()
      for (const row of rows) {
        countSet.add(row.getChildrenSize())
      }
      expect(countSet.size).toBe(1)
    })
  })

  describe('should cleanup orphan rows and cells', () => {
    describe('orphan rows', () => {
      beforeEach(async () => {
        await update(() => {
          $getRoot().append($createParagraphNode().append($createTableRowNode()), $createTableRowNode())
        })
      })

      testEditorState('orphan rows should be removed', () => {
        const rootChildren = $getRoot().getChildren()
        expect(rootChildren.length).toBe(1)

        const paragraph = rootChildren[0]
        assertCondition($isParagraphNode(paragraph))
        expect(paragraph.getChildrenSize()).toBe(0)
      })
    })

    describe('orphan cells', () => {
      beforeEach(async () => {
        await update(() => {
          $getRoot().append($createParagraphNode().append($createTableCellNode()), $createTableCellNode())
        })
      })

      testEditorState('orphan rows should be removed', () => {
        const rootChildren = $getRoot().getChildren()
        expect(rootChildren.length).toBe(1)

        const paragraph = rootChildren[0]
        assertCondition($isParagraphNode(paragraph))
        expect(paragraph.getChildrenSize()).toBe(0)
      })
    })
  })

  test('should populate empty cells', async () => {
    await update(() => {
      const table = $createTableNode().append($createTableRowNode().append($createTableCellNode()))
      $getRoot().append(table)
    })

    editor!.read(() => {
      const table = $getTables()[0]
      const cell = table.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>()
      const children = cell.getChildren()
      expect(children.length).toBe(1)
      expect($isParagraphNode(children[0])).toBe(true)
    })
  })

  describe('should normalize tables with missing cells or rows', () => {
    let index = 0
    for (const html of TablesWithUnalignedRowsAndColumns) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      test(`table ${index++}`, async () => {
        await insertTableHTML(html)

        editor!.read(() => {
          const table = $getTables()[0]
          const rows = table.getChildren<TableRowNode>()
          const countSet = new Set<number>()
          for (const row of rows) {
            countSet.add(row.getChildrenSize())
          }
          expect(countSet.size).toBe(1)
        })
      })
    }
  })
})
