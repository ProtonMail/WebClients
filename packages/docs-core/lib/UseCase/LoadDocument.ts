import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import { DocumentMetaInterface } from '@proton/docs-shared'
import { DocumentKeys, DriveCompat, NodeMeta } from '@proton/drive-store'
import { GetDocumentMeta } from './GetDocumentMeta'

type LoadDocumentResult = {
  keys: DocumentKeys
  meta: DocumentMetaInterface
  lastCommitId?: string
}

/**
 * Performs initial loading procedure for document, including fetching keys and latest commit binary from DX.
 */
export class LoadDocument implements UseCaseInterface<LoadDocumentResult> {
  constructor(
    private driveCompat: DriveCompat,
    private getDocumentMeta: GetDocumentMeta,
  ) {}

  async execute(lookup: NodeMeta): Promise<Result<LoadDocumentResult>> {
    let keys: DocumentKeys | null = null

    try {
      keys = await this.driveCompat.getDocumentKeys(lookup)
    } catch (error) {
      return Result.fail(`Failed to load keys ${error}`)
    }

    if (!keys) {
      return Result.fail('Unable to load keys')
    }

    const fetchResult = await this.getDocumentMeta.execute(lookup)
    if (fetchResult.isFailed()) {
      return Result.fail(fetchResult.getError())
    }

    let meta: DocumentMetaInterface = fetchResult.getValue()

    if (!meta) {
      return Result.fail('Document meta not found')
    }

    const lastCommitId = meta.commitIds[meta.commitIds.length - 1]

    return Result.ok({ keys, meta, lastCommitId })
  }
}
