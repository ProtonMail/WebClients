import type { DecryptCommit } from './DecryptCommit'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import type { DocumentKeys, NodeMeta } from '@proton/drive-store'
import type { GetCommitData } from './GetCommitData'
import type { DecryptedCommit } from '../Models/DecryptedCommit'

/**
 * Fetches commit data from the Docs server and decrypts it
 */
export class LoadCommit implements UseCaseInterface<DecryptedCommit> {
  constructor(
    private getCommitData: GetCommitData,
    private decryptCommit: DecryptCommit,
  ) {}

  async execute(lookup: NodeMeta, commitId: string, keys: DocumentKeys): Promise<Result<DecryptedCommit>> {
    const commitDataResult = await this.getCommitData.execute(lookup, commitId)
    if (commitDataResult.isFailed()) {
      return Result.fail(`Failed to get commit data ${commitDataResult.getError()}`)
    }

    const commit = commitDataResult.getValue()

    const decryptResult = await this.decryptCommit.execute({
      commit,
      commitId,
      keys,
    })

    if (decryptResult.isFailed()) {
      return Result.fail(`Failed to decrypt commit ${decryptResult.getError()}`)
    }

    return Result.ok(decryptResult.getValue())
  }
}
