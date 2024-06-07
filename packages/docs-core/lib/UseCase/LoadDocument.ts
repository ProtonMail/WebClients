import { DecryptCommit } from './DecryptCommit'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { DocumentMetaInterface } from '@proton/docs-shared'
import { DocumentKeys, DriveCompat, NodeMeta } from '@proton/drive-store'
import { GetDocumentMeta } from './GetDocumentMeta'
import { GetCommitData } from './GetCommitData'
import { DecryptedCommit } from '../Models/DecryptedCommit'

type LoadDocumentResult = {
  decryptedCommit?: DecryptedCommit
  keys: DocumentKeys
  docMeta: DocumentMetaInterface
}

/**
 * Performs initial loading procedure for document, including fetching keys and latest commit binary from DX.
 */
export class LoadDocument implements UseCaseInterface<LoadDocumentResult> {
  constructor(
    private driveCompat: DriveCompat,
    private getDocumentMeta: GetDocumentMeta,
    private getCommitData: GetCommitData,
    private decryptCommit: DecryptCommit,
  ) {}

  async execute(lookup: NodeMeta): Promise<Result<LoadDocumentResult>> {
    let documentKey: DocumentKeys | null = null

    try {
      documentKey = await this.driveCompat.getDocumentKeys(lookup)
    } catch (error) {
      return Result.fail(`Failed to load keys ${error}`)
    }

    if (!documentKey) {
      return Result.fail('Unable to load keys')
    }

    const fetchResult = await this.getDocumentMeta.execute(lookup)
    if (fetchResult.isFailed()) {
      return Result.fail(fetchResult.getError())
    }

    let docMeta: DocumentMetaInterface = fetchResult.getValue()

    if (!docMeta) {
      return Result.fail('Document meta not found')
    }

    const lastCommitId = docMeta.commitIds[docMeta.commitIds.length - 1]

    let decryptedCommit: DecryptedCommit | undefined = undefined

    if (lastCommitId) {
      const commitDataResult = await this.getCommitData.execute(lookup, lastCommitId)
      if (commitDataResult.isFailed()) {
        return Result.fail(`Failed to get commit data ${commitDataResult.getError()}`)
      }

      const commit = commitDataResult.getValue()

      const decryptResult = await this.decryptCommit.execute({
        commit,
        commitId: lastCommitId,
        keys: documentKey,
      })

      if (decryptResult.isFailed()) {
        return Result.fail(`Failed to decrypt commit ${decryptResult.getError()}`)
      }

      decryptedCommit = decryptResult.getValue()
    }

    return Result.ok({ keys: documentKey, decryptedCommit, docMeta })
  }
}
