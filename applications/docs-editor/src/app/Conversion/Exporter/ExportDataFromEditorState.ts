import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared'
import type { SerializedEditorState } from 'lexical'
import { EditorTxtExporter } from './EditorTxtExporter'
import { EditorMarkdownExporter } from './EditorMarkdownExporter'
import { EditorHtmlExporter } from './EditorHtmlExporter'
import { EditorDocxExporter } from './DocxExport/EditorDocxExporter'
import { EditorPdfExporter } from './EditorPdfExporter'
import { EditorYjsExporter } from './EditorYjsExporter'
import type { DocxExportContext } from './DocxExport/LexicalToDocx/Context'

export async function exportDataFromEditorState(
  editorState: SerializedEditorState,
  format: DataTypesThatDocumentCanBeExportedAs,
  callbacks: {
    fetchExternalImageAsBase64: DocxExportContext['fetchExternalImageAsBase64']
  },
): Promise<Uint8Array> {
  switch (format) {
    case 'txt':
      return new EditorTxtExporter(editorState, callbacks).export()
    case 'md':
      return new EditorMarkdownExporter(editorState, callbacks).export()
    case 'html':
      return new EditorHtmlExporter(editorState, callbacks).export()
    case 'docx':
      return new EditorDocxExporter(editorState, callbacks).export()
    case 'pdf':
      return new EditorPdfExporter(editorState, callbacks).export()
    case 'yjs':
      return new EditorYjsExporter(editorState, callbacks, { customStateHandling: true }).export()
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}
