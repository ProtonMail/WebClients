import {
  ClientRequiresEditorMethods,
  DocumentMetaInterface,
  DataTypesThatDocumentCanBeExportedAs,
  DocumentExportMimeTypes,
} from '@proton/docs-shared'
import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'

export class ExportAndDownload implements UseCaseInterface<void> {
  async execute(
    editorInvoker: ClientRequiresEditorMethods,
    documentMeta: DocumentMetaInterface,
    format: DataTypesThatDocumentCanBeExportedAs,
  ): Promise<Result<void>> {
    const data = await editorInvoker.exportData(format)
    const name = `${documentMeta.name}.${format}`
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
