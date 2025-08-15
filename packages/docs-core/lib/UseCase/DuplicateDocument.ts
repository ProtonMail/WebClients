import type { DecryptedNode, DocumentNodeMeta, DriveCompat } from '@proton/drive-store'
import { Result } from '@proton/docs-shared'

import type { NodeMeta } from '@proton/drive-store'
import type { SeedInitialCommit } from './SeedInitialCommit'
import type { GetDocumentMeta } from './GetDocumentMeta'
import { getErrorString } from '../Util/GetErrorString'
import { getPlatformFriendlyDateForFileName } from '@proton/shared/lib/docs/utils/getPlatformFriendlyDateForFileName'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import { isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype'

export class DuplicateDocument {
  constructor(
    private driveCompat: DriveCompat,
    private getDocumentMeta: GetDocumentMeta,
    private seedInitialCommit: SeedInitialCommit,
  ) {}

  /** Execute for a private document */
  async executePrivate(nodeMeta: NodeMeta, node: DecryptedNode, state: Uint8Array<ArrayBuffer>): Promise<Result<DocumentNodeMeta>> {
    try {
      const node = await this.driveCompat.getNode(nodeMeta)

      const parentMeta: NodeMeta = node.parentNodeId
        ? {
            volumeId: node.volumeId,
            linkId: node.parentNodeId,
          }
        : await this.driveCompat.getMyFilesNodeMeta()

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

  /** Execute for a public document */
  async executePublic(originalName: string, state: Uint8Array<ArrayBuffer>): Promise<Result<DocumentNodeMeta>> {
    try {
      const parentMeta: NodeMeta = await this.driveCompat.getMyFilesNodeMeta()
      return await this.genericDuplicate(originalName, parentMeta, state)
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
      const name = await this.driveCompat.findAvailableNodeName(parentMeta, newName)
      const shellResult = await this.driveCompat.createDocumentNode(parentMeta, name, documentType)

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
