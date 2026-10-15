import type { ElementNode } from 'lexical'
import {
  createEditor,
  $createParagraphNode,
  $createLineBreakNode,
  $createTextNode,
  $getRoot,
  $nodesOfType,
  COMMAND_PRIORITY_CRITICAL,
} from 'lexical'
import { AllNodes } from '../../AllNodes'
import { BEFOREINPUT_EVENT_COMMAND } from '../../Commands/Events'
import { $handleBeforeInputEvent } from '../Suggestions/handleBeforeInputEvent'
import { $createSuggestionNode, ProtonNode } from '../Suggestions/ProtonNode'
import { $acceptSuggestion } from '../Suggestions/acceptSuggestion'
import { $rejectSuggestion } from '../Suggestions/rejectSuggestion'
import { insertEmoji } from './insertEmoji'
import type { DocsLogger } from '../../contract/DocsLogger'

// JSDOM omits InputEvent.dataTransfer, which is null for native text input.
Object.defineProperty(InputEvent.prototype, 'dataTransfer', { configurable: true, get: () => null })

const logger: DocsLogger = { info: () => {}, warn: () => {}, error: () => {} }

function makeEditor(suggesting = false) {
  const editor = createEditor({
    nodes: AllNodes,
    onError: (error) => {
      throw error
    },
  })
  if (suggesting) {
    editor.registerCommand(
      BEFOREINPUT_EVENT_COMMAND,
      (event) => $handleBeforeInputEvent(editor, event, () => {}, logger),
      COMMAND_PRIORITY_CRITICAL,
    )
  }
  editor.update(
    () => {
      $getRoot().append($createParagraphNode()).selectEnd()
    },
    { discrete: true },
  )
  return editor
}

test('inserts plain Unicode into the current selection', () => {
  const editor = makeEditor()
  insertEmoji(editor, '🍝')
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe('🍝'))
})

test.each(['accept', 'reject'] as const)('an inserted emoji suggestion can be %sed', (action) => {
  const editor = makeEditor(true)
  insertEmoji(editor, '🍝')
  editor.update(
    () => {
      const suggestions = $nodesOfType(ProtonNode)
      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].getTextContent()).toBe('🍝')
      const id = suggestions[0].getSuggestionIdOrThrow()
      if (action === 'accept') {
        $acceptSuggestion(id)
      } else {
        $rejectSuggestion(id)
      }
    },
    { discrete: true },
  )
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe(action === 'accept' ? '🍝' : ''))
})

test('replacing a shortcode inside an insert suggestion preserves its tracking', () => {
  const editor = makeEditor(true)
  editor.update(
    () => {
      const text = $createTextNode(':spaghetti:')
      $getRoot().getFirstChildOrThrow<ElementNode>().append($createSuggestionNode('pending', 'insert').append(text))
      text.select(0, 11)
    },
    { discrete: true },
  )
  insertEmoji(editor, '🍝')
  editor.getEditorState().read(() => {
    expect($nodesOfType(ProtonNode).map((node) => node.getTextContent())).toEqual(['🍝'])
  })
})

test.each(['accept', 'reject'] as const)('replacing existing document text is tracked and can be %sed', (action) => {
  const editor = makeEditor(true)
  editor.update(
    () => {
      const text = $createTextNode(':spaghetti')
      $getRoot().clear().append($createParagraphNode().append(text))
      text.select(0, 10)
    },
    { discrete: true },
  )
  insertEmoji(editor, '🍝')
  editor.update(
    () => {
      const suggestions = $nodesOfType(ProtonNode)
      expect(suggestions.map((node) => node.getSuggestionTypeOrThrow())).toEqual(['delete', 'insert'])
      const id = suggestions[0].getSuggestionIdOrThrow()
      if (action === 'accept') {
        $acceptSuggestion(id)
      } else {
        $rejectSuggestion(id)
      }
    },
    { discrete: true },
  )
  editor
    .getEditorState()
    .read(() => expect($getRoot().getTextContent()).toBe(action === 'accept' ? '🍝' : ':spaghetti'))
})

test.each(['accept', 'reject'] as const)(
  'a formatted shortcode inside a pending insertion retains its tracking and can be %sed',
  (action) => {
    const editor = makeEditor(true)
    editor.update(
      () => {
        const first = $createTextNode(':spa').toggleFormat('bold')
        const last = $createTextNode('ghetti:')
        $getRoot()
          .clear()
          .append($createParagraphNode().append($createSuggestionNode('pending', 'insert').append(first, last)))
        const selection = first.select(0, 0)
        selection.focus.set(last.getKey(), last.getTextContentSize(), 'text')
      },
      { discrete: true },
    )
    insertEmoji(editor, '🍝')
    editor.update(
      () => {
        expect($nodesOfType(ProtonNode).map((node) => node.getTextContent())).toEqual(['🍝'])
        if (action === 'accept') {
          $acceptSuggestion('pending')
        } else {
          $rejectSuggestion('pending')
        }
      },
      { discrete: true },
    )
    editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe(action === 'accept' ? '🍝' : ''))
  },
)

test('picker replacement removes a selected soft line break within an insertion suggestion', () => {
  const editor = makeEditor(true)
  editor.update(
    () => {
      const first = $createTextNode('foo')
      const last = $createTextNode('bar tail')
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append(
            $createSuggestionNode('pending', 'insert').append(first, $createLineBreakNode(), last),
          ),
        )
      const selection = first.select(0, 0)
      selection.focus.set(last.getKey(), 3, 'text')
    },
    { discrete: true },
  )
  insertEmoji(editor, '🍝')
  editor.getEditorState().read(() => {
    expect($nodesOfType(ProtonNode).map((node) => node.getTextContent())).toEqual(['🍝 tail'])
  })
})
