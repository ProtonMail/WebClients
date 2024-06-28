import { DocumentNodeMeta, DriveCompat } from '@proton/drive-store'
import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'

import { NodeMeta } from '@proton/drive-store'
import { SeedInitialCommit } from './SeedInitialCommit'
import { GetDocumentMeta } from './GetDocumentMeta'
import { getErrorString } from '../Util/GetErrorString'

export class DuplicateDocument implements UseCaseInterface<DocumentNodeMeta> {
  constructor(
    private driveCompat: DriveCompat,
    private getDocumentMeta: GetDocumentMeta,
    private seedInitialCommit: SeedInitialCommit,
  ) {}

  async execute(newName: string, lookup: NodeMeta, state: Uint8Array): Promise<Result<DocumentNodeMeta>> {
    try {
      const node = await this.driveCompat.getNode(lookup)

      const parentMeta: NodeMeta = node.parentNodeId
        ? {
            volumeId: node.volumeId,
            linkId: node.parentNodeId,
          }
        : await this.driveCompat.getMyFilesNodeMeta()

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

      const commitResult = await this.seedInitialCommit.execute(newDoc, state, shellResult.keys)
      if (commitResult.isFailed()) {
        return Result.fail(commitResult.getError())
      }

      return Result.ok(shellResult)
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to duplicate document')
    }
  }
}
