import { DecryptMessage } from './DecryptMessage'
import { Commit } from '@proton/docs-proto'
import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import { DocumentKeys } from '@proton/drive-store'
import { DecryptedMessage } from '../Models/DecryptedMessage'
import { DecryptedCommit } from '../Models/DecryptedCommit'
import metrics from '@proton/metrics'

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

    const failedResults = decryptedResults.filter((result) => result.isFailed())
    if (failedResults.length > 0) {
      for (const _ of failedResults) {
        metrics.docs_document_updates_decryption_error_total.increment({
          source: 'persistent',
        })
      }

      return Result.fail(failedResults[0].getError())
    }

    const commit = new DecryptedCommit(
      dto.commitId,
      decryptedResults.map((result) => result.getValue()),
    )

    return Result.ok(commit)
  }
}
