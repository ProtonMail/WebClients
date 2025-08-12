import { utf8ArrayToString } from '@proton/crypto/lib/utils'
import { VERIFICATION_STATUS } from '@proton/crypto'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import type { CommentVerificationResult } from '@proton/docs-shared'
import { Result } from '@proton/docs-shared'
import type { EncryptionService } from '../Services/Encryption/EncryptionService'
import type { DocumentKeys, PublicDocumentKeys } from '@proton/drive-store'
import { GetAssociatedEncryptionDataForComment, isAnonymousComment } from './GetAdditionalEncryptionData'
import type { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import { Comment } from '../Models'
import { ServerTime } from '@proton/docs-shared'
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding'
import metrics from '@proton/metrics'
import type { CommentResponseDto } from '../Api/Types/CommentResponseDto'
import { canKeysSign } from '../Types/DocumentEntitlements'
import type { SignedPlaintextContent } from 'packages/docs-proto'
import type { LoggerInterface } from '@proton/utils/logs'

export class DecryptComment implements UseCaseInterface<Comment> {
  constructor(
    private encryption: EncryptionService<EncryptionContext.PersistentComment>,
    private logger: LoggerInterface,
  ) {}

  async execute(
    dto: CommentResponseDto,
    markId: string,
    keys: DocumentKeys | PublicDocumentKeys,
  ): Promise<Result<Comment>> {
    const emailToUse = dto.AuthorEmail || dto.Author
    const aad = GetAssociatedEncryptionDataForComment({ authorAddress: emailToUse, markId })

    if (!emailToUse && !isAnonymousComment(aad)) {
      return Result.fail('Decryption mismatch; no author email or author address found in private comment')
    }

    const decrypted = await this.encryption.decryptData(
      base64StringToUint8Array(dto.Content),
      aad,
      keys.documentContentKey,
    )

    if (decrypted.isFailed()) {
      metrics.docs_comments_download_error_total.increment({
        reason: 'decryption_error',
      })

      return Result.fail(`Comment decryption failed: ${decrypted.getError()}`)
    }

    const verificationResult = await this.verifySignature(aad, emailToUse, decrypted.getValue(), keys)

    return Result.ok(
      new Comment(
        dto.CommentID,
        new ServerTime(dto.CreateTime),
        new ServerTime(dto.ModifyTime),
        utf8ArrayToString(decrypted.getValue().content as Uint8Array<ArrayBuffer>),
        dto.ParentCommentID,
        emailToUse,
        [],
        false,
        verificationResult,
        dto.Type,
      ),
    )
  }

  async verifySignature(
    aad: string,
    emailToUse: string | undefined,
    content: SignedPlaintextContent,
    keys: DocumentKeys | PublicDocumentKeys,
  ): Promise<CommentVerificationResult> {
    /** Anonymous comments do not have a signature */
    if (isAnonymousComment(aad)) {
      return {
        verified: false,
        verificationAvailable: false,
      }
    }

    /**
     * If we have public keys, it means we are a public viewer, and thus cannot verify signatures because the API to
     * retrieve public keys of signer is not available to us
     */
    if (!canKeysSign(keys)) {
      return {
        verified: false,
        verificationAvailable: false,
      }
    }

    if (!emailToUse) {
      /** This should not be empty at this point. So this is a failed verification. */
      return {
        verified: false,
        verificationAvailable: true,
      }
    }

    const verificationKey = await this.encryption.getVerificationKey(emailToUse)
    if (verificationKey.isFailed()) {
      this.logger.error('Failed to get comment verification key', {
        error: verificationKey.getError(),
      })

      return {
        verified: false,
        verificationAvailable: true,
      }
    }

    const verifyResult = await this.encryption.verifyData(
      content.content as Uint8Array<ArrayBuffer>,
      content.signature as Uint8Array<ArrayBuffer>,
      aad,
      verificationKey.getValue(),
    )
    if (verifyResult.isFailed()) {
      metrics.docs_comments_download_error_total.increment({
        reason: 'decryption_error',
      })

      this.logger.error('Comment verification failed to execute', {
        error: verifyResult.getError(),
      })

      return {
        verified: false,
        verificationAvailable: true,
      }
    }

    const verifyValue = verifyResult.getValue()

    if (verifyValue !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
      metrics.docs_comments_download_error_total.increment({
        reason: 'decryption_error',
      })

      this.logger.info('Comment content verification failed', {
        error: verifyValue,
      })

      return {
        verified: false,
        verificationAvailable: true,
      }
    }

    return {
      verified: true,
    }
  }
}
