import type { DecryptedNode, DriveCompat, NodeMeta } from '@proton/drive-store'
import type { FileToDocConversionResult } from '../Types/FileToDocConversionResult'
import type { GetDocumentMeta } from './GetDocumentMeta'
import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants'
import { getErrorString } from '../Util/GetErrorString'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '@proton/docs-shared'
import { getNodeNameWithoutExtension } from '@proton/docs-shared'

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
      const parentMeta: NodeMeta = node.parentNodeId
        ? {
            volumeId: node.volumeId,
            linkId: node.parentNodeId,
          }
        : await this.driveCompat.getMyFilesNodeMeta()

      const nodeNameWithoutExtension = getNodeNameWithoutExtension(node)
      const newDocName = await this.driveCompat.findAvailableNodeName(parentMeta, nodeNameWithoutExtension)
      const shellResult = await this.driveCompat.createDocumentNode(parentMeta, newDocName)

      const documentMetaResult = await this.getDocumentMeta.execute({
        volumeId: shellResult.volumeId,
        linkId: shellResult.linkId,
      })

      if (documentMetaResult.isFailed()) {
        return Result.fail(documentMetaResult.getErrorObject().message)
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
