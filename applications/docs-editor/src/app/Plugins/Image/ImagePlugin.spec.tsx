import { act, render } from '@testing-library/react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { COMMAND_PRIORITY_HIGH, PASTE_COMMAND, type LexicalEditor } from 'lexical'
import ImagesPlugin from './ImagePlugin'
import { ImageNode } from './ImageNode'

let editor: LexicalEditor
function CaptureEditor() {
  ;[editor] = useLexicalComposerContext()
  return null
}

function paste(html: string) {
  const event = {
    clipboardData: { getData: (type: string) => (type === 'text/html' ? html : ''), files: [], types: ['text/html'] },
    preventDefault: jest.fn(),
  } as unknown as ClipboardEvent
  act(() => {
    editor.dispatchCommand(PASTE_COMMAND, event)
  })
  return event
}

it('warns once for blocked images while allowing subsequent paste handlers to keep supported content', () => {
  const warning = jest.fn()
  render(
    <LexicalComposer
      initialConfig={{
        namespace: 'Docs',
        nodes: [ImageNode],
        onError: (error) => {
          throw error
        },
      }}
    >
      <CaptureEditor />
      <ImagesPlugin createWarningNotification={warning} />
    </LexicalComposer>,
  )
  const continuePaste = jest.fn(() => true)
  const unregister = editor.registerCommand(PASTE_COMMAND, continuePaste, COMMAND_PRIORITY_HIGH)
  const event = paste(
    '<p>Before<img src="https://example.com/one.png"><img src="https://example.com/two.png">After</p>',
  )
  expect(warning).toHaveBeenCalledTimes(1)
  expect(warning).toHaveBeenCalledWith(expect.stringContaining('Insert image'))
  expect(continuePaste).toHaveBeenCalledWith(event, editor)
  expect(event.preventDefault).not.toHaveBeenCalled()

  warning.mockClear()
  paste('<img src="data:image/png;base64,abc">')
  paste('<p>Plain text</p>')
  expect(warning).not.toHaveBeenCalled()
  act(() => {
    editor.setEditable(false)
  })
  paste('<img src="https://example.com/one.png">')
  expect(warning).not.toHaveBeenCalled()
  unregister()
})
