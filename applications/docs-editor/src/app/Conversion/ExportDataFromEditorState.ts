import { createHeadlessEditor } from '@lexical/headless'
import { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared'
import { $nodesOfType, SerializedEditorState } from 'lexical'
import { AllNodes } from '../AllNodes'
import { sendErrorMessage } from '../Utils/errorMessage'
import { generatePlaintextFromEditor } from './GeneratePlaintextFromEditor'
import { generateMarkdownFromEditor } from './GenerateMarkdownFromEditor'
import { $unwrapCommentThreadMarkNode, CommentThreadMarkNode } from '../Plugins/Comments/CommentThreadMarkNode'
import { generateHTMLFromEditor } from './GenerateHTMLFromEditor'
import { generateDocxFromEditor } from './GenerateDocxFromEditor/GenerateDocxFromEditor'
import { Packer } from 'docx'
import { stringToUtf8Array } from '@proton/crypto/lib/utils'

export async function exportDataFromEditorState(
  editorState: SerializedEditorState,
  format: DataTypesThatDocumentCanBeExportedAs,
): Promise<Uint8Array | Blob> {
  const editor = createHeadlessEditor({
    editable: false,
    editorState: undefined,
    namespace: 'export-editor',
    nodes: AllNodes,
    onError: (error) => {
      sendErrorMessage(error)
    },
  })
  editor.setEditorState(editor.parseEditorState(editorState))

  // We don't want comment thread highlights in the exported document
  // so we remove them before exporting
  editor.update(
    () => {
      const commentMarkNodes = $nodesOfType(CommentThreadMarkNode)
      for (const markNode of commentMarkNodes) {
        $unwrapCommentThreadMarkNode(markNode)
      }
    },
    {
      discrete: true,
    },
  )

  if (format === 'txt') {
    const plaintext = generatePlaintextFromEditor(editor)
    return stringToUtf8Array(plaintext)
  }

  if (format === 'md') {
    const markdown = generateMarkdownFromEditor(editor)
    return stringToUtf8Array(markdown)
  }

  if (format === 'html') {
    const html = generateHTMLFromEditor(editor)
    return stringToUtf8Array(html)
  }

  if (format === 'docx') {
    const docx = generateDocxFromEditor(editor)
    const buffer = await Packer.toBlob(docx)
    return buffer
  }

  throw new Error(`Unsupported format: ${format}`)
}
