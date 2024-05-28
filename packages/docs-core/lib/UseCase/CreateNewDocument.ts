import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { DriveCompat, DocumentNodeMeta, NodeMeta } from '@proton/drive-store'
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

  async execute(name: string, parent: NodeMeta): Promise<Result<DocumentNodeMeta>> {
    try {
      const shellResult = await this.driveCompat.createDocumentNode(parent, name)

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
