import { Result } from '@proton/docs-shared'
import type { DriveCompat, DocumentNodeMeta, NodeMeta, DecryptedNode } from '@proton/drive-store'
import type { GetDocumentMeta } from './GetDocumentMeta'
import { getErrorString } from '../Util/GetErrorString'
import type { DocumentType } from '@proton/drive-store/store/_documents'

/**
 * Creates a new document from within the Docs client. This is used when selecting "New Document" from the UI.
 */
export class CreateNewDocument {
  constructor(
    private driveCompat: DriveCompat,
    private getDocumentMeta: GetDocumentMeta,
  ) {}

  async execute(
    desiredName: string,
    siblingMeta: NodeMeta,
    siblingNode: DecryptedNode,
    documentType: DocumentType,
  ): Promise<Result<DocumentNodeMeta>> {
    try {
      const parentMeta: NodeMeta = siblingNode.parentNodeId
        ? {
            volumeId: siblingMeta.volumeId,
            linkId: siblingNode.parentNodeId,
          }
        : await this.driveCompat.getMyFilesNodeMeta()

      const name = await this.driveCompat.findAvailableNodeName(parentMeta, desiredName)
      const shellResult = await this.driveCompat.createDocumentNode(parentMeta, name, documentType)

      const createResult = await this.getDocumentMeta.execute({
        volumeId: shellResult.volumeId,
        linkId: shellResult.linkId,
      })

      if (createResult.isFailed()) {
        return Result.fail(createResult.getErrorObject().message)
      }

      return Result.ok(shellResult)
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to create new document')
    }
  }
}
