import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared'
import { DocumentExportMimeTypes } from '@proton/docs-shared'

export function downloadExport(
  data: Uint8Array<ArrayBuffer>,
  docName: string,
  format: DataTypesThatDocumentCanBeExportedAs,
): void {
  const name = `${docName}.${format}`
  const mimeType = DocumentExportMimeTypes[format]
  const blob = new Blob([data], {
    type: mimeType,
  })

  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.download = name
  a.href = url

  document.body.appendChild(a)

  a.click()
  a.remove()
}
