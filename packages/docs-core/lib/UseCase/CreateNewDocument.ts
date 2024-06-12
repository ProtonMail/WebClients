import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import { DriveCompat, DocumentNodeMeta, NodeMeta, DecryptedNode } from '@proton/drive-store'
import { GetDocumentMeta } from './GetDocumentMeta'
import { getErrorString } from '../Util/GetErrorString'

/**
 * Creates a new document from within the Docs client. This is used when selecting "New Document" from the UI.
 */
export class CreateNewDocument implements UseCaseInterface<DocumentNodeMeta> {
  constructor(
    private driveCompat: DriveCompat,
    private getDocumentMeta: GetDocumentMeta,
  ) {}

  async execute(
    desiredName: string,
    siblingMeta: NodeMeta,
    siblingNode: DecryptedNode,
  ): Promise<Result<DocumentNodeMeta>> {
    try {
      const parentMeta: NodeMeta = {
        volumeId: siblingMeta.volumeId,
        linkId: siblingNode.parentNodeId,
      }
      const name = await this.driveCompat.findAvailableNodeName(parentMeta, desiredName)
      const shellResult = await this.driveCompat.createDocumentNode(parentMeta, name)

      const createResult = await this.getDocumentMeta.execute({
        volumeId: shellResult.volumeId,
        linkId: shellResult.linkId,
      })

      if (createResult.isFailed()) {
        return Result.fail(createResult.getError())
      }

      return Result.ok(shellResult)
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to create new document')
    }
  }
}
