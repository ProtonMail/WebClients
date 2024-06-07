import { DecryptMessage } from './DecryptMessage'
import { Commit } from '@proton/docs-proto'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { DocumentKeys } from '@proton/drive-store'
import { DecryptedMessage } from '../Models/DecryptedMessage'
import { DecryptedCommit } from '../Models/DecryptedCommit'

type DecryptCommitDTO = {
  commit: Commit
  commitId: string
  keys: DocumentKeys
}

const VERIFY_VALUE_FALSE_DUE_TO_COMMIT_HAVING_SEPARATE_VERIFICATION = false

export class DecryptCommit implements UseCaseInterface<DecryptedCommit> {
  constructor(private decryptMessage: DecryptMessage) {}

  async execute(dto: DecryptCommitDTO): Promise<Result<DecryptedCommit>> {
    const updates = dto.commit.updates.documentUpdates

    const decryptedResults: Result<DecryptedMessage>[] = await Promise.all(
      updates.map((update) =>
        this.decryptMessage.execute({
          message: update,
          keys: dto.keys,
          verify: VERIFY_VALUE_FALSE_DUE_TO_COMMIT_HAVING_SEPARATE_VERIFICATION,
        }),
      ),
    )

    const failedResult = decryptedResults.find((result) => result.isFailed())
    if (failedResult) {
      return Result.fail(failedResult.getError())
    }

    const commit = new DecryptedCommit(
      dto.commitId,
      decryptedResults.map((result) => result.getValue()),
    )

    return Result.ok(commit)
  }
}
