import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { act, render } from '@testing-library/react'
import { PASTE_COMMAND, type LexicalEditor } from 'lexical'
import { DocsDependenciesProvider, type DocsDependencies } from '../DocsDependenciesProvider'
import { defaultDocsMessages } from '../messages/defaultDocsMessages'
import { PasteLimitPlugin } from './PasteLimitPlugin'

let editor: LexicalEditor
function CaptureEditor() {
  ;[editor] = useLexicalComposerContext()
  return null
}

const showGenericAlertModal = jest.fn()

function EditorWithPasteLimit({ tooLarge }: { tooLarge: string }) {
  const messages = { ...defaultDocsMessages, paste: { ...defaultDocsMessages.paste, tooLarge } }
  return (
    <DocsDependenciesProvider dependencies={{ messages } as DocsDependencies}>
      <LexicalComposer initialConfig={{ namespace: 'paste-limit-test', onError: console.error }}>
        <CaptureEditor />
        <PasteLimitPlugin showGenericAlertModal={showGenericAlertModal} />
      </LexicalComposer>
    </DocsDependenciesProvider>
  )
}

function pasteText(text: string) {
  const event = {
    clipboardData: { getData: (type: string) => (type === 'Text' ? text : '') },
    preventDefault: jest.fn(),
  } as unknown as ClipboardEvent
  act(() => {
    editor.dispatchCommand(PASTE_COMMAND, event)
  })
  return event
}

it('blocks an oversized paste with the alert in the current host language', () => {
  const { rerender } = render(<EditorWithPasteLimit tooLarge="Collage trop volumineux." />)
  rerender(<EditorWithPasteLimit tooLarge="Einfügen zu groß." />)

  const event = pasteText('a'.repeat(1_000_000))

  expect(showGenericAlertModal).toHaveBeenCalledTimes(1)
  expect(showGenericAlertModal).toHaveBeenCalledWith('Einfügen zu groß.')
  expect(event.preventDefault).toHaveBeenCalled()
})
