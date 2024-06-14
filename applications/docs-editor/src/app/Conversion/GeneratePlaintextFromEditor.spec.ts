import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../AllNodes'
import { generatePlaintextFromEditor } from './GeneratePlaintextFromEditor'

describe('GeneratePlaintextFromEditor', () => {
  it('should export plaintext from editor', () => {
    const editor = createHeadlessEditor({
      editable: false,
      editorState: undefined,
      namespace: 'export-editor',
      nodes: AllNodes,
      onError: console.error,
    })

    const stringifiedEditorState = `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello world.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}`

    editor.setEditorState(editor.parseEditorState(stringifiedEditorState))

    const plaintext = generatePlaintextFromEditor(editor)

    expect(plaintext).toBe('Hello world.')
  })
})
