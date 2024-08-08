import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared'
import { DocumentExportMimeTypes } from '@proton/docs-shared'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'

export class ExportAndDownload implements UseCaseInterface<void> {
  async execute(
    data: Uint8Array,
    docName: string,
    format: DataTypesThatDocumentCanBeExportedAs,
  ): Promise<Result<void>> {
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

    return Result.ok()
  }
}
