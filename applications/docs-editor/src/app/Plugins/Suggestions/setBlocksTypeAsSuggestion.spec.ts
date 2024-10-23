import { createHeadlessEditor } from '@lexical/headless'
import type { Logger } from '@proton/utils/logs'
import { AllNodes } from '../../AllNodes'
import type { ElementNode } from 'lexical'
import { $isParagraphNode } from 'lexical'
import { $createParagraphNode, $createRangeSelection, $createTextNode, $getRoot, $setSelection } from 'lexical'
import { $setBlocksTypeAsSuggestion } from './setBlocksTypeAsSuggestion'
import type { HeadingNode } from '@lexical/rich-text'
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text'
import type { ProtonNode } from './ProtonNode'
import { $isSuggestionNode } from './ProtonNode'
import { $createListItemNode, $createListNode, $isListItemNode, $isListNode } from '@lexical/list'
import { blockTypeToCreateElementFn } from '../BlockTypePlugin'

const onSuggestionCreation = jest.fn()
const logger = {
  info: jest.fn(),
} as unknown as Logger

describe('$setBlocksTypeAsSuggestion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })

  beforeEach(() => {
    editor.update(
      () => {
        const root = $getRoot()
        root.clear()
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

  describe('Anchor node is root', () => {
    describe('Root is empty', () => {
      beforeEach(() => {
        editor.update(
          () => {
            $getRoot().selectEnd()
            $setBlocksTypeAsSuggestion('h1', onSuggestionCreation, logger)
          },
          { discrete: true },
        )
      })

      testEditorState('First child should be of new block type', () => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(1)
        expect($isHeadingNode(root.getFirstChildOrThrow())).toBe(true)
      })

      testEditorState('First child should have correct suggestion', () => {
        const suggestion = $getRoot().getFirstChildOrThrow<HeadingNode>().getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('paragraph')
      })
    })

    describe('Root has existing child', () => {
      beforeEach(() => {
        editor.update(
          () => {
            const root = $getRoot()
            const paragraph = $createParagraphNode()
            root.append(paragraph)
            paragraph.selectEnd()
            $setBlocksTypeAsSuggestion('h1', onSuggestionCreation, logger)
          },
          { discrete: true },
        )
      })

      testEditorState('First child should be replaced with new block type', () => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(1)
        expect($isHeadingNode(root.getFirstChildOrThrow())).toBe(true)
      })

      testEditorState('First child should have correct suggestion', () => {
        const suggestion = $getRoot().getFirstChildOrThrow<HeadingNode>().getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('paragraph')
      })
    })
  })

  describe('Selection including non-changeable blocks', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const paragraph = $createParagraphNode().append($createTextNode('p'))
          const list = $createListNode('number').append($createListItemNode().append($createTextNode('li')))
          const h1 = $createHeadingNode('h1').append($createTextNode('h1'))
          $getRoot().append(paragraph, list, h1)
          const selection = $createRangeSelection()
          selection.anchor.set(paragraph.getFirstChildOrThrow().__key, 0, 'text')
          selection.focus.set(h1.getFirstChildOrThrow().__key, 2, 'text')
          $setSelection(selection)
          $setBlocksTypeAsSuggestion('h2', onSuggestionCreation, logger)
        },
        { discrete: true },
      )
    })

    testEditorState('first block should be changed to h2', () => {
      const firstBlock = $getRoot().getChildAtIndex<ElementNode>(0)!
      expect($isHeadingNode(firstBlock)).toBe(true)
      expect((firstBlock as HeadingNode).getTag()).toBe('h2')
    })

    testEditorState('first block should have correct suggestion', () => {
      const firstBlock = $getRoot().getChildAtIndex<ElementNode>(0)!
      const suggestion = firstBlock.getFirstChildOrThrow<ProtonNode>()
      expect($isSuggestionNode(suggestion)).toBe(true)
      expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
      expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('paragraph')
    })

    testEditorState('second block should be left as-is', () => {
      const secondBlock = $getRoot().getChildAtIndex<ElementNode>(1)!
      expect($isListNode(secondBlock)).toBe(true)
      expect($isListItemNode(secondBlock.getFirstChildOrThrow())).toBe(true)
    })

    testEditorState('third block should be changed to h2', () => {
      const thirdBlock = $getRoot().getChildAtIndex<ElementNode>(2)!
      expect($isHeadingNode(thirdBlock)).toBe(true)
      expect((thirdBlock as HeadingNode).getTag()).toBe('h2')
    })

    testEditorState('third block should have correct suggestion', () => {
      const thirdBlock = $getRoot().getChildAtIndex<ElementNode>(2)!
      const suggestion = thirdBlock.getFirstChildOrThrow<ProtonNode>()
      expect($isSuggestionNode(suggestion)).toBe(true)
      expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
      expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('h1')
    })
  })

  describe('Selection including all changeable blocks', () => {
    const allChangeableTypes = Object.entries(blockTypeToCreateElementFn)

    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          for (const [blockType, createElement] of allChangeableTypes) {
            const element = createElement()
            element.append($createTextNode(blockType))
            root.append(element)
          }
          const selection = $createRangeSelection()
          const firstText = root.getFirstChildOrThrow<ElementNode>().getFirstChildOrThrow()
          selection.anchor.set(firstText.__key, 0, 'text')
          const lastText = root.getLastChildOrThrow<ElementNode>().getFirstChildOrThrow()
          selection.focus.set(lastText.__key, lastText.getTextContentSize(), 'text')
          $setSelection(selection)
          $setBlocksTypeAsSuggestion('h2', onSuggestionCreation, logger)
        },
        { discrete: true },
      )
    })

    testEditorState('all blocks should be changed to h2', () => {
      for (const element of $getRoot().getChildren<HeadingNode>()) {
        expect($isHeadingNode(element)).toBe(true)
        expect(element.getTag()).toBe('h2')
      }
    })

    testEditorState('blocks should have correct suggestion', () => {
      const rootChildren = $getRoot().getChildren<HeadingNode>()
      for (let index = 0; index < rootChildren.length; index++) {
        const element = rootChildren[index]
        const originalBlockType = allChangeableTypes[index][0]
        if (!element || !originalBlockType) {
          throw new Error('No element found at index')
        }
        const suggestion = element.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
        expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe(originalBlockType)
      }
    })
  })

  describe('Reset block type', () => {
    beforeEach(() => {
      editor.update(() => {
        const root = $getRoot()
        root.append($createParagraphNode())
        root.selectEnd()
      })
    })

    test('should insert and then remove suggestion', () => {
      editor.update(
        () => {
          const root = $getRoot()

          $setBlocksTypeAsSuggestion('h2', onSuggestionCreation, logger)
          let firstChild = root.getFirstChild<ElementNode>()
          expect($isHeadingNode(firstChild)).toBe(true)
          expect($isSuggestionNode(firstChild?.getFirstChild())).toBe(true)
          expect(firstChild?.getFirstChild<ProtonNode>()?.__properties.nodePropertiesChanged!.initialBlockType).toBe(
            'paragraph',
          )

          $setBlocksTypeAsSuggestion('paragraph', onSuggestionCreation, logger)
          firstChild = root.getFirstChild<ElementNode>()
          expect($isParagraphNode(firstChild)).toBe(true)
          expect($isSuggestionNode(firstChild?.getFirstChild())).toBe(false)
        },
        { discrete: true },
      )
    })
  })
})
