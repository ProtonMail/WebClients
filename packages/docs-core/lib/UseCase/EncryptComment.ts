import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '@proton/docs-shared'
import type { EncryptionService } from '../Services/Encryption/EncryptionService'
import type { DocumentKeys } from '@proton/drive-store'
import { GetAssociatedEncryptionDataForComment } from './GetAdditionalEncryptionData'
import type { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import { stringToUtf8Array } from '@proton/crypto/lib/utils'
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding'
import metrics from '@proton/metrics'
import { isPrivateDocumentKeys, type PublicDocumentKeys } from '../Types/DocumentEntitlements'

export class EncryptComment implements UseCaseInterface<string> {
  constructor(private encryption: EncryptionService<EncryptionContext.PersistentComment>) {}

  async execute(comment: string, markId: string, keys: DocumentKeys | PublicDocumentKeys): Promise<Result<string>> {
    const encrypted = isPrivateDocumentKeys(keys)
      ? await this.encryption.signAndEncryptData(
          stringToUtf8Array(comment),
          GetAssociatedEncryptionDataForComment({
            authorAddress: keys.userOwnAddress,
            markId: markId,
          }),
          keys.documentContentKey,
          keys.userAddressPrivateKey,
        )
      : await this.encryption.encryptAnonymousData(
          stringToUtf8Array(comment),
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

    return Result.ok(uint8ArrayToBase64String(encrypted.getValue()))
  }
}
