import { Result } from '@proton/docs-shared'
import type { DriveCompat, DocumentNodeMeta } from '@proton/drive-store'
import type { NodeMeta, DocumentType, DecryptedNode } from '@proton/docs-shared'
import type { GetDocumentMeta } from './GetDocumentMeta'
import { getErrorString } from '../Util/GetErrorString'
import { getMyFilesNodeMeta } from '../DriveSDK/getMyFilesNodeMeta'
import { findAvailableNodeName } from '../DriveSDK/findAvailableNodeName'
import type { UnleashClient } from '@proton/unleash/UnleashClient'
import { isDriveCompatSDKEnabled } from '../Util/isDriveCompatSDKEnabled'

/**
 * Creates a new document from within the Docs client. This is used when selecting "New Document" from the UI.
 */
export class CreateNewDocument {
  constructor(
    private driveCompat: DriveCompat,
    private getDocumentMeta: GetDocumentMeta,
    private unleashClient: UnleashClient,
  ) {}

  async execute(
    desiredName: string,
    siblingMeta: NodeMeta,
    siblingNode: DecryptedNode,
    documentType: DocumentType,
  ): Promise<Result<DocumentNodeMeta>> {
    try {
      const useSDK = isDriveCompatSDKEnabled(this.unleashClient)
      const getRoot = useSDK ? getMyFilesNodeMeta : () => this.driveCompat.getMyFilesNodeMeta()
      const parentMeta: NodeMeta = siblingNode.parentNodeId
        ? {
            volumeId: siblingMeta.volumeId,
            linkId: siblingNode.parentNodeId,
          }
        : await getRoot()

      const name = useSDK
        ? await findAvailableNodeName(parentMeta, desiredName)
        : await this.driveCompat.findAvailableNodeName(parentMeta, desiredName)
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
