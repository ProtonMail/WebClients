import type { DecryptCommit } from './DecryptCommit'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { GetCommitData } from './GetCommitData'
import type { DecryptedCommit } from '../Models/DecryptedCommit'
import type { SessionKey } from '@proton/crypto'

/**
 * Fetches commit data from the Docs server and decrypts it
 */
export class LoadCommit implements UseCaseInterface<DecryptedCommit> {
  constructor(
    private getCommitData: GetCommitData,
    private decryptCommit: DecryptCommit,
  ) {}

  async execute(
    lookup: NodeMeta | PublicNodeMeta,
    commitId: string,
    documentContentKey: SessionKey,
  ): Promise<Result<DecryptedCommit>> {
    const commitDataResult = await this.getCommitData.execute(lookup, commitId)
    if (commitDataResult.isFailed()) {
      return Result.fail(`Failed to get commit data ${commitDataResult.getError()}`)
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
