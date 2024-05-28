import { DecryptMessage } from './DecryptMessage'
import { Commit } from '@proton/docs-proto'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { DocumentKeys } from '@proton/drive-store'
import { DecryptedMessage } from '../Models/DecryptedMessage'
import { DecryptedCommit } from '../Models/DecryptedCommit'
import { VerifyCommit } from './VerifyCommit'
import { InternalEventBusInterface } from '@proton/docs-shared'
import { CommitVerificationFailedPayload, DocControllerEvent } from '../Controller/Document/DocControllerEvent'

type DecryptCommitDTO = {
  commit: Commit
  commitId: string
  keys: DocumentKeys
  verificationMode: 'deferred' | 'immediate'
}

const VERIFY_VALUE_FALSE_DUE_TO_COMMIT_HAVING_DEFERRED_VERIFICATION = false

export class DecryptCommit implements UseCaseInterface<DecryptedCommit> {
  constructor(
    private decryptMessage: DecryptMessage,
    private verifyCommit: VerifyCommit,
    private eventBus: InternalEventBusInterface,
  ) {}

  async execute(dto: DecryptCommitDTO): Promise<Result<DecryptedCommit>> {
    const updates = dto.commit.updates.documentUpdates

    const decryptedResults: Result<DecryptedMessage>[] = await Promise.all(
      updates.map((update) =>
        this.decryptMessage.execute({
          message: update,
          keys: dto.keys,
          verify: VERIFY_VALUE_FALSE_DUE_TO_COMMIT_HAVING_DEFERRED_VERIFICATION,
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

    if (dto.verificationMode === 'immediate') {
      const verificationResult = await this.verifyCommit.execute({
        commit,
      })

      if (verificationResult.isFailed()) {
        return Result.fail(verificationResult.getError())
      }

      const verificationValue = verificationResult.getValue()

      if (!verificationValue.allVerified) {
        return Result.fail('Failed to verify commit')
      }
    } else if (dto.verificationMode === 'deferred') {
      void this.performDeferredVerificationOfInitialCommit(commit)
    }

    return Result.ok(commit)
  }

  async performDeferredVerificationOfInitialCommit(commit: DecryptedCommit): Promise<void> {
    const result = await this.verifyCommit.execute({
      commit,
    })

    if (result.isFailed()) {
      throw new Error('Failed to verify commit')
    }

    const resultValue = result.getValue()

    if (!resultValue.allVerified) {
      this.eventBus.publish({
        type: DocControllerEvent.CommitVerificationFailed,
        payload: <CommitVerificationFailedPayload>{
          commitId: commit.commitId,
        },
      })
    }
  }
}
