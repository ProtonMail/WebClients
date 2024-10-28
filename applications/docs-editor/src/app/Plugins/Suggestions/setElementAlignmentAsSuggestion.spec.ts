/* eslint-disable custom-rules/deprecate-classes */
import { createHeadlessEditor } from '@lexical/headless'
import type { Logger } from '@proton/utils/logs'
import { AllNodes } from '../../AllNodes'
import type { ParagraphNode, TextNode } from 'lexical'
import { $createParagraphNode, $createRangeSelection, $createTextNode, $getRoot, $setSelection } from 'lexical'
import type { HeadingNode } from '@lexical/rich-text'
import { $createHeadingNode } from '@lexical/rich-text'
import type { ListItemNode, ListNode } from '@lexical/list'
import { $createListItemNode, $createListNode } from '@lexical/list'
import { $setElementAlignmentAsSuggestion } from './setElementAlignmentAsSuggestion'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { $createTableNodeWithDimensions } from '@lexical/table'
import { $insertFirst } from '@lexical/utils'

const onSuggestionCreation = jest.fn()
const logger = {
  info: jest.fn(),
} as unknown as Logger

describe('$setElementAlignmentAsSuggestion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })

  beforeEach(() => {
    editor.update(
      () => {
        const root = $getRoot()
        root.clear()

        const paragraph = $createParagraphNode().append($createTextNode('1')).setFormat('right')
        const heading = $createHeadingNode('h1').append($createTextNode('2')).setFormat('left')
        const table = $createTableNodeWithDimensions(2, 2)
        const list = $createListNode('bullet').append(
          $createListItemNode().append($createTextNode('3')).setFormat('justify'),
        )
        root.append(paragraph, heading, table, list)
      },
      {
        discrete: true,
      },
    )
  })

  function testEditorState(name: string, fn: () => void) {
    test(name, () => {
      editor.read(fn)
    })
  }

  describe('Single node', () => {
    beforeEach(() => {
      editor.update(
        () => {
          $getRoot().getFirstChildOrThrow<ParagraphNode>().getFirstChildOrThrow<TextNode>().select()
          $setElementAlignmentAsSuggestion('center', onSuggestionCreation, logger)
        },
        { discrete: true },
      )
    })

    testEditorState('paragraph alignment should be updated', () => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      expect(paragraph.getFormatType()).toBe('center')
    })

    testEditorState('paragraph should have suggestion', () => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      const suggestion = paragraph.getFirstChildOrThrow<ProtonNode>()
      expect($isSuggestionNode(suggestion)).toBe(true)
      expect(suggestion.getSuggestionTypeOrThrow()).toBe('align-change')
      const initialFormatType = suggestion.__properties.nodePropertiesChanged!.initialFormatType
      expect(initialFormatType).toBe('right')
    })
  })

  describe('Multiple nodes', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const selection = $createRangeSelection()
          const root = $getRoot()
          const firstDesc = root.getFirstChildOrThrow<ParagraphNode>().getFirstDescendant()!
          const lastDesc = root
            .getLastChildOrThrow<ListNode>()
            .getFirstChildOrThrow<ListItemNode>()
            .getLastDescendant()!
          selection.anchor.set(firstDesc.__key, 0, 'text')
          selection.focus.set(lastDesc.__key, 1, 'text')
          $setSelection(selection)
          $setElementAlignmentAsSuggestion('center', onSuggestionCreation, logger)
        },
        { discrete: true },
      )
    })

    testEditorState('all nodes should have updated alignment', () => {
      const root = $getRoot()

      const paragraph = root.getChildAtIndex<ParagraphNode>(0)!
      const heading = root.getChildAtIndex<HeadingNode>(1)!
      const listItem = root.getChildAtIndex<ListNode>(3)!.getFirstChildOrThrow<ListItemNode>()

      const elements = [paragraph, heading, listItem]
      for (const element of elements) {
        expect(element.getFormatType()).toBe('center')
      }
    })

    testEditorState('paragraph should have suggestion', () => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      const suggestion = paragraph.getFirstChildOrThrow<ProtonNode>()
      expect($isSuggestionNode(suggestion)).toBe(true)
      expect(suggestion.getSuggestionTypeOrThrow()).toBe('align-change')
      const initialFormatType = suggestion.__properties.nodePropertiesChanged!.initialFormatType
      expect(initialFormatType).toBe('right')
    })

    testEditorState('heading should have suggestion', () => {
      const paragraph = $getRoot().getChildAtIndex<HeadingNode>(1)!
      const suggestion = paragraph.getFirstChildOrThrow<ProtonNode>()
      expect($isSuggestionNode(suggestion)).toBe(true)
      expect(suggestion.getSuggestionTypeOrThrow()).toBe('align-change')
      const initialFormatType = suggestion.__properties.nodePropertiesChanged!.initialFormatType
      expect(initialFormatType).toBe('left')
    })

    testEditorState('list item should have suggestion', () => {
      const listItem = $getRoot().getLastChildOrThrow<ListNode>().getFirstChildOrThrow<ListItemNode>()!
      const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
      expect($isSuggestionNode(suggestion)).toBe(true)
      expect(suggestion.getSuggestionTypeOrThrow()).toBe('align-change')
      const initialFormatType = suggestion.__properties.nodePropertiesChanged!.initialFormatType
      expect(initialFormatType).toBe('justify')
    })

    testEditorState('list node should not have direct suggestion child', () => {
      const list = $getRoot().getLastChildOrThrow<ListNode>()!
      const suggestion = list.getChildren().find((n) => $isSuggestionNode(n))
      expect(suggestion).toBeFalsy()
    })

    testEditorState('shadow roots should not have direct suggestion child', () => {
      const table = $getRoot().getChildAtIndex<TableNode>(2)!
      let suggestion = table.getChildren().find((n) => $isSuggestionNode(n))
      expect(suggestion).toBeFalsy()

      const tableRow = table!.getFirstChildOrThrow<TableRowNode>()
      suggestion = tableRow.getChildren().find((n) => $isSuggestionNode(n))
      expect(suggestion).toBeFalsy()

      const tableCell = table!.getFirstChildOrThrow<TableCellNode>()
      suggestion = tableCell.getChildren().find((n) => $isSuggestionNode(n))
      expect(suggestion).toBeFalsy()
    })

    testEditorState('paragraph inside table cell should have suggestion', () => {
      const table = $getRoot().getChildAtIndex<TableNode>(2)!
      const tableRow = table!.getFirstChildOrThrow<TableRowNode>()
      const tableCell = tableRow.getFirstChildOrThrow<TableCellNode>()
      const paragraph = tableCell.getFirstChildOrThrow<ParagraphNode>()
      const suggestion = paragraph.getFirstChildOrThrow<ProtonNode>()
      expect($isSuggestionNode(suggestion)).toBe(true)
      expect(suggestion.getSuggestionTypeOrThrow()).toBe('align-change')
      const initialFormatType = suggestion.__properties.nodePropertiesChanged!.initialFormatType
      expect(initialFormatType).toBe('')
    })
  })

  describe('Existing suggestion', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>().setFormat('right')
          $insertFirst(
            paragraph,
            $createSuggestionNode('test', 'align-change', {
              initialFormatType: 'center',
            }),
          )
          paragraph.getLastChildOrThrow<TextNode>().select()
          $setElementAlignmentAsSuggestion('center', onSuggestionCreation, logger)
        },
        { discrete: true },
      )
    })

    testEditorState('paragraph alignment should be updated', () => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      expect(paragraph.getFormatType()).toBe('center')
    })

    testEditorState('paragraph should not have suggestion', () => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      expect(paragraph.getChildrenSize()).toBe(1)
      expect($isSuggestionNode(paragraph.getFirstChild())).toBe(false)
    })
  })
})
