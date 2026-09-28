import { createHeadlessEditor } from '@lexical/headless'
import type { NodeKey } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot, $nodesOfType } from 'lexical'
import { AllNodes } from '../../AllNodes'
import { $createSuggestionNode, $isSuggestionNode, ProtonNode } from './ProtonNode'
import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import type { SuggestionSummaryContent } from './generateSuggestionSummary'
import { generateSuggestionSummary } from './generateSuggestionSummary'
import type { MarkNodeMap } from '../MarkNodesContext'
import { $createImageNode } from '../Image/ImageNode'
import type {
  AlignChangeSuggestionProperties,
  BlockTypeChangeSuggestionProperties,
  LinkChangeSuggestionProperties,
  PropertyChangeSuggestionProperties,
} from './Types'
import { $createLinkNode } from '@lexical/link'
import { blockTypeToBlockName } from '../BlockTypePlugin'

describe('generateSuggestionSummary', () => {
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

  const suggestionID = 'SuggestionID'

  function generateSuggestionMap() {
    return editor.read(() => {
      const map = new Map<string, Set<NodeKey>>()
      const suggestionNodes = $nodesOfType(ProtonNode)
      for (const node of suggestionNodes) {
        if (!$isSuggestionNode(node)) {
          continue
        }
        const nodeKey = node.__key
        const suggestionID = node.getSuggestionIdOrThrow()
        const nodeKeysForSuggestion = map.get(suggestionID)
        if (nodeKeysForSuggestion) {
          nodeKeysForSuggestion.add(nodeKey)
        } else {
          map.set(suggestionID, new Set([nodeKey]))
        }
      }
      return map
    })
  }

  describe('Single-child suggestion', () => {
    describe('Insert divider', () => {
      let map!: MarkNodeMap
      let summary!: SuggestionSummaryContent

      beforeEach(() => {
        update(() => {
          $getRoot().append($createSuggestionNode(suggestionID, 'insert').append($createHorizontalRuleNode()))
        })
        map = generateSuggestionMap()
        summary = generateSuggestionSummary(editor, map, suggestionID)
      })

      test('should have 1 item', () => {
        expect(summary.length).toBe(1)
      })

      test('should be insert-divider', () => {
        const item = summary[0]
        expect(item.type).toBe('insert-divider')
        expect(item.content).toBe('')
        expect(item.replaceWith).toBe(undefined)
      })
    })

    describe('Delete divider', () => {
      let map!: MarkNodeMap
      let summary!: SuggestionSummaryContent

      beforeEach(() => {
        update(() => {
          $getRoot().append($createSuggestionNode(suggestionID, 'delete').append($createHorizontalRuleNode()))
        })
        map = generateSuggestionMap()
        summary = generateSuggestionSummary(editor, map, suggestionID)
      })

      test('should have 1 item', () => {
        expect(summary.length).toBe(1)
      })

      test('should be delete-divider', () => {
        const item = summary[0]
        expect(item.type).toBe('delete-divider')
        expect(item.content).toBe('')
        expect(item.replaceWith).toBe(undefined)
      })
    })

    describe('Insert image', () => {
      let map!: MarkNodeMap
      let summary!: SuggestionSummaryContent

      beforeEach(() => {
        update(() => {
          $getRoot().append(
            $createSuggestionNode(suggestionID, 'insert').append(
              $createImageNode({
                src: '',
                altText: '',
              }),
            ),
          )
        })
        map = generateSuggestionMap()
        summary = generateSuggestionSummary(editor, map, suggestionID)
      })

      test('should have 1 item', () => {
        expect(summary.length).toBe(1)
      })

      test('should be insert-image', () => {
        const item = summary[0]
        expect(item.type).toBe('insert-image')
        expect(item.content).toBe('')
        expect(item.replaceWith).toBe(undefined)
      })
    })

    describe('Delete image', () => {
      let map!: MarkNodeMap
      let summary!: SuggestionSummaryContent

      beforeEach(() => {
        update(() => {
          $getRoot().append(
            $createSuggestionNode(suggestionID, 'delete').append($createImageNode({ src: '', altText: '' })),
          )
        })
        map = generateSuggestionMap()
        summary = generateSuggestionSummary(editor, map, suggestionID)
      })

      test('should have 1 item', () => {
        expect(summary.length).toBe(1)
      })

      test('should be delete-image', () => {
        const item = summary[0]
        expect(item.type).toBe('delete-image')
        expect(item.content).toBe('')
        expect(item.replaceWith).toBe(undefined)
      })
    })

    describe('Normal insertion', () => {
      let map!: MarkNodeMap
      let summary!: SuggestionSummaryContent

      beforeEach(() => {
        update(() => {
          $getRoot().append($createSuggestionNode(suggestionID, 'insert').append($createTextNode('Insert')))
        })
        map = generateSuggestionMap()
        summary = generateSuggestionSummary(editor, map, suggestionID)
      })

      test('should have 1 item', () => {
        expect(summary.length).toBe(1)
      })

      test('should be insert with content', () => {
        const item = summary[0]
        expect(item.type).toBe('insert')
        expect(item.content).toBe('Insert')
        expect(item.replaceWith).toBe(undefined)
      })
    })
  })

  describe('Text format change suggestion', () => {
    describe('Text without existing format', () => {
      let map!: MarkNodeMap
      let summary!: SuggestionSummaryContent

      beforeEach(() => {
        update(() => {
          const text = $createTextNode('Text')
          const currentFormatFlag = text.getFormat()
          const suggestion = $createSuggestionNode(suggestionID, 'property-change', {
            __format: currentFormatFlag,
          } satisfies PropertyChangeSuggestionProperties)
          suggestion.append(text)
          text.toggleFormat('italic')
          text.toggleFormat('underline')
          $getRoot().append(suggestion)
        })
        map = generateSuggestionMap()
        summary = generateSuggestionSummary(editor, map, suggestionID)
      })

      test('should have 1 item', () => {
        expect(summary.length).toBe(1)
      })

      test('should be property-change', () => {
        const item = summary[0]
        expect(item.type).toBe('property-change')
        expect(item.replaceWith).toBe(undefined)
      })

      test('content should have changed formats', () => {
        const item = summary[0]
        expect(item.content).toBe('Italic, Underline')
      })
    })

    describe('Text with existing formats', () => {
      let map!: MarkNodeMap
      let summary!: SuggestionSummaryContent

      beforeEach(() => {
        update(() => {
          const text = $createTextNode('Text').toggleFormat('bold').toggleFormat('italic')
          const currentFormatFlag = text.getFormat()
          const suggestion = $createSuggestionNode(suggestionID, 'property-change', {
            __format: currentFormatFlag,
          } satisfies PropertyChangeSuggestionProperties)
          suggestion.append(text)
          text.toggleFormat('underline')
          text.toggleFormat('strikethrough')
          $getRoot().append(suggestion)
        })
        map = generateSuggestionMap()
        summary = generateSuggestionSummary(editor, map, suggestionID)
      })

      test('should have 1 item', () => {
        expect(summary.length).toBe(1)
      })

      test('should be property-change', () => {
        const item = summary[0]
        expect(item.type).toBe('property-change')
        expect(item.replaceWith).toBe(undefined)
      })

      test('content should only have changed formats', () => {
        const item = summary[0]
        expect(item.content).toBe('Strikethrough, Underline')
      })
    })
  })

  describe('Link change suggestion', () => {
    describe('Delete link', () => {
      let map!: MarkNodeMap
      let summary!: SuggestionSummaryContent

      beforeEach(() => {
        update(() => {
          $getRoot().append(
            $createSuggestionNode(suggestionID, 'link-change', {
              __url: 'link',
            } satisfies LinkChangeSuggestionProperties).append($createTextNode('Text')),
          )
        })
        map = generateSuggestionMap()
        summary = generateSuggestionSummary(editor, map, suggestionID)
      })

      test('should have 1 item', () => {
        expect(summary.length).toBe(1)
      })

      test('should be delete-link', () => {
        const item = summary[0]
        expect(item.type).toBe('delete-link')
        expect(item.replaceWith).toBe(undefined)
      })

      test('content should be initial url', () => {
        const item = summary[0]
        expect(item.content).toBe('link')
      })
    })

    describe('Add link', () => {
      let map!: MarkNodeMap
      let summary!: SuggestionSummaryContent

      beforeEach(() => {
        update(() => {
          $getRoot().append(
            $createSuggestionNode(suggestionID, 'link-change', {
              __url: null,
            } satisfies LinkChangeSuggestionProperties).append($createLinkNode('link').append($createTextNode('Text'))),
          )
        })
        map = generateSuggestionMap()
        summary = generateSuggestionSummary(editor, map, suggestionID)
      })

      test('should have 1 item', () => {
        expect(summary.length).toBe(1)
      })

      test('should be add-link', () => {
        const item = summary[0]
        expect(item.type).toBe('add-link')
        expect(item.replaceWith).toBe(undefined)
      })

      test('content should be new url', () => {
        const item = summary[0]
        expect(item.content).toBe('link')
      })
    })

    describe('Change link', () => {
      let map!: MarkNodeMap
      let summary!: SuggestionSummaryContent

      beforeEach(() => {
        update(() => {
          $getRoot().append(
            $createSuggestionNode(suggestionID, 'link-change', {
              __url: 'initial',
            } satisfies LinkChangeSuggestionProperties).append($createLinkNode('new').append($createTextNode('Text'))),
          )
        })
        map = generateSuggestionMap()
        summary = generateSuggestionSummary(editor, map, suggestionID)
      })

      test('should have 1 item', () => {
        expect(summary.length).toBe(1)
      })

      test('should be link-change', () => {
        const item = summary[0]
        expect(item.type).toBe('link-change')
      })

      test('content should be initial url', () => {
        const item = summary[0]
        expect(item.content).toBe('initial')
      })

      test('replaceWith should be new url', () => {
        const item = summary[0]
        expect(item.replaceWith).toBe('new')
      })
    })
  })

  describe('Style change suggestion', () => {
    let map!: MarkNodeMap
    let summary!: SuggestionSummaryContent

    beforeEach(() => {
      update(() => {
        $getRoot().append(
          $createSuggestionNode(suggestionID, 'style-change', {
            'font-size': '12px',
            color: '#fff',
          }).append($createTextNode('Text')),
        )
      })
      map = generateSuggestionMap()
      summary = generateSuggestionSummary(editor, map, suggestionID)
    })

    test('should have 1 item', () => {
      expect(summary.length).toBe(1)
    })

    test('should be style-change', () => {
      const item = summary[0]
      expect(item.type).toBe('style-change')
      expect(item.replaceWith).toBe(undefined)
    })

    test('content should be changed properties', () => {
      const item = summary[0]
      expect(item.content).toBe('font-size,color')
    })
  })

  describe('Block type change suggestion', () => {
    let map!: MarkNodeMap
    let summary!: SuggestionSummaryContent

    beforeEach(() => {
      update(() => {
        $getRoot().append(
          $createParagraphNode().append(
            $createSuggestionNode(suggestionID, 'block-type-change', {
              initialBlockType: 'h3',
            } satisfies BlockTypeChangeSuggestionProperties).append($createTextNode('Text')),
          ),
        )
      })
      map = generateSuggestionMap()
      summary = generateSuggestionSummary(editor, map, suggestionID)
    })

    test('should have 1 item', () => {
      expect(summary.length).toBe(1)
    })

    test('should be block-type-change', () => {
      const item = summary[0]
      expect(item.type).toBe('block-type-change')
      expect(item.replaceWith).toBe(undefined)
    })

    test('content should be current block type', () => {
      const item = summary[0]
      expect(item.content).toBe(blockTypeToBlockName.paragraph)
    })
  })

  describe('Clear formatting suggestion', () => {
    let map!: MarkNodeMap
    let summary!: SuggestionSummaryContent

    beforeEach(() => {
      update(() => {
        $getRoot().append(
          $createParagraphNode().append(
            $createSuggestionNode(suggestionID, 'clear-formatting').append($createTextNode('Text')),
          ),
        )
      })
      map = generateSuggestionMap()
      summary = generateSuggestionSummary(editor, map, suggestionID)
    })

    test('should have 1 item', () => {
      expect(summary.length).toBe(1)
    })

    test('should be clear-formatting', () => {
      const item = summary[0]
      expect(item.type).toBe('clear-formatting')
      expect(item.replaceWith).toBe(undefined)
    })

    test('content should be empty', () => {
      const item = summary[0]
      expect(item.content).toBe('')
    })
  })

  describe('Alignment change suggestion', () => {
    let map!: MarkNodeMap
    let summary!: SuggestionSummaryContent

    beforeEach(() => {
      update(() => {
        $getRoot().append(
          $createParagraphNode()
            .append(
              $createSuggestionNode(suggestionID, 'align-change', {
                initialFormatType: 'left',
              } satisfies AlignChangeSuggestionProperties).append($createTextNode('Text')),
            )
            .setFormat('right'),
        )
      })
      map = generateSuggestionMap()
      summary = generateSuggestionSummary(editor, map, suggestionID)
    })

    test('should have 1 item', () => {
      expect(summary.length).toBe(1)
    })

    test('should be align-change', () => {
      const item = summary[0]
      expect(item.type).toBe('align-change')
      expect(item.replaceWith).toBe(undefined)
    })

    test('content should be current alignment capitalized', () => {
      const item = summary[0]
      expect(item.content).toBe('Right')
    })
  })

  describe('Multi-node suggestions', () => {
    describe('Should prioritize insert type over others', () => {
      beforeEach(() => {
        update(() => {
          $getRoot().append(
            $createParagraphNode()
              .append(
                $createSuggestionNode('1', 'insert').append($createTextNode('Insert')),
                $createSuggestionNode('1', 'property-change').append($createTextNode('Format')),
                $createSuggestionNode('2', 'property-change').append($createTextNode('Format')),
                $createSuggestionNode('2', 'insert').append($createTextNode('Insert')),
              )
              .setFormat('right'),
          )
        })
      })

      describe('Low-priority after high-priority', () => {
        let map!: MarkNodeMap
        let summary!: SuggestionSummaryContent

        beforeEach(() => {
          map = generateSuggestionMap()
          summary = generateSuggestionSummary(editor, map, '1')
        })

        test('should have 1 item', () => {
          expect(summary.length).toBe(1)
        })

        test('should be insert', () => {
          const item = summary[0]
          expect(item.type).toBe('insert')
          expect(item.replaceWith).toBe(undefined)
        })

        test('content should be text inside insert node', () => {
          const item = summary[0]
          expect(item.content).toBe('Insert')
        })
      })

      describe('High-priority after low-priority', () => {
        let map!: MarkNodeMap
        let summary!: SuggestionSummaryContent

        beforeEach(() => {
          map = generateSuggestionMap()
          summary = generateSuggestionSummary(editor, map, '2')
        })

        test('should have 1 item', () => {
          expect(summary.length).toBe(1)
        })

        test('should be insert', () => {
          const item = summary[0]
          expect(item.type).toBe('insert')
          expect(item.replaceWith).toBe(undefined)
        })

        test('content should be text inside insert node', () => {
          const item = summary[0]
          expect(item.content).toBe('Insert')
        })
      })
    })

    describe('Multiple items of same type', () => {
      describe('Same content', () => {
        let map!: MarkNodeMap
        let summary!: SuggestionSummaryContent

        beforeEach(() => {
          update(() => {
            $getRoot().append(
              $createParagraphNode()
                .append(
                  $createSuggestionNode(suggestionID, 'insert').append($createTextNode('Insert')),
                  $createSuggestionNode(suggestionID, 'insert').append($createTextNode('Insert')),
                )
                .setFormat('right'),
            )
          })
          map = generateSuggestionMap()
          summary = generateSuggestionSummary(editor, map, suggestionID)
        })

        test('should not create multiple items', () => {
          expect(summary.length).toBe(1)
        })

        test('should be insert with content', () => {
          const item = summary[0]
          expect(item.type).toBe('insert')
          expect(item.content).toBe('Insert')
          expect(item.replaceWith).toBe(undefined)
        })
      })

      describe('Different content', () => {
        let map!: MarkNodeMap
        let summary!: SuggestionSummaryContent

        const firstText = new Array(40).fill('a').join('')
        const secondText = new Array(45).fill('b').join('')

        beforeEach(() => {
          update(() => {
            $getRoot().append(
              $createParagraphNode()
                .append(
                  $createSuggestionNode(suggestionID, 'insert').append($createTextNode(firstText)),
                  $createSuggestionNode(suggestionID, 'insert').append($createTextNode(secondText)),
                )
                .setFormat('right'),
            )
          })
          map = generateSuggestionMap()
          summary = generateSuggestionSummary(editor, map, suggestionID)
        })

        test('should not create multiple items', () => {
          expect(summary.length).toBe(1)
        })

        test('content should be combined and limited to 80 chars', () => {
          const item = summary[0]
          expect(item.type).toBe('insert')
          expect(item.content.length).toBe(80)
          expect(item.replaceWith).toBe(undefined)
        })
      })
    })

    describe('"Replace" suggestion', () => {
      describe('insert + delete', () => {
        let map!: MarkNodeMap
        let summary!: SuggestionSummaryContent

        beforeEach(() => {
          update(() => {
            $getRoot().append(
              $createParagraphNode()
                .append(
                  $createSuggestionNode(suggestionID, 'insert').append($createTextNode('Insert')),
                  $createSuggestionNode(suggestionID, 'delete').append($createTextNode('Delete')),
                )
                .setFormat('right'),
            )
          })
          map = generateSuggestionMap()
          summary = generateSuggestionSummary(editor, map, suggestionID)
        })

        test('should only be 1 item', () => {
          expect(summary.length).toBe(1)
        })

        test('should be replace', () => {
          const item = summary[0]
          expect(item.type).toBe('replace')
        })

        test('content should be from delete', () => {
          const item = summary[0]
          expect(item.content).toBe('Delete')
        })

        test('replaceWith should be from insert', () => {
          const item = summary[0]
          expect(item.replaceWith).toBe('Insert')
        })
      })

      describe('delete + insert', () => {
        let map!: MarkNodeMap
        let summary!: SuggestionSummaryContent

        beforeEach(() => {
          update(() => {
            $getRoot().append(
              $createParagraphNode()
                .append(
                  $createSuggestionNode(suggestionID, 'delete').append($createTextNode('Delete')),
                  $createSuggestionNode(suggestionID, 'insert').append($createTextNode('Insert')),
                )
                .setFormat('right'),
            )
          })
          map = generateSuggestionMap()
          summary = generateSuggestionSummary(editor, map, suggestionID)
        })

        test('should only be 1 item', () => {
          expect(summary.length).toBe(1)
        })

        test('should be replace', () => {
          const item = summary[0]
          expect(item.type).toBe('replace')
        })

        test('content should be from delete', () => {
          const item = summary[0]
          expect(item.content).toBe('Delete')
        })

        test('replaceWith should be from insert', () => {
          const item = summary[0]
          expect(item.replaceWith).toBe('Insert')
        })
      })
    })
  })
})
