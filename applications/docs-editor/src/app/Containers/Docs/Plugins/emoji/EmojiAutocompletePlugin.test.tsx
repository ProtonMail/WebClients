import { $createCodeNode, $createCodeHighlightNode } from '@lexical/code'
import { $createLinkNode } from '@lexical/link'
import { render, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  PASTE_TAG,
  type LexicalEditor,
} from 'lexical'
import { act } from 'react'
import EmojiAutocomplete from './EmojiAutocompletePlugin'
import { AllNodes } from '../../AllNodes'
import { DocsDependenciesProvider, type DocsDependencies } from '../../DocsDependenciesProvider'
import { defaultDocsMessages } from '../../messages/defaultDocsMessages'
import { $handleBeforeInputEvent } from '../Suggestions/handleBeforeInputEvent'

import { polyfillSelectionRelatedThingsForTests } from '../Suggestions/TestUtils'

polyfillSelectionRelatedThingsForTests()

let editor: LexicalEditor
function CaptureEditor() {
  ;[editor] = useLexicalComposerContext()
  return null
}
function mount() {
  render(
    <DocsDependenciesProvider dependencies={{ defaultMessages: defaultDocsMessages } as DocsDependencies}>
      <LexicalComposer
        initialConfig={{
          namespace: 'emoji-test',
          nodes: AllNodes,
          onError: (error) => {
            throw error
          },
        }}
      >
        <RichTextPlugin
          contentEditable={<ContentEditable aria-label="Document" />}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <CaptureEditor />
        <EmojiAutocomplete />
      </LexicalComposer>
    </DocsDependenciesProvider>,
  )
}
async function type(text: string) {
  await act(async () => {
    editor.update(
      () => {
        const node = $createTextNode(text)
        $getRoot().clear().append($createParagraphNode().append(node))
        node.selectEnd()
      },
      { discrete: true },
    )
  })
}
async function append(text: string, tag?: string) {
  await act(async () => {
    editor.update(
      () => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          throw new Error('Expected a document selection')
        }
        selection.insertText(text)
      },
      { discrete: true, tag },
    )
  })
}
afterEach(cleanup)

test('typing :spa offers spaghetti and Enter replaces the shortcode', async () => {
  mount()
  await type(':spa')
  await waitFor(() => expect(document.querySelector('[role="option"][aria-label="Spaghetti"]')).toBeTruthy())
  const index = [...document.querySelectorAll('[role="option"]')].findIndex(
    (option) => option.getAttribute('aria-label') === 'Spaghetti',
  )
  const root = editor.getRootElement()!
  for (let step = 0; step < index; step++) {
    await act(async () => {
      fireEvent.keyDown(root, { key: 'ArrowDown' })
    })
  }
  await act(async () => {
    fireEvent.keyDown(editor.getRootElement()!, { key: 'Enter' })
  })
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe('🍝'))
})

test.each(['10:30', 'http://example.com', 'hello:spa', ':zzzzzzzzz'])(
  'leaves %s as text with no menu',
  async (text) => {
    mount()
    await type(text)
    expect(document.querySelector('[role="listbox"]')).toBeNull()
    editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe(text))
  },
)

test('Escape dismisses autocomplete and keeps the typed shortcode', async () => {
  mount()
  await type(':spaghetti')
  await waitFor(() => expect(document.querySelector('[role="listbox"]')).toBeTruthy())
  await act(async () => {
    fireEvent.keyDown(editor.getRootElement()!, { key: 'Escape' })
  })
  expect(document.querySelector('[role="listbox"]')).toBeNull()
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe(':spaghetti'))
})

test('Tab inserts and closes autocomplete', async () => {
  mount()
  await type(':spaghetti')
  await waitFor(() => expect(document.querySelector('[role="listbox"]')).toBeTruthy())
  await act(async () => {
    fireEvent.keyDown(editor.getRootElement()!, { key: 'Tab' })
  })
  await waitFor(() => expect(document.querySelector('[role="listbox"]')).toBeNull())
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe('🍝'))
})

test('typing an exact shortcode with the closing colon converts immediately', async () => {
  mount()
  await type(':spaghetti')
  await append(':')
  await waitFor(() => editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe('🍝')))
})

