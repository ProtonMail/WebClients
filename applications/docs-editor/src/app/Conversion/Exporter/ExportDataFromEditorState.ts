import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared'
import type { SerializedEditorState } from 'lexical'
import type { DocxExportContext } from '../Docx/LexicalToDocx/Context'
import { EditorTxtExporter } from './EditorTxtExporter'
import { EditorMarkdownExporter } from './EditorMarkdownExporter'
import { EditorHtmlExporter } from './EditorHtmlExporter'
import { EditorDocxExporter } from './EditorDocxExporter'
import { EditorPdfExporter } from './EditorPdfExporter'

export async function exportDataFromEditorState(
  editorState: SerializedEditorState,
  format: DataTypesThatDocumentCanBeExportedAs,
  callbacks: {
    fetchExternalImageAsBase64: DocxExportContext['fetchExternalImageAsBase64']
  },
): Promise<Uint8Array | Blob> {
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
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}
