import { render, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $getRoot, type LexicalEditor } from 'lexical'
import { act, type ReactNode } from 'react'
import { SimpleDropdown } from '../../Components/Dropdown'
import { loadEmojis } from './emojiData'
import EmojiPicker from './EmojiPicker'

let editor: LexicalEditor
function CaptureEditor() {
  ;[editor] = useLexicalComposerContext()
  return null
}
function EmptyDocument({ children }: { children: ReactNode }) {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'emoji-picker-test',
        editorState: () => {
          $getRoot().append($createParagraphNode()).selectEnd()
        },
        onError: (error) => {
          throw error
        },
      }}
    >
      <CaptureEditor />
      {children}
    </LexicalComposer>
  )
}
afterEach(() => {
  cleanup()
  jest.restoreAllMocks()
})
test('picker search inserts an emoji, stays mounted and updates Recent', async () => {
  const result = render(<EmojiPicker />, { wrapper: EmptyDocument })
  await waitFor(() => expect(result.getByRole('searchbox')).toBeTruthy())
  fireEvent.change(result.getByRole('searchbox'), { target: { value: 'spaghetti' } })
  await waitFor(() => expect(result.getByRole('gridcell', { name: 'Spaghetti' })).toBeTruthy())
  await act(async () => {
    fireEvent.click(result.getByRole('gridcell', { name: 'Spaghetti' }))
  })
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe('🍝'))
  expect(result.getByRole('searchbox')).toBeTruthy()
  fireEvent.change(result.getByRole('searchbox'), { target: { value: '' } })
  expect(result.getByText('Recent')).toBeTruthy()
})

test('focus stays in the search box when the picker opens and when an emoji is clicked', async () => {
  // JSDOM has no layout; Ariakit only focuses the menu itself when it looks visible.
  jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1)
  await loadEmojis()
  const result = render(
    <SimpleDropdown as="button" content="Insert emoji" contentProps={{ autoClose: false, autoFocusOnShow: false }}>
      <EmojiPicker />
    </SimpleDropdown>,
    { wrapper: EmptyDocument },
  )
  fireEvent.click(result.getByRole('button', { name: 'Insert emoji' }), { detail: 1 })
  await waitFor(() => expect(result.getByRole('searchbox')).toHaveFocus())
  // Ariakit's own focus on show runs in a microtask after the menu opens.
  await act(() => new Promise((resolve) => setTimeout(resolve)))
  expect(result.getByRole('searchbox')).toHaveFocus()

  fireEvent.change(result.getByRole('searchbox'), { target: { value: 'spaghetti' } })
  const spaghetti = await result.findByRole('gridcell', { name: 'Spaghetti' })
  // JSDOM moves no focus on mousedown; a cancelled mousedown is what keeps it in the browser.
  expect(fireEvent.mouseDown(spaghetti)).toBe(false)
  await act(async () => {
    fireEvent.click(spaghetti)
  })
  editor.getEditorState().read(() => expect($getRoot().getTextContent()).toBe('🍝'))
  expect(result.getByRole('searchbox')).toHaveFocus()
  expect(fireEvent.mouseDown(result.getByRole('searchbox'))).toBe(true)
})
