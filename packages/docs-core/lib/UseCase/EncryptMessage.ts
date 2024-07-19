import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import type { Result } from '../Domain/Result/Result'
import type { EncryptionService } from '../Services/Encryption/EncryptionService'
import type { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import type { DocumentKeys } from '@proton/drive-store'
import { GetAssociatedEncryptionDataForRealtimeMessage } from './GetAdditionalEncryptionData'
import type { EncryptionMetadata } from '../Types/EncryptionMetadata'

/**
 * Encrypts a message directed towards the RTS.
 */
export class EncryptMessage implements UseCaseInterface<Uint8Array> {
  constructor(private encryption: EncryptionService<EncryptionContext.RealtimeMessage>) {}

  async execute(update: Uint8Array, metadata: EncryptionMetadata, keys: DocumentKeys): Promise<Result<Uint8Array>> {
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
