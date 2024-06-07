import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { DecryptedCommit } from '../Models/DecryptedCommit'
import { VerifyMessages } from './VerifyMessages'
import { VerificationUsecaseResult } from './VerifyUpdatesResult'

export class VerifyCommit implements UseCaseInterface<VerificationUsecaseResult> {
  constructor(private verifyMessages: VerifyMessages) {}

  async execute(dto: { commit: DecryptedCommit }): Promise<Result<VerificationUsecaseResult>> {
    const result = await this.verifyMessages.execute({
      messages: dto.commit.updates,
    })

    return result
  }
}
