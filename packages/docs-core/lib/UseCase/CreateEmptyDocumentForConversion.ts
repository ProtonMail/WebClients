import type { DecryptedNode, DriveCompat, NodeMeta } from '@proton/drive-store'
import type { FileToDocConversionResult } from '../Types/FileToDocConversionResult'
import type { GetDocumentMeta } from './GetDocumentMeta'
import { getErrorString } from '../Util/GetErrorString'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '@proton/docs-shared'
import { getNodeNameWithoutExtension } from '@proton/docs-shared'
import { getDocsConversionType, isConvertibleToProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype'

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
    contents: Uint8Array<ArrayBuffer>
  }): Promise<Result<FileToDocConversionResult>> {
    try {
      const parentMeta: NodeMeta = node.parentNodeId
        ? {
            volumeId: node.volumeId,
            linkId: node.parentNodeId,
          }
        : await this.driveCompat.getMyFilesNodeMeta()

      const nodeNameWithoutExtension = getNodeNameWithoutExtension(node)
      const newDocName = await this.driveCompat.findAvailableNodeName(parentMeta, nodeNameWithoutExtension)

      const mimeType = node.mimeType
      const documentType = isConvertibleToProtonDocsSpreadsheet(mimeType) ? 'sheet' : 'doc'

      const shellResult = await this.driveCompat.createDocumentNode(parentMeta, newDocName, documentType)

      const documentMetaResult = await this.getDocumentMeta.execute({
        volumeId: shellResult.volumeId,
        linkId: shellResult.linkId,
      })

      if (documentMetaResult.isFailed()) {
        return Result.fail(documentMetaResult.getErrorObject().message)
      }

      const newDocMeta = documentMetaResult.getValue()

      const conversionType = getDocsConversionType(mimeType)

      return Result.ok({
        newDocMeta,
        newShell: shellResult,
        dataToConvert: {
          data: contents,
          type: { docType: documentType, dataType: conversionType },
        },
      })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to create empty document for conversion')
    }
  }
}
