import { Result } from '@proton/docs-shared/Result'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import type { NodeMeta, DocumentType } from '@proton/docs-shared/BasicTypes'
import type { DocumentNodeMeta } from '@proton/docs-shared/CryptoTypes'
import type { DecryptedNode } from '@proton/docs-shared/DecryptedNode'
import type { GetDocumentMeta } from './GetDocumentMeta'
import { getErrorString } from '../Util/GetErrorString'
import { getMyFilesNodeMeta } from '../DriveSDK/getMyFilesNodeMeta'
import { isSharedDirectly } from '../DriveSDK/isSharedDirectly'
import { findAvailableNodeName } from '../DriveSDK/findAvailableNodeName'
import type { UnleashClient } from '@proton/unleash/UnleashClient'
import { isDriveCompatSDKEnabled } from '../Util/isDriveCompatSDKEnabled'
import type { CreateDocumentNode } from '../Crypto/useCreateDocumentNode'

/**
 * Creates a new document from within the Docs client. This is used when selecting "New Document" from the UI. It goes
 * next to the sibling only when the user can edit it and it isn't shared with them directly, as `DuplicateDocument`
 * places a copy; otherwise to My files: a viewer can't write to the sibling's folder.
 */
export class CreateNewDocument {
  constructor(
    private driveCompat: DriveCompat,
    private getDocumentMeta: GetDocumentMeta,
    private unleashClient: UnleashClient,
    private providedCreateDocumentNode?: CreateDocumentNode,
  ) {}

  async execute(
    desiredName: string,
    siblingMeta: NodeMeta,
    siblingNode: DecryptedNode,
    documentType: DocumentType,
    canEdit: boolean,
  ): Promise<Result<DocumentNodeMeta>> {
    try {
      const replaceDriveCompat = isDriveCompatSDKEnabled(this.unleashClient)
      const getRoot = replaceDriveCompat ? getMyFilesNodeMeta : () => this.driveCompat.getMyFilesNodeMeta()
      const parentMeta: NodeMeta =
        canEdit && siblingNode.parentNodeId && !(await isSharedDirectly(siblingMeta))
          ? {
              volumeId: siblingMeta.volumeId,
              linkId: siblingNode.parentNodeId,
            }
          : await getRoot()

      const name = replaceDriveCompat
        ? await findAvailableNodeName(parentMeta, desiredName)
        : await this.driveCompat.findAvailableNodeName(parentMeta, desiredName)
      const createDocumentNode = this.providedCreateDocumentNode ?? this.driveCompat.createDocumentNode
      const shellResult = await createDocumentNode(parentMeta, name, documentType)

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
