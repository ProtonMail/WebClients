import { createHeadlessEditor } from '@lexical/headless'
import type { TextNode } from 'lexical'
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $isTextNode,
  $setSelection,
} from 'lexical'
import type { Logger } from '@proton/utils/logs'
import { AllNodes } from '../../AllNodes'
import { $insertListAsSuggestion } from './insertListAsSuggestion'
import type { ListItemNode, ListNode } from '@lexical/list'
import { $createListItemNode, $createListNode, $isListItemNode, $isListNode } from '@lexical/list'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import type { CustomListNode } from '../CustomList/CustomListNode'
import type { BlockTypeChangeSuggestionProperties } from './Types'
import { $createCustomListNode } from '../CustomList/$createCustomListNode'
import { $createHeadingNode } from '@lexical/rich-text'
import { assertCondition } from './TestUtils'

const onSuggestionCreation = jest.fn()
const logger = {
  info: jest.fn(),
} as unknown as Logger

describe('$insertListAsSuggestion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })

  function update(fn: () => void) {
    editor.update(fn, {
      discrete: true,
    })
  }

  beforeEach(() => {
    update(() => {
      const root = $getRoot()
      root.clear()
    })
  })

  function testEditorState(name: string, fn: () => void) {
    test(name, () => {
      editor.read(fn)
    })
  }

  describe('Selection at root', () => {
    describe('Has first child', () => {
      beforeEach(() => {
        update(() => {
          const root = $getRoot()
          root.append($createParagraphNode())
          const selection = $createRangeSelection()
          selection.anchor.set('root', 0, 'element')
          selection.focus.set('root', 0, 'element')
          $setSelection(selection)
          $insertListAsSuggestion(editor, 'bullet', onSuggestionCreation, logger, undefined, undefined)
        })
      })

      testEditorState('root should have 1 child', () => {
        expect($getRoot().getChildrenSize()).toBe(1)
      })

      testEditorState('should change paragraph to list', () => {
        const list = $getRoot().getFirstChildOrThrow<ListNode>()
        expect($isListNode(list)).toBe(true)
        expect(list.getListType()).toBe('bullet')
      })

      testEditorState('should have suggestion', () => {
        const listItem = $getRoot().getFirstChildOrThrow<ListNode>().getFirstChildOrThrow<ListItemNode>()
        expect(listItem.getChildrenSize()).toBe(1)
        const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('paragraph')
      })
    })

    describe('Empty root', () => {
      beforeEach(() => {
        update(() => {
          const selection = $createRangeSelection()
          selection.anchor.set('root', 0, 'element')
          selection.focus.set('root', 0, 'element')
          $setSelection(selection)
          $insertListAsSuggestion(editor, 'bullet', onSuggestionCreation, logger, undefined, undefined)
        })
      })

      testEditorState('root should have 1 child', () => {
        expect($getRoot().getChildrenSize()).toBe(1)
      })

      testEditorState('should change paragraph to list', () => {
        const list = $getRoot().getFirstChildOrThrow<ListNode>()
        expect($isListNode(list)).toBe(true)
        expect(list.getListType()).toBe('bullet')
      })

      testEditorState('should have suggestion', () => {
        const listItem = $getRoot().getFirstChildOrThrow<ListNode>().getFirstChildOrThrow<ListItemNode>()
        expect(listItem.getChildrenSize()).toBe(1)
        const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('paragraph')
      })
    })
  })

  describe('Handle empty list item', () => {
    describe('Actually empty', () => {
      beforeEach(() => {
        update(() => {
          const root = $getRoot()
          const list = $createListNode('bullet')
          const listItem = $createListItemNode()
          list.append(listItem)
          root.append(list)
          listItem.selectEnd()
          $insertListAsSuggestion(editor, 'number', onSuggestionCreation, logger, 'upper-alpha', 'period')
        })
      })

      testEditorState('should replace list', () => {
        const list = $getRoot().getFirstChildOrThrow<CustomListNode>()
        expect($isListNode(list)).toBe(true)
        expect(list.getListType()).toBe('number')
        expect(list.__listStyleType).toBe('upper-alpha')
        expect(list.__listMarker).toBe('period')
      })

      testEditorState('should add suggestion', () => {
        const listItem = $getRoot().getFirstChildOrThrow<CustomListNode>().getFirstChildOrThrow<ListItemNode>()
        expect(listItem.getChildrenSize()).toBe(1)
        const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        const props = suggestion.__properties.nodePropertiesChanged as BlockTypeChangeSuggestionProperties
        expect(props.initialBlockType).toBe('bullet')
      })
    })

    describe('Has empty suggestion(s)', () => {
      beforeEach(() => {
        update(() => {
          const root = $getRoot()
          const list = $createCustomListNode('number', undefined, 'upper-alpha', 'bracket')
          const listItem = $createListItemNode()
          listItem.append(
            $createSuggestionNode('test', 'indent-change', {
              indent: 1,
            }),
            $createSuggestionNode('test', 'align-change', {
              initialFormatType: 'left',
            }),
          )
          list.append(listItem)
          root.append(list)
          listItem.selectEnd()
          $insertListAsSuggestion(editor, 'bullet', onSuggestionCreation, logger)
        })
      })

      testEditorState('should replace list', () => {
        const list = $getRoot().getFirstChildOrThrow<CustomListNode>()
        expect($isListNode(list)).toBe(true)
        expect(list.getListType()).toBe('bullet')
        expect(list.__listStyleType).toBe(undefined)
        expect(list.__listMarker).toBe(undefined)
      })

      testEditorState('should add suggestion', () => {
        const listItem = $getRoot().getFirstChildOrThrow<CustomListNode>().getFirstChildOrThrow<ListItemNode>()
        expect(listItem.getChildrenSize()).toBe(3)
        const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        const props = suggestion.__properties.nodePropertiesChanged as BlockTypeChangeSuggestionProperties
        expect(props.initialBlockType).toBe('number')
        expect(props.listInfo?.listStyleType).toBe('upper-alpha')
        expect(props.listInfo?.listMarker).toBe('bracket')
      })
    })
  })

  describe('Empty elements', () => {
    beforeEach(() => {
      update(() => {
        const paragraph = $createParagraphNode()
        const heading = $createHeadingNode('h1')
        $getRoot().append(paragraph, heading)
        paragraph.selectEnd()
        $insertListAsSuggestion(editor, 'check', onSuggestionCreation, logger)
        heading.selectEnd()
        $insertListAsSuggestion(editor, 'number', onSuggestionCreation, logger)
      })
    })

    testEditorState('should change paragraph to check list', () => {
      const list = $getRoot().getChildAtIndex<ListNode>(0)!
      expect($isListNode(list)).toBe(true)
      expect(list.getListType()).toBe('check')
    })

    testEditorState('should have suggestion', () => {
      const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getFirstChildOrThrow<ListItemNode>()
      expect(listItem.getChildrenSize()).toBe(1)
      const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
      expect($isSuggestionNode(suggestion)).toBe(true)
      expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
      expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('paragraph')
    })

    testEditorState('should change heading to number list', () => {
      const list = $getRoot().getChildAtIndex<ListNode>(1)!
      expect($isListNode(list)).toBe(true)
      expect(list.getListType()).toBe('number')
    })

    testEditorState('should have suggestion', () => {
      const listItem = $getRoot().getChildAtIndex<ListNode>(1)!.getFirstChildOrThrow<ListItemNode>()
      expect(listItem.getChildrenSize()).toBe(1)
      const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
      expect($isSuggestionNode(suggestion)).toBe(true)
      expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
      expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('h1')
    })
  })

  describe('Selection including multiple elements', () => {
    describe('Part of paragraph to part of heading', () => {
      beforeEach(() => {
        update(() => {
          const paragraph = $createParagraphNode()
          const pText = $createTextNode('Hello')
          paragraph.append(pText)
          const heading = $createHeadingNode('h1')
          const hText = $createTextNode('World')
          heading.append(hText)
          $getRoot().append(paragraph, heading)
          const selection = $createRangeSelection()
          selection.anchor.set(pText.__key, 3, 'text')
          selection.focus.set(hText.__key, 3, 'text')
          $setSelection(selection)
          $insertListAsSuggestion(editor, 'number', onSuggestionCreation, logger)
        })
      })

      testEditorState('should have one list after changing both blocks', () => {
        const list = $getRoot().getChildAtIndex<ListNode>(0)!
        expect($isListNode(list)).toBe(true)
        expect(list.getListType()).toBe('number')
      })

      testEditorState('first item should be paragraph content', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(0)!
        const originalText = listItem.getChildAtIndex(1)!
        expect($isTextNode(originalText)).toBe(true)
        expect(originalText.getTextContent()).toBe('Hello')
      })

      testEditorState('first item should have paragraph suggestion', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(0)!
        const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('paragraph')
      })

      testEditorState('second item should be heading content', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(1)!
        const originalText = listItem.getChildAtIndex(1)!
        expect($isTextNode(originalText)).toBe(true)
        expect(originalText.getTextContent()).toBe('World')
      })

      testEditorState('second item should have heading suggestion', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(1)!
        const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('h1')
      })
    })

    describe('Paragraph + empty heading + paragraph', () => {
      beforeEach(() => {
        update(() => {
          const paragraph = $createParagraphNode()
          const pText = $createTextNode('Hello')
          paragraph.append(pText)
          const heading = $createHeadingNode('h1')
          const paragraph2 = $createParagraphNode()
          const pText2 = $createTextNode('World')
          paragraph2.append(pText2)
          $getRoot().append(paragraph, heading, paragraph2)
          const selection = $createRangeSelection()
          selection.anchor.set(pText.__key, 3, 'text')
          selection.focus.set(pText2.__key, 3, 'text')
          $setSelection(selection)
          $insertListAsSuggestion(editor, 'number', onSuggestionCreation, logger)
        })
      })

      testEditorState('should have one list after changing both blocks', () => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(1)
        const list = root.getChildAtIndex<ListNode>(0)!
        expect($isListNode(list)).toBe(true)
        expect(list.getListType()).toBe('number')
      })

      testEditorState('first item should be paragraph content', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(0)!
        const originalText = listItem.getChildAtIndex(1)!
        expect($isTextNode(originalText)).toBe(true)
        expect(originalText.getTextContent()).toBe('Hello')
      })

      testEditorState('first item should have paragraph suggestion', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(0)!
        const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('paragraph')
      })

      testEditorState('second item should only have heading suggestion', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(1)!
        expect(listItem.getChildrenSize()).toBe(1)
        const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('h1')
      })

      testEditorState('third item should be paragraph2 content', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(2)!
        const originalText = listItem.getChildAtIndex(1)!
        expect($isTextNode(originalText)).toBe(true)
        expect(originalText.getTextContent()).toBe('World')
      })

      testEditorState('third item should have paragraph suggestion', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(2)!
        const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('paragraph')
      })
    })

    describe('Paragraph + part of existing list', () => {
      beforeEach(() => {
        update(() => {
          const paragraph = $createParagraphNode()
          const pText = $createTextNode('Hello')
          paragraph.append(pText)
          const list = $createCustomListNode('number', undefined, 'upper-alpha', 'bracket')
          const listItem = $createListItemNode()
          const lText = $createTextNode('Foo')
          listItem.append(lText)
          list.append(listItem, $createListItemNode().append($createTextNode('Bar')))
          $getRoot().append(paragraph, list)
          const selection = $createRangeSelection()
          selection.anchor.set(pText.__key, 3, 'text')
          selection.focus.set(lText.__key, 3, 'text')
          $setSelection(selection)
          $insertListAsSuggestion(editor, 'bullet', onSuggestionCreation, logger)
        })
      })

      testEditorState('should have one list after changing both blocks', () => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(1)
        const list = root.getChildAtIndex<ListNode>(0)!
        expect($isListNode(list)).toBe(true)
        expect(list.getListType()).toBe('bullet')
      })

      testEditorState('first item should be paragraph content', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(0)!
        const originalText = listItem.getChildAtIndex(1)!
        expect($isTextNode(originalText)).toBe(true)
        expect(originalText.getTextContent()).toBe('Hello')
      })

      testEditorState('first item should have paragraph suggestion', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(0)!
        const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('paragraph')
      })

      testEditorState('second item should be listitem1 content', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(1)!
        const originalText = listItem.getChildAtIndex(1)!
        expect($isTextNode(originalText)).toBe(true)
        expect(originalText.getTextContent()).toBe('Foo')
      })

      testEditorState('second item should have custom list suggestion', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(1)!
        const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('number')
        const props = suggestion.__properties.nodePropertiesChanged as BlockTypeChangeSuggestionProperties
        expect(props.initialBlockType).toBe('number')
        expect(props.listInfo?.listStyleType).toBe('upper-alpha')
        expect(props.listInfo?.listMarker).toBe('bracket')
      })

      testEditorState('third item should be listitem2 content', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(2)!
        const originalText = listItem.getChildAtIndex(1)!
        expect($isTextNode(originalText)).toBe(true)
        expect(originalText.getTextContent()).toBe('Bar')
      })

      testEditorState('third item should have custom list suggestion', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex<ListItemNode>(2)!
        const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('number')
        const props = suggestion.__properties.nodePropertiesChanged as BlockTypeChangeSuggestionProperties
        expect(props.initialBlockType).toBe('number')
        expect(props.listInfo?.listStyleType).toBe('upper-alpha')
        expect(props.listInfo?.listMarker).toBe('bracket')
      })
    })

    describe('List with existing suggestion', () => {
      beforeEach(() => {
        update(() => {
          const list = $createCustomListNode('number', undefined, 'upper-alpha', 'bracket')
          const listItem = $createListItemNode().append(
            $createTextNode('Foo').toggleFormat('bold'),
            $createTextNode('Bar'),
          )
          const listItem2 = $createListItemNode().append(
            $createTextNode('Bar'),
            $createTextNode('Foo').toggleFormat('bold'),
          )
          list.append(listItem, listItem2)
          $getRoot().append(list)
          const selection = $createRangeSelection()
          selection.anchor.set(listItem.getFirstDescendant<TextNode>()!.__key, 0, 'text')
          selection.focus.set(listItem2.getLastDescendant<TextNode>()!.__key, 3, 'text')
          $setSelection(selection)
          $insertListAsSuggestion(editor, 'bullet', onSuggestionCreation, logger)
          $insertListAsSuggestion(editor, 'check', onSuggestionCreation, logger)
        })
      })

      testEditorState('should have one list after changing both blocks', () => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(1)
        const list = root.getChildAtIndex<ListNode>(0)!
        expect($isListNode(list)).toBe(true)
        expect(list.getListType()).toBe('check')
        expect(list.getChildrenSize()).toBe(2)
      })

      testEditorState('both items should have only 1 list suggestion', () => {
        const list = $getRoot().getChildAtIndex<ListNode>(0)!
        for (const listItem of list.getChildren()) {
          assertCondition($isListItemNode(listItem))
          const suggestions = listItem
            .getChildren()
            .filter((n) => $isSuggestionNode(n) && n.getSuggestionTypeOrThrow() === 'block-type-change')
          expect(suggestions.length).toBe(1)
          const suggestion = suggestions[0]
          assertCondition($isSuggestionNode(suggestion))
          expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
          const props = suggestion.getSuggestionChangedProperties<BlockTypeChangeSuggestionProperties>()
          expect(props!.initialBlockType).toBe('number')
          expect(props!.listInfo?.listStyleType).toBe('upper-alpha')
          expect(props!.listInfo?.listMarker).toBe('bracket')
        }
      })

      testEditorState('first item content should be correct', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex(0)
        assertCondition($isListItemNode(listItem))
        expect(listItem.getChildrenSize()).toBe(3)
        const first = listItem.getFirstChild()
        expect($isSuggestionNode(first)).toBe(true)
        const second = listItem.getChildAtIndex(1)
        assertCondition($isTextNode(second))
        expect(second.getTextContent()).toBe('Foo')
        expect(second.hasFormat('bold')).toBe(true)
        const third = listItem.getChildAtIndex(2)
        assertCondition($isTextNode(third))
        expect(third.getTextContent()).toBe('Bar')
        expect(third.hasFormat('bold')).toBe(false)
      })

      testEditorState('second item content should be correct', () => {
        const listItem = $getRoot().getChildAtIndex<ListNode>(0)!.getChildAtIndex(1)
        assertCondition($isListItemNode(listItem))
        expect(listItem.getChildrenSize()).toBe(3)
        const first = listItem.getFirstChild()
        expect($isSuggestionNode(first)).toBe(true)
        const second = listItem.getChildAtIndex(1)
        assertCondition($isTextNode(second))
        expect(second.getTextContent()).toBe('Bar')
        expect(second.hasFormat('bold')).toBe(false)
        const third = listItem.getChildAtIndex(2)
        assertCondition($isTextNode(third))
        expect(third.getTextContent()).toBe('Foo')
        expect(third.hasFormat('bold')).toBe(true)
      })
    })
  })
})
