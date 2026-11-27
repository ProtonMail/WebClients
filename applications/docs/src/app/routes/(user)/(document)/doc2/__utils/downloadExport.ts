import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared/ExportableDataType'
import { DocumentExportMimeTypes } from '@proton/docs-shared/ExportableDataType'

import { getSafeFileName } from '~/utils/safeFileName'

import type { EditorInvoker } from './EditorInvoker'

/**
 * Copied from `packages/docs-core/lib/UseCase/ExportAndDownload.ts`, which doc2 must not import. The document's name
 * may hold any character, so the file name is made safe for file systems.
 */
export function downloadExport(
  data: Uint8Array<ArrayBuffer>,
  docName: string,
  format: DataTypesThatDocumentCanBeExportedAs,
): void {
  const blob = new Blob([data], { type: DocumentExportMimeTypes[format] })

  const a = document.createElement('a')
  a.download = getSafeFileName(docName, format)
  a.href = URL.createObjectURL(blob)

  document.body.appendChild(a)
  a.click()
  a.remove()
}

// Adapted from `packages/docs-core/lib/EditorController/EditorController.ts`, its `exportAndDownload`
export async function exportAndDownload(
  editorInvoker: Pick<EditorInvoker, 'exportData'>,
  docName: string,
  format: DataTypesThatDocumentCanBeExportedAs,
): Promise<void> {
  const data = await editorInvoker.exportData(format)
  downloadExport(data, docName, format)
}
