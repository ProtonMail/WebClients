import type { LexicalEditor } from 'lexical'
import { $getRoot } from 'lexical'
import { wrap } from 'comlink'
import type { PDFWorker } from './PDFWorker'
import type { PDFPageSize } from './PDFPageSize'
import { getPDFDataNodeFromLexicalNode } from './LexicalNodeToPDFNode/getPDFDataNodeFromLexicalNode'

const PDFWorkerComlink = wrap<PDFWorker>(new Worker(new URL('./PDFWorker.tsx', import.meta.url)))

/**
 * @returns The PDF as an object url
 */
export function $generatePDFFromEditor(editor: LexicalEditor, pageSize: PDFPageSize): Promise<string> {
  return new Promise<string>((resolve) => {
    editor.getEditorState().read(() => {
      const root = $getRoot()
      const nodes = root.getChildren()

      const pdfDataNodes = nodes.map(getPDFDataNodeFromLexicalNode)

      void PDFWorkerComlink.renderPDF(pdfDataNodes, pageSize).then((blob) => {
        const url = URL.createObjectURL(blob)
        resolve(url)
      })
    })
  })
}
