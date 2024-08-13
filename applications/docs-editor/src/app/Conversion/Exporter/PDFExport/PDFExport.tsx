import type { LexicalEditor } from 'lexical'
import { $getRoot } from 'lexical'
import { wrap } from 'comlink'
import type { PDFWorker } from './PDFWorker'
import type { PDFPageSize } from './PDFPageSize'
import { getPDFDataNodeFromLexicalNode } from './LexicalNodeToPDFNode/getPDFDataNodeFromLexicalNode'
import type { PDFDataNode } from './PDFDataNode'
import type { ExporterRequiredCallbacks } from '../EditorExporter'

const PDFWorkerComlink = wrap<PDFWorker>(new Worker(new URL('./PDFWorker.tsx', import.meta.url)))

/**
 * @returns The PDF as an object url
 */
export async function $generatePDFFromEditor(
  editor: LexicalEditor,
  pageSize: PDFPageSize,
  callbacks: ExporterRequiredCallbacks,
): Promise<string> {
  const state = editor.getEditorState()
  const nodes = state.read(() => {
    const root = $getRoot()
    return root.getChildren()
  })

  const pdfDataNodes: PDFDataNode[] = []
  for (const node of nodes) {
    const pdfDataNode = await getPDFDataNodeFromLexicalNode(node, state, callbacks)
    if (pdfDataNode) {
      pdfDataNodes.push(pdfDataNode)
    }
  }

  const blob = await PDFWorkerComlink.renderPDF(pdfDataNodes, pageSize)
  const url = URL.createObjectURL(blob)
  return url
}
