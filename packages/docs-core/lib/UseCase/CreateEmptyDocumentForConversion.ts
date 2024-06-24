import { DecryptedNode, DriveCompat } from '@proton/drive-store'
import { FileToDocConversionResult } from '../Types/FileToDocConversionResult'
import { GetDocumentMeta } from './GetDocumentMeta'
import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants'
import { getErrorString } from '../Util/GetErrorString'
import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'

/**
 * Creates a new empty document shell file. This file will then be opened, and the contents will be converted by the editor.
 */
export class CreateEmptyDocumentForConversion implements UseCaseInterface<FileToDocConversionResult> {
  constructor(
    private driveCompat: DriveCompat,
    private getDocumentMeta: GetDocumentMeta,
  ) {}

  async execute({
    node,
    contents,
  }: {
    node: DecryptedNode
    contents: Uint8Array
  }): Promise<Result<FileToDocConversionResult>> {
    try {
      const parentMeta = {
        volumeId: node.volumeId,
        linkId: node.parentNodeId,
      }

      const extension = node.mimeType === SupportedMimeTypes.docx ? 'docx' : 'md'
      const nodeNameWithoutExtension = node.name.endsWith(`.${extension}`)
        ? node.name.substring(0, node.name.indexOf(`.${extension}`))
        : node.name
      const newDocName = await this.driveCompat.findAvailableNodeName(parentMeta, nodeNameWithoutExtension)
      const shellResult = await this.driveCompat.createDocumentNode(parentMeta, newDocName)

      const documentMetaResult = await this.getDocumentMeta.execute({
        volumeId: shellResult.volumeId,
        linkId: shellResult.linkId,
      })

      if (documentMetaResult.isFailed()) {
        return Result.fail(documentMetaResult.getError())
      }

      const newDocMeta = documentMetaResult.getValue()

      return Result.ok({
        newDocMeta,
        newShell: shellResult,
        dataToConvert: { data: contents, type: node.mimeType === SupportedMimeTypes.docx ? 'docx' : 'md' },
      })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to create empty document for conversion')
    }
  }
}
