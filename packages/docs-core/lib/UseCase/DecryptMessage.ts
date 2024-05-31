import { DocumentUpdate, Event } from '@proton/docs-proto'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { EncryptionService } from '../Services/Encryption/EncryptionService'
import { DocumentKeys } from '@proton/drive-store'
import { GetAssociatedEncryptionDataForRealtimeMessage } from './GetAdditionalEncryptionData'
import { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import { VERIFICATION_STATUS } from '@proton/crypto'
import { DecryptedMessage } from '../Models/DecryptedMessage'

export type DecryptMessageDTO = {
  message: DocumentUpdate | Event
  keys: DocumentKeys
  verify: boolean
}

export class DecryptMessage implements UseCaseInterface<DecryptedMessage> {
  constructor(private encryption: EncryptionService<EncryptionContext.RealtimeMessage>) {}

  async execute(dto: DecryptMessageDTO): Promise<Result<DecryptedMessage>> {
    const decrypted = await this.encryption.decryptData(
      dto.message instanceof DocumentUpdate ? dto.message.encryptedContent : dto.message.content,
      GetAssociatedEncryptionDataForRealtimeMessage(dto.message),
      dto.keys.documentContentKey,
    )

    if (decrypted.isFailed()) {
      return Result.fail(decrypted.getError())
    }

    if (dto.verify) {
      const verificationKey = await this.encryption.getVerificationKey(dto.message.authorAddress)

      if (verificationKey.isFailed()) {
        return Result.fail(verificationKey.getError())
      }

      const verifyResult = await this.encryption.verifyData(
        decrypted.getValue().content,
        decrypted.getValue().signature,
        GetAssociatedEncryptionDataForRealtimeMessage(dto.message),
        verificationKey.getValue(),
      )

      if (verifyResult.isFailed()) {
        return Result.fail(verifyResult.getError())
      }

      if (verifyResult.getValue() !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        return Result.fail(`Message content verification failed: ${verifyResult.getValue()}`)
      }
    }

    const message = new DecryptedMessage({
      content: decrypted.getValue().content,
      signature: decrypted.getValue().signature,
      aad: GetAssociatedEncryptionDataForRealtimeMessage(dto.message),
      authorAddress: dto.message.authorAddress,
      timestamp: dto.message.timestamp,
    })

    return Result.ok(message)
  }
}
