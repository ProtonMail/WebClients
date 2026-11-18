import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import type { NodeMeta, DocumentType } from '@proton/docs-shared/BasicTypes'
import type { DocumentNodeMeta } from '@proton/docs-shared/CryptoTypes'
import { Result } from '@proton/docs-shared/Result'

import type { SeedInitialCommit } from './SeedInitialCommit'
import type { GetDocumentMeta } from './GetDocumentMeta'
import { getErrorString } from '../Util/GetErrorString'
import { getPlatformFriendlyDateForFileName } from '@proton/shared/lib/docs/utils/getPlatformFriendlyDateForFileName'
import { isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype'
import { getMyFilesNodeMeta } from '../DriveSDK/getMyFilesNodeMeta'
import { findAvailableNodeName } from '../DriveSDK/findAvailableNodeName'
import { getDecryptedNode } from '../DriveSDK/getDecryptedNode'
import { traceErrorSDK } from '../DriveSDK/traceErrorSDK'
import { generateNodeUid, getDrive } from '@proton/drive/sdk'
import type { UnleashClient } from '@proton/unleash/UnleashClient'
import { isDriveCompatSDKEnabled } from '../Util/isDriveCompatSDKEnabled'
import type { CreateDocumentNode } from '../Crypto/useCreateDocumentNode'

export class DuplicateDocument {
  constructor(
    private driveCompat: DriveCompat,
    private getDocumentMeta: GetDocumentMeta,
    private seedInitialCommit: SeedInitialCommit,
    private unleashClient: UnleashClient,
    private providedCreateDocumentNode?: CreateDocumentNode,
  ) {}

  /**
   * Execute for a private document. The copy goes next to the original only when the user can edit it and it isn't
   * shared with them directly, as the homepage's `DocContextMenu.tsx` `canOrganize`; otherwise to My files: a viewer
   * can't write to the folder, and a document shared directly is copied to My files even when its folder is writable.
   */
  async executePrivate(
    nodeMeta: NodeMeta,
    state: Uint8Array<ArrayBuffer>,
    canEdit: boolean,
  ): Promise<Result<DocumentNodeMeta>> {
    try {
      const replaceDriveCompat = isDriveCompatSDKEnabled(this.unleashClient)

      let node
      if (replaceDriveCompat) {
        node = await getDecryptedNode(nodeMeta)
      } else {
        node = await this.driveCompat.getNode(nodeMeta)
      }

      const parentMetaGetter = replaceDriveCompat ? getMyFilesNodeMeta : () => this.driveCompat.getMyFilesNodeMeta()
      const parentMeta: NodeMeta =
        canEdit && node.parentNodeId && !(await this.isSharedDirectly(nodeMeta))
          ? {
              volumeId: node.volumeId,
              linkId: node.parentNodeId,
            }
          : await parentMetaGetter()

      const date = getPlatformFriendlyDateForFileName()
      const newName = `${node.name} (copy ${date})`

      return await this.genericDuplicate(
        newName,
        parentMeta,
        state,
        isProtonDocsSpreadsheet(node.mimeType) ? 'sheet' : 'doc',
      )
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to duplicate document')
    }
  }

  /**
   * Whether the user holds a membership on the document itself, as /doc's `useDriveSharing.ts` asks Drive.
   * `true` when Drive fails, so the copy goes to My files, which the user can always write to.
   */
  private async isSharedDirectly({ volumeId, linkId }: NodeMeta): Promise<boolean> {
    try {
      const node = await getDrive().getNode(generateNodeUid(volumeId, linkId))
      return !!node.membership
    } catch (error) {
      traceErrorSDK(error, 'DocsDriveCompatSDK')
      return true
    }
  }

  /** Execute for a public document */
  async executePublic(
    originalName: string,
    state: Uint8Array<ArrayBuffer>,
    documentType: DocumentType = 'doc',
  ): Promise<Result<DocumentNodeMeta>> {
    try {
      const parentMeta: NodeMeta = isDriveCompatSDKEnabled(this.unleashClient)
        ? await getMyFilesNodeMeta()
        : await this.driveCompat.getMyFilesNodeMeta()
      return await this.genericDuplicate(originalName, parentMeta, state, documentType)
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to duplicate document')
    }
  }

  private async genericDuplicate(
    newName: string,
    parentMeta: NodeMeta,
    state: Uint8Array<ArrayBuffer>,
    documentType: DocumentType = 'doc',
  ): Promise<Result<DocumentNodeMeta>> {
    try {
      const name = isDriveCompatSDKEnabled(this.unleashClient)
        ? await findAvailableNodeName(parentMeta, newName)
        : await this.driveCompat.findAvailableNodeName(parentMeta, newName)
      const createDocumentNode = this.providedCreateDocumentNode ?? this.driveCompat.createDocumentNode
      const shellResult = await createDocumentNode(parentMeta, name, documentType)

      const documentMetaResult = await this.getDocumentMeta.execute({
        volumeId: shellResult.volumeId,
        linkId: shellResult.linkId,
      })
      if (documentMetaResult.isFailed()) {
        return Result.fail(documentMetaResult.getErrorObject().message)
      }

      const newNodeMeta = {
        volumeId: shellResult.volumeId,
        linkId: shellResult.linkId,
      }

      const commitResult = await this.seedInitialCommit.execute(newNodeMeta, state, shellResult.keys)
      if (commitResult.isFailed()) {
        return Result.fail(commitResult.getError())
      }

      return Result.ok(shellResult)
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to duplicate document')
    }
  }
}
