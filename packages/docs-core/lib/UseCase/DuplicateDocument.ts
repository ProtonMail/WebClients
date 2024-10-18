import type { DocumentNodeMeta, DriveCompat } from '@proton/drive-store'
import { Result } from '../Domain/Result/Result'

import type { NodeMeta } from '@proton/drive-store'
import type { SeedInitialCommit } from './SeedInitialCommit'
import type { GetDocumentMeta } from './GetDocumentMeta'
import { getErrorString } from '../Util/GetErrorString'
import type { DocumentMetaInterface } from '@proton/docs-shared'
import { getPlatformFriendlyDateForFileName } from '../Util/PlatformFriendlyFileNameDate'

export class DuplicateDocument {
  constructor(
    private driveCompat: DriveCompat,
    private getDocumentMeta: GetDocumentMeta,
    private seedInitialCommit: SeedInitialCommit,
  ) {}

  /** Execute for a private document */
  async executePrivate(docMeta: DocumentMetaInterface, state: Uint8Array): Promise<Result<DocumentNodeMeta>> {
    try {
      const node = await this.driveCompat.getNode(docMeta.nodeMeta)

      const parentMeta: NodeMeta = node.parentNodeId
        ? {
            volumeId: node.volumeId,
            linkId: node.parentNodeId,
          }
        : await this.driveCompat.getMyFilesNodeMeta()

      const date = getPlatformFriendlyDateForFileName()
      const newName = `${docMeta.name} (copy ${date})`

      return await this.genericDuplicate(newName, parentMeta, state)
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to duplicate document')
    }
  }

  /** Execute for a public document */
  async executePublic(originalName: string, state: Uint8Array): Promise<Result<DocumentNodeMeta>> {
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
    state: Uint8Array,
  ): Promise<Result<DocumentNodeMeta>> {
    try {
      const name = await this.driveCompat.findAvailableNodeName(parentMeta, newName)
      const shellResult = await this.driveCompat.createDocumentNode(parentMeta, name)

      const documentMetaResult = await this.getDocumentMeta.execute({
        volumeId: shellResult.volumeId,
        linkId: shellResult.linkId,
      })
      if (documentMetaResult.isFailed()) {
        return Result.fail(documentMetaResult.getError())
      }

      const newDoc = documentMetaResult.getValue()

      const commitResult = await this.seedInitialCommit.execute(newDoc.nodeMeta, state, shellResult.keys)
      if (commitResult.isFailed()) {
        return Result.fail(commitResult.getError())
      }

      return Result.ok(shellResult)
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to duplicate document')
    }
  }
}
