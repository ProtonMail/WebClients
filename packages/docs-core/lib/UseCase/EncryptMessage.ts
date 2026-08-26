import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import type { Result, DocumentKeys, PublicDocumentKeys } from '@proton/docs-shared'
import type { EncryptionService } from '../Services/Encryption/EncryptionService'
import type { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import { GetAssociatedEncryptionDataForRealtimeMessage } from './GetAdditionalEncryptionData'
import type { AnonymousEncryptionMetadata, EncryptionMetadata } from '../Types/EncryptionMetadata'
import { canKeysSign } from '../Types/DocumentEntitlements'

/**
 * Encrypts a message directed towards the RTS.
 */
export class EncryptMessage implements UseCaseInterface<Uint8Array<ArrayBuffer>> {
  constructor(private encryption: EncryptionService<EncryptionContext.RealtimeMessage>) {}

  async execute(
    update: Uint8Array<ArrayBuffer>,
    metadata: EncryptionMetadata | AnonymousEncryptionMetadata,
    keys: DocumentKeys | PublicDocumentKeys,
  ): Promise<Result<Uint8Array<ArrayBuffer>>> {
    const aad = GetAssociatedEncryptionDataForRealtimeMessage(metadata)

    if (canKeysSign(keys)) {
      const result = await this.encryption.signAndEncryptData(
        update,
        aad,
        keys.documentContentKey,
        keys.userAddressPrivateKey,
      )

      return result
    } else {
      const result = await this.encryption.encryptAnonymousData(update, aad, keys.documentContentKey)
      return result
    }
  }
}
