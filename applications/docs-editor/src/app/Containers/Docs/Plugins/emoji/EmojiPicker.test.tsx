import { render, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $getRoot, type LexicalEditor } from 'lexical'
import { act } from 'react'
import EmojiPicker from './EmojiPicker'

let editor: LexicalEditor
function CaptureEditor() {
  ;[editor] = useLexicalComposerContext()
  return null
}
afterEach(cleanup)
test('picker search inserts an emoji, stays mounted and updates Recent', async () => {
  const result = render(
    <LexicalComposer
      initialConfig={{
        namespace: 'emoji-picker-test',
        onError: (error) => {
          throw error
        },
      }}
    >
      <CaptureEditor />
      <EmojiPicker />
    </LexicalComposer>,
  )
  await act(async () => {
    editor.update(
      () => {
        $getRoot().clear().append($createParagraphNode()).selectEnd()
      },
      { discrete: true },
    )
  })
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
