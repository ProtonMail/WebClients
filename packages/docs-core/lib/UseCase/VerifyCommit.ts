import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import type { Result } from '../Domain/Result/Result'
import type { DecryptedCommit } from '../Models/DecryptedCommit'
import type { VerifyMessages } from './VerifyMessages'
import type { VerificationUsecaseResult } from './VerifyUpdatesResult'

export class VerifyCommit implements UseCaseInterface<VerificationUsecaseResult> {
  constructor(private verifyMessages: VerifyMessages) {}

  async execute(dto: { commit: DecryptedCommit }): Promise<Result<VerificationUsecaseResult>> {
    const result = await this.verifyMessages.execute({
      messages: dto.commit.updates,
    })

    return result
  }
}
