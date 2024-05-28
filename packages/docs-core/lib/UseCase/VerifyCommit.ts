import { VERIFICATION_STATUS } from '@proton/crypto'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { EncryptionService } from '../Services/Encryption/EncryptionService'
import { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import { DecryptedMessage } from '../Models/DecryptedMessage'
import { DecryptedCommit } from '../Models/DecryptedCommit'

type VerifyUpdatesDTO = {
  commit: DecryptedCommit
}

type PayloadVerificationResult = {
  verified: boolean
  message: DecryptedMessage
}

type VerifyUpdatesResult = {
  allVerified: boolean
  messages: PayloadVerificationResult[]
}

export class VerifyCommit implements UseCaseInterface<VerifyUpdatesResult> {
  constructor(private encryption: EncryptionService<EncryptionContext.RealtimeMessage>) {}

  async execute(dto: VerifyUpdatesDTO): Promise<Result<VerifyUpdatesResult>> {
    const results: PayloadVerificationResult[] = []
    let hasFailure = false

    for (const message of dto.commit.updates) {
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
