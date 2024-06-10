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

    const result = await this.encryption.signAndEncryptData(
      update,
      aad,
      keys.documentContentKey,
      keys.userAddressPrivateKey,
    )

    return result
  }
}
