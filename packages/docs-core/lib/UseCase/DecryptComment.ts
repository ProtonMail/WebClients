import { utf8ArrayToString } from '@proton/crypto/lib/utils'
import { VERIFICATION_STATUS } from '@proton/crypto'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import type { EncryptionService } from '../Services/Encryption/EncryptionService'
import type { DocumentKeys } from '@proton/drive-store'
import { GetAssociatedEncryptionDataForComment } from './GetAdditionalEncryptionData'
import type { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import { Comment } from '../Models'
import { ServerTime } from '@proton/docs-shared'
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding'
import metrics from '@proton/metrics'
import type { CommentResponseDto } from '../Api/Types/CommentResponseDto'

export class DecryptComment implements UseCaseInterface<Comment> {
  constructor(private encryption: EncryptionService<EncryptionContext.PersistentComment>) {}

  async execute(dto: CommentResponseDto, markId: string, keys: DocumentKeys): Promise<Result<Comment>> {
    const emailToUse = dto.AuthorEmail || dto.Author
    if (!emailToUse) {
      return Result.fail('No author email or author address found in comment')
    }

    const decrypted = await this.encryption.decryptData(
      base64StringToUint8Array(dto.Content),
      GetAssociatedEncryptionDataForComment({ authorAddress: emailToUse, markId }),
      keys.documentContentKey,
    )

    if (decrypted.isFailed()) {
      metrics.docs_comments_download_error_total.increment({
        reason: 'decryption_error',
      })

      return Result.fail(`Comment decryption failed: ${decrypted.getError()}`)
    }

    const verificationKey = await this.encryption.getVerificationKey(emailToUse)

    if (verificationKey.isFailed()) {
      return Result.fail(`Comment verification key failed: ${verificationKey.getError()}`)
    }

    const verifyResult = await this.encryption.verifyData(
      decrypted.getValue().content,
      decrypted.getValue().signature,
      GetAssociatedEncryptionDataForComment({ authorAddress: emailToUse, markId }),
      verificationKey.getValue(),
    )

    if (verifyResult.isFailed()) {
      metrics.docs_comments_download_error_total.increment({
        reason: 'decryption_error',
      })

      return Result.fail(`Comment verifyResult is failed: ${verifyResult.getError()}`)
    }

    const verifyValue = verifyResult.getValue()

    if (verifyValue !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
      metrics.docs_comments_download_error_total.increment({
        reason: 'decryption_error',
      })

      return Result.fail(`Comment content verification failed: ${verifyValue}`)
    }

    return Result.ok(
      new Comment(
        dto.CommentID,
        new ServerTime(dto.CreateTime),
        new ServerTime(dto.ModifyTime),
        utf8ArrayToString(decrypted.getValue().content),
        dto.ParentCommentID,
        emailToUse,
        [],
        false,
        dto.Type,
      ),
    )
  }
}