test('undo/history updates do not convert existing shortcodes', async () => {
  mount()
  await act(async () => {
    editor.update(
      () => {
        const node = $createTextNode(':spaghetti:')
        $getRoot().clear().append($createParagraphNode().append(node))
        node.selectEnd()
      },
      { discrete: true, tag: 'historic' },
    )
  })
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe(':spaghetti:'))
})

test('an inline link does not turn a colon after a word into a word-start trigger', async () => {
  mount()
  await act(async () => {
    editor.update(
      () => {
        const text = $createTextNode(':spa')
        $getRoot()
          .clear()
          .append(
            $createParagraphNode().append(
              $createTextNode('hello'),
              $createLinkNode('https://example.com').append(text),
            ),
          )
        text.selectEnd()
      },
      { discrete: true },
    )
  })
  expect(document.querySelector('[role="listbox"]')).toBeNull()
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe('hello:spa'))
})

test('a shortcode split by inline formatting still converts on its closing colon', async () => {
  mount()
  await act(async () => {
    editor.update(
      () => {
        const end = $createTextNode('ghetti')
        $getRoot()
          .clear()
          .append($createParagraphNode().append($createTextNode(':spa').toggleFormat('bold'), end))
        end.selectEnd()
      },
      { discrete: true },
    )
  })
  await append(':')
  await waitFor(() => editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe('🍝')))
})

test.each(['foo(:sym', ':ok:'])('code blocks keep %s as code without autocomplete or conversion', async (text) => {
  mount()
  await act(async () => {
    editor.update(
      () => {
        const code = $createCodeHighlightNode(text.endsWith(':') ? text.slice(0, -1) : text)
        $getRoot().clear().append($createCodeNode().append(code))
        code.selectEnd()
      },
      { discrete: true },
    )
  })
  if (text.endsWith(':')) {
    await append(':')
  }
  expect(document.querySelector('[role="listbox"]')).toBeNull()
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe(text))
})

test('formatting an existing closed shortcode does not convert document content', async () => {
  mount()
  await act(async () => {
    editor.update(
      () => {
        const text = $createTextNode(':spaghetti:')
        $getRoot().clear().append($createParagraphNode().append(text))
        text.selectEnd()
      },
      { discrete: true, tag: 'historic' },
    )
  })
  await act(async () => {
    editor.update(
      () => {
        $getRoot().getAllTextNodes()[0].toggleFormat('bold')
      },
      { discrete: true },
    )
  })
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe(':spaghetti:'))
})

test('pasting a closed shortcode keeps it as literal text', async () => {
  mount()
  await act(async () => {
    editor.update(
      () => {
        const text = $createTextNode(':spaghetti:')
        $getRoot().clear().append($createParagraphNode().append(text))
        text.selectEnd()
      },
      { discrete: true, tag: PASTE_TAG },
    )
  })
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe(':spaghetti:'))
})

test('pasting only a closing colon does not convert the preceding query', async () => {
  mount()
  await type(':spaghetti')
  await append(':', PASTE_TAG)
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe(':spaghetti:'))
})

test('an exact one-character shortcode still converts when its closing colon is typed', async () => {
  mount()
  await type(':v')
  await append(':')
  await waitFor(() => editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe('✌️')))
})

test('moving the caret over an existing closing colon does not convert it', async () => {
  mount()
  await act(async () => {
    editor.update(
      () => {
        const text = $createTextNode(':spaghetti:')
        $getRoot().clear().append($createParagraphNode().append(text))
        text.select(10, 10)
      },
      { discrete: true, tag: 'historic' },
    )
  })
  await act(async () => {
    editor.update(
      () => {
        $getRoot().getAllTextNodes()[0].selectEnd()
      },
      { discrete: true },
    )
  })
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe(':spaghetti:'))
})

test('pasting the closing colon through suggestion mode keeps the shortcode literal', async () => {
  mount()
  await type(':spaghetti')
  await act(async () => {
    editor.update(
      () => {
        $handleBeforeInputEvent(
          editor,
          { inputType: 'insertFromPaste', data: ':', dataTransfer: null } as InputEvent,
          () => {},
          { info: () => {}, warn: () => {}, error: () => {} },
        )
      },
      { discrete: true },
    )
  })
  await waitFor(() => editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe(':spaghetti:')))
  expect(document.querySelector('[role="listbox"]')).toBeNull()
})
