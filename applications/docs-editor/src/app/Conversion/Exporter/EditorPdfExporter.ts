import type { SerializedEditorState } from 'lexical'
import type { ExporterRequiredCallbacks } from './EditorExporter'
import { EditorExporter } from './EditorExporter'
import type { PDFPageSize } from './PDFExport/PDFPageSize'

export class EditorPdfExporter extends EditorExporter {
  constructor(
    editorState: SerializedEditorState | string,
    callbacks: ExporterRequiredCallbacks,
    private readonly pageSize: PDFPageSize = 'A4',
  ) {
    super(editorState, callbacks)
  }

  async export(): Promise<Uint8Array> {
    const { $generatePDFFromEditor } = await import('./PDFExport/PDFExport')

    const pdf = await $generatePDFFromEditor(this.editor, this.pageSize)

    const blob = await fetch(pdf).then((res) => res.blob())

    return new Uint8Array(await blob.arrayBuffer())
  }
}
