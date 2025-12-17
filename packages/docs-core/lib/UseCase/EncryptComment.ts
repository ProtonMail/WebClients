import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '@proton/docs-shared'
import type { EncryptionService } from '../Services/Encryption/EncryptionService'
import type { DocumentKeys } from '@proton/drive-store'
import { GetAssociatedEncryptionDataForComment } from './GetAdditionalEncryptionData'
import type { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import { utf8StringToUint8Array } from '@proton/crypto/lib/utils'
import metrics from '@proton/metrics'
import { canKeysSign } from '../Types/DocumentEntitlements'
import type { PublicDocumentKeys } from '@proton/drive-store'

export class EncryptComment implements UseCaseInterface<string> {
  constructor(private encryption: EncryptionService<EncryptionContext.PersistentComment>) {}

  async execute(comment: string, markId: string, keys: DocumentKeys | PublicDocumentKeys): Promise<Result<string>> {
    const encrypted = canKeysSign(keys)
      ? await this.encryption.signAndEncryptData(
          utf8StringToUint8Array(comment),
          GetAssociatedEncryptionDataForComment({
            authorAddress: keys.userOwnAddress,
            markId: markId,
          }),
          keys.documentContentKey,
          keys.userAddressPrivateKey,
        )
      : await this.encryption.encryptAnonymousData(
          utf8StringToUint8Array(comment),
          GetAssociatedEncryptionDataForComment({
            authorAddress: undefined,
            markId: markId,
          }),
          keys.documentContentKey,
        )

    if (encrypted.isFailed()) {
      metrics.docs_comments_error_total.increment({
        reason: 'encryption_error',
      })

      return Result.fail(encrypted.getError())
    }

    return Result.ok(encrypted.getValue().toBase64())
  }
}
