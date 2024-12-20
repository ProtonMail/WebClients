import { VERIFICATION_STATUS } from '@proton/crypto'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '@proton/docs-shared'
import type { EncryptionService } from '../Services/Encryption/EncryptionService'
import type { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import type { DecryptedMessage } from '@proton/docs-shared'
import type { VerificationUsecaseResult, SingleMessageVerificationResult } from './VerifyUpdatesResult'

export class VerifyMessages implements UseCaseInterface<VerificationUsecaseResult> {
  constructor(private encryption: EncryptionService<EncryptionContext.RealtimeMessage>) {}

  async execute(dto: { messages: DecryptedMessage[] }): Promise<Result<VerificationUsecaseResult>> {
    const results: SingleMessageVerificationResult[] = []
    let hasFailure = false

    for (const message of dto.messages) {
      const verificationKey = await this.encryption.getVerificationKey(message.authorAddress)

      if (verificationKey.isFailed()) {
        hasFailure = true
        results.push({
          verified: false,
          message: message,
        })
      }

      const verifyResult = await this.encryption.verifyData(
        message.content,
        message.signature,
        message.aad,
        verificationKey.getValue(),
      )

      if (verifyResult.isFailed()) {
        hasFailure = true
        results.push({
          verified: false,
          message: message,
        })
      }

      const verifyValue = verifyResult.getValue()
      if (verifyValue !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        hasFailure = true
        results.push({
          verified: false,
          message: message,
        })
      }

      results.push({
        verified: true,
        message: message,
      })
    }

    return Result.ok({
      allVerified: !hasFailure,
      messages: results,
    })
  }
}
