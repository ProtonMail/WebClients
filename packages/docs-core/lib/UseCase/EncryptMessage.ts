import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { EncryptionService } from '../Services/Encryption/EncryptionService'
import { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import { DocumentKeys } from '@proton/drive-store'
import { GetAssociatedEncryptionDataForRealtimeMessage } from './GetAdditionalEncryptionData'

/**
 * Encrypts a message directed towards the RTS.
 */
export class EncryptMessage implements UseCaseInterface<Uint8Array> {
  constructor(private encryption: EncryptionService<EncryptionContext.RealtimeMessage>) {}

  async execute(
    update: Uint8Array,
    metadata: { version: number; authorAddress: string; timestamp: number },
    keys: DocumentKeys,
  ): Promise<Result<Uint8Array>> {
    const aad = GetAssociatedEncryptionDataForRealtimeMessage(metadata)

    return this.encryptAndValidate(update, aad, keys, 0)
  }

  async encryptAndValidate(
    update: Uint8Array,
    aad: string,
    keys: DocumentKeys,
    attemptCount: number,
  ): Promise<Result<Uint8Array>> {
    const result = await this.encryption.signAndEncryptData(
      update,
      aad,
      keys.documentContentKey,
      keys.userAddressPrivateKey,
    )

    if (result.isFailed()) {
      return Result.fail(result.getError())
    }

    const didDecryptSuccessfully = await this.canDecryptMessageToDetectBitflips(result.getValue(), aad, keys)
    if (!didDecryptSuccessfully) {
      if (attemptCount === 0) {
        return this.encryptAndValidate(update, aad, keys, 1)
      } else {
        return Result.fail('Failed to decrypt message after encryption.')
      }
    }

    return Result.ok(result.getValue())
  }

  async canDecryptMessageToDetectBitflips(message: Uint8Array, aad: string, keys: DocumentKeys): Promise<boolean> {
    const decrypted = await this.encryption.decryptData(message, aad, keys.documentContentKey)

    if (decrypted.isFailed()) {
      return false
    }

    return true
  }
}
