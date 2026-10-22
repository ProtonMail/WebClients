import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../AllNodes'
import { defaultDocsMessages } from '../messages/defaultDocsMessages'
import { $importDataIntoEditor } from './ImportDataIntoEditor'

it('fails an unreadable Word document with the host-language error', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  const editor = createHeadlessEditor({ nodes: AllNodes, onError: console.error })
  const messages = { ...defaultDocsMessages.editorLoad, unreadableWordDocument: 'Document Word illisible.' }

  const result = await $importDataIntoEditor(
    editor,
    new TextEncoder().encode('not a zip archive'),
    { docType: 'doc', dataType: 'docx' },
    jest.fn(),
    () => messages,
  )

  expect(result.isFailed()).toBe(true)
  expect(result.getTranslatedError()).toBe('Document Word illisible.')
  consoleError.mockRestore()
})

it('fails a Word document in the locale that activated while it was converting', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  const editor = createHeadlessEditor({ nodes: AllNodes, onError: console.error })
  let messages = defaultDocsMessages.editorLoad

  const pendingResult = $importDataIntoEditor(
    editor,
    new TextEncoder().encode('not a zip archive'),
    { docType: 'doc', dataType: 'docx' },
    jest.fn(),
    () => messages,
  )
  messages = { ...defaultDocsMessages.editorLoad, unreadableWordDocument: 'Document Word illisible.' }
  const result = await pendingResult

  expect(result.getTranslatedError()).toBe('Document Word illisible.')
  consoleError.mockRestore()
})
