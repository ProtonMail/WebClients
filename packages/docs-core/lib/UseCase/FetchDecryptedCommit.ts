import type { DecryptCommit } from './DecryptCommit'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '@proton/docs-shared'
import type { DocumentKeys, NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { GetCommitData } from './GetCommitData'
import type { DecryptedCommit } from '../Models/DecryptedCommit'

/**
 * Fetches commit data from the Docs server and decrypts it. This usecase assumes you already have the commitId you
 * want to fetch. If not, use @FetchMetaAndRawCommit instead.
 */
export class FetchDecryptedCommit implements UseCaseInterface<DecryptedCommit> {
  constructor(
    private getCommitData: GetCommitData,
    private decryptCommit: DecryptCommit,
  ) {}

  async execute(
    lookup: NodeMeta | PublicNodeMeta,
    commitId: string,
    documentContentKey: DocumentKeys['documentContentKey'],
  ): Promise<Result<DecryptedCommit>> {
    const commitDataResult = await this.getCommitData.execute(lookup, commitId)
    if (commitDataResult.isFailed()) {
      return Result.fail(`Failed to get commit data ${commitDataResult.getErrorMessage()}`)
    }

    const commit = commitDataResult.getValue()

    const decryptResult = await this.decryptCommit.execute({
      commit,
      commitId,
      documentContentKey,
    })

    if (decryptResult.isFailed()) {
      return Result.fail(`Failed to decrypt commit ${decryptResult.getError()}`)
    }

    return Result.ok(decryptResult.getValue())
  }
}
