import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared/ExportableDataType'
import { DocumentExportMimeTypes } from '@proton/docs-shared/ExportableDataType'

import type { EditorInvoker } from './EditorInvoker'

/** Copied from docs-core `UseCase/ExportAndDownload.ts`, which doc2 must not import. */
export function downloadExport(
  data: Uint8Array<ArrayBuffer>,
  docName: string,
  format: DataTypesThatDocumentCanBeExportedAs,
): void {
  const blob = new Blob([data], { type: DocumentExportMimeTypes[format] })

  const a = document.createElement('a')
  a.download = `${docName}.${format}`
  a.href = URL.createObjectURL(blob)

  document.body.appendChild(a)
  a.click()
  a.remove()
}

// After docs-core's `EditorController.exportAndDownload`
export async function exportAndDownload(
  editorInvoker: Pick<EditorInvoker, 'exportData'>,
  docName: string,
  format: DataTypesThatDocumentCanBeExportedAs,
): Promise<void> {
  const data = await editorInvoker.exportData(format)
  downloadExport(data, docName, format)
}
