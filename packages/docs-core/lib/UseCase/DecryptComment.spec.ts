import { CommentType } from '@proton/docs-shared'
import { DecryptComment } from './DecryptComment'
import { Result } from '@proton/docs-shared'
import { VERIFICATION_STATUS } from '@proton/crypto'
import type { CommentResponseDto } from '../Api/Types/CommentResponseDto'
import type { DocumentKeys } from '@proton/drive-store'
import type { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import type { EncryptionService } from '../Services/Encryption/EncryptionService'
import type { LoggerInterface } from '@proton/utils/logs'
import type { PublicDocumentKeys } from '../Types/DocumentEntitlements'
import type { SignedPlaintextContent } from '@proton/docs-proto'

jest.mock('./GetAdditionalEncryptionData', () => ({
  ...jest.requireActual('./GetAdditionalEncryptionData'),
  isAnonymousComment: jest.fn().mockReturnValue(false),
}))

describe('DecryptComment', () => {
  let decryptComment: DecryptComment
  let encryptionSerivce: EncryptionService<EncryptionContext.PersistentComment>
  let logger: LoggerInterface

  const comments: CommentResponseDto[] = []

  const dto: CommentResponseDto = {
    CommentID: 'uuid',
    CreateTime: 0,
    ModifyTime: 0,
    Content: 'string',
    Author: 'string',
    AuthorEmail: 'string',
    ParentCommentID: 'string',
    Comments: comments,
    Type: CommentType.Comment,
  }

  const privateKeys = {
    documentContentKey: '',
    userOwnAddress: '',
    userAddressPrivateKey: '',
  } as unknown as DocumentKeys

  const publicKeys = {
    documentContentKey: '',
  } as unknown as PublicDocumentKeys

  const markId = 'markId'

  beforeEach(() => {
    encryptionSerivce = {
      decryptData: jest.fn().mockReturnValue(Result.ok({ content: new Uint8Array(), signature: new Uint8Array() })),
      getVerificationKey: jest.fn().mockReturnValue(Result.ok(new Uint8Array())),
      verifyData: jest.fn().mockReturnValue(Result.ok(2)),
    } as unknown as jest.Mocked<EncryptionService<EncryptionContext.PersistentComment>>

    logger = {
      error: jest.fn(),
      info: jest.fn(),
    } as unknown as jest.Mocked<LoggerInterface>

    decryptComment = new DecryptComment(encryptionSerivce, logger)
  })

  it('should decrypt data', async () => {
    await decryptComment.execute(dto, markId, privateKeys)

    expect(encryptionSerivce.decryptData).toHaveBeenCalled()
  })

  it('should fetch verification key', async () => {
    await decryptComment.execute(dto, markId, privateKeys)

    expect(encryptionSerivce.getVerificationKey).toHaveBeenCalled()
  })

  it('should verify data', async () => {
    await decryptComment.execute(dto, markId, privateKeys)

    expect(encryptionSerivce.verifyData).toHaveBeenCalled()
  })

  it('should succeed if verification fails', async () => {
    ;(encryptionSerivce.verifyData as jest.Mock).mockReturnValue(Result.fail('error'))

    const result = await decryptComment.execute(dto, markId, privateKeys)

    expect(result.isFailed()).toBeFalsy()
  })

  it('should not verify if public viewer/editor', async () => {
    encryptionSerivce.verifyData = jest.fn()

    const result = await decryptComment.execute(dto, markId, publicKeys)

    expect(encryptionSerivce.verifyData).not.toHaveBeenCalled()

    expect(result.isFailed()).toBeFalsy()
  })

  describe('verifySignature', () => {
    const content = {
      content: new Uint8Array(),
      signature: new Uint8Array(),
    } as unknown as SignedPlaintextContent

    it('should return unverified for anonymous comments', async () => {
      const { isAnonymousComment } = require('./GetAdditionalEncryptionData')
      ;(isAnonymousComment as jest.Mock).mockReturnValue(true)

      const result = await decryptComment.verifySignature('aad', 'email@test.com', content, privateKeys)

      expect(result).toEqual({
        verified: false,
        verificationAvailable: false,
      })
    })

    it('should return unverified for public keys', async () => {
      const { isAnonymousComment } = require('./GetAdditionalEncryptionData')
      ;(isAnonymousComment as jest.Mock).mockReturnValue(false)

      const result = await decryptComment.verifySignature('aad', 'email@test.com', content, publicKeys)

      expect(result).toEqual({
        verified: false,
        verificationAvailable: false,
      })
    })

    it('should return failed verification when email is missing', async () => {
      const { isAnonymousComment } = require('./GetAdditionalEncryptionData')
      ;(isAnonymousComment as jest.Mock).mockReturnValue(false)

      const result = await decryptComment.verifySignature('aad', undefined, content, privateKeys)

      expect(result).toEqual({
        verified: false,
        verificationAvailable: true,
      })
    })

    it('should return failed verification when verification key cannot be retrieved', async () => {
      const { isAnonymousComment } = require('./GetAdditionalEncryptionData')
      ;(isAnonymousComment as jest.Mock).mockReturnValue(false)
      ;(encryptionSerivce.getVerificationKey as jest.Mock).mockReturnValue(Result.fail('error'))

      const result = await decryptComment.verifySignature('aad', 'email@test.com', content, privateKeys)

      expect(result).toEqual({
        verified: false,
        verificationAvailable: true,
      })
      expect(logger.error).toHaveBeenCalledWith('Failed to get comment verification key', {
        error: 'error',
      })
    })

    it('should return failed verification when verify operation fails', async () => {
      const { isAnonymousComment } = require('./GetAdditionalEncryptionData')
      ;(isAnonymousComment as jest.Mock).mockReturnValue(false)
      ;(encryptionSerivce.verifyData as jest.Mock).mockReturnValue(Result.fail('error'))

      const result = await decryptComment.verifySignature('aad', 'email@test.com', content, privateKeys)

      expect(result).toEqual({
        verified: false,
        verificationAvailable: true,
      })
      expect(logger.error).toHaveBeenCalledWith('Comment verification failed to execute', {
        error: 'error',
      })
    })

    it('should return failed verification when verification status is not valid', async () => {
      const { isAnonymousComment } = require('./GetAdditionalEncryptionData')
      ;(isAnonymousComment as jest.Mock).mockReturnValue(false)
      ;(encryptionSerivce.verifyData as jest.Mock).mockReturnValue(Result.ok(VERIFICATION_STATUS.NOT_SIGNED))

      const result = await decryptComment.verifySignature('aad', 'email@test.com', content, privateKeys)

      expect(result).toEqual({
        verified: false,
        verificationAvailable: true,
      })
      expect(logger.info).toHaveBeenCalledWith('Comment content verification failed', {
        error: VERIFICATION_STATUS.NOT_SIGNED,
      })
    })

    it('should return successful verification when everything is valid', async () => {
      const { isAnonymousComment } = require('./GetAdditionalEncryptionData')
      ;(isAnonymousComment as jest.Mock).mockReturnValue(false)
      ;(encryptionSerivce.verifyData as jest.Mock).mockReturnValue(Result.ok(VERIFICATION_STATUS.SIGNED_AND_VALID))

      const result = await decryptComment.verifySignature('aad', 'email@test.com', content, privateKeys)

      expect(result).toEqual({
        verified: true,
      })
    })
  })
})
