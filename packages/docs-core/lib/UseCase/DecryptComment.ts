import { utf8ArrayToString } from '@proton/crypto/lib/utils'
import { VERIFICATION_STATUS } from '@proton/crypto'
import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import { EncryptionService } from '../Services/Encryption/EncryptionService'
import { DocumentKeys } from '@proton/drive-store'
import { GetAssociatedEncryptionDataForComment } from './GetAdditionalEncryptionData'
import { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import { Comment } from '../Models'
import { ServerTime } from '@proton/docs-shared'
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding'
import { CommentResponseDto } from '../Api/Docs/Types'
import metrics from '@proton/metrics'

export class DecryptComment implements UseCaseInterface<Comment> {
  constructor(private encryption: EncryptionService<EncryptionContext.PersistentComment>) {}

  async execute(dto: CommentResponseDto, markId: string, keys: DocumentKeys): Promise<Result<Comment>> {
    const decrypted = await this.encryption.decryptData(
      base64StringToUint8Array(dto.Content),
      GetAssociatedEncryptionDataForComment({ authorAddress: dto.Author, markId }),
      keys.documentContentKey,
    )

    if (decrypted.isFailed()) {
      metrics.docs_comments_error_total.increment({
        reason: 'encryption_error',
      })

      return Result.fail(decrypted.getError())
    }

    const verificationKey = await this.encryption.getVerificationKey(dto.Author)

    if (verificationKey.isFailed()) {
      return Result.fail(verificationKey.getError())
    }

    const verifyResult = await this.encryption.verifyData(
      decrypted.getValue().content,
      decrypted.getValue().signature,
      GetAssociatedEncryptionDataForComment({ authorAddress: dto.Author, markId }),
      verificationKey.getValue(),
    )

    if (verifyResult.isFailed()) {
      return Result.fail(verifyResult.getError())
    }

    const verifyValue = verifyResult.getValue()

    if (verifyValue !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
      return Result.fail(`Comment content verification failed: ${verifyValue}`)
    }

    return Result.ok(
      new Comment(
        dto.CommentID,
        new ServerTime(dto.CreateTime),
        new ServerTime(dto.ModifyTime),
        utf8ArrayToString(decrypted.getValue().content),
        dto.ParentCommentID,
        dto.Author,
        [],
        false,
      ),
    )
  }
}
