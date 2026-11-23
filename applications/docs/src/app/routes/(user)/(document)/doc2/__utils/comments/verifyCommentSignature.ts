import { CryptoProxy, type PublicKeyReference, VERIFICATION_STATUS } from '@protontech/crypto'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { VerifyCommentSignature } from '@proton-docs/realtime-sdk'

/**
 * The SDK's check of a comment's signature: the author's keys, looked up as /doc does, verify the detached signature
 * with its context required. Any failure reads `invalid`, as on /doc. Adapted from
 * `packages/docs-core/lib/UseCase/DecryptComment.ts`, its `verifySignature`, which doc2 must not import.
 */
export function createVerifyCommentSignature(
  getVerificationKey: (email: string) => Promise<PublicKeyReference[]>,
  logger: Pick<LoggerInterface, 'error' | 'info'>,
): VerifyCommentSignature {
  return async ({ plaintext, signature, signatureContext, authorAddress }) => {
    let verificationKeys: PublicKeyReference[]
    try {
      verificationKeys = await getVerificationKey(authorAddress)
    } catch (error) {
      logger.error('Failed to get comment verification key', error as Error)
      return 'invalid'
    }

    try {
      // Adapted from `packages/docs-core/lib/Services/Encryption/EncryptionService.ts`, its `verifyData`, which takes the
      // context's suffix where the SDK gives the whole context.
      const { verificationStatus } = await CryptoProxy.verifyMessage({
        binaryData: plaintext,
        binarySignature: signature,
        verificationKeys,
        signatureContext: { value: signatureContext, required: true },
        format: 'binary',
      })
      if (verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        logger.info('Comment content verification failed', { verificationStatus })
        return 'invalid'
      }
      return 'verified'
    } catch (error) {
      logger.error('Comment verification failed to execute', error as Error)
      return 'invalid'
    }
  }
}
