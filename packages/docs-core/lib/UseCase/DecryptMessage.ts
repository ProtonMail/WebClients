import type { Event } from '@proton/docs-proto'
import { DocumentUpdate } from '@proton/docs-proto'
import type { EncryptionService } from '../Services/Encryption/EncryptionService'
import { GetAssociatedEncryptionDataForRealtimeMessage } from './GetAdditionalEncryptionData'
import type { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import { VERIFICATION_STATUS } from '@proton/crypto'
import { DecryptedMessage } from '@proton/docs-shared'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '@proton/docs-shared'
import type { DocumentKeys } from '@proton/drive-store/lib/_documents'

export type DecryptMessageDTO = {
  message: DocumentUpdate | Event
  documentContentKey: DocumentKeys['documentContentKey']
  verify: boolean
}

export class DecryptMessage implements UseCaseInterface<DecryptedMessage> {
  constructor(private encryption: EncryptionService<EncryptionContext.RealtimeMessage>) {}

  async execute(dto: DecryptMessageDTO): Promise<Result<DecryptedMessage>> {
    const decrypted = await this.encryption.decryptData(
      (dto.message instanceof DocumentUpdate ? dto.message.encryptedContent : dto.message.content) as Uint8Array<ArrayBuffer>,
      GetAssociatedEncryptionDataForRealtimeMessage(dto.message),
      dto.documentContentKey,
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
        decrypted.getValue().content  as Uint8Array<ArrayBuffer>,
        decrypted.getValue().signature  as Uint8Array<ArrayBuffer>,
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
      content: decrypted.getValue().content as Uint8Array<ArrayBuffer>,
      signature: decrypted.getValue().signature as Uint8Array<ArrayBuffer>,
      aad: GetAssociatedEncryptionDataForRealtimeMessage(dto.message),
      authorAddress: dto.message.authorAddress,
      timestamp: dto.message.timestamp,
    })

    return Result.ok(message)
  }
}
