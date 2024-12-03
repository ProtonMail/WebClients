import { CommentType } from '@proton/docs-shared'
import { DecryptComment } from './DecryptComment'
import { Result } from '@proton/docs-shared'
import type { CommentResponseDto } from '../Api/Types/CommentResponseDto'
import type { DocumentKeys } from '@proton/drive-store'
import type { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import type { EncryptionService } from '../Services/Encryption/EncryptionService'
import type { PublicDocumentKeys } from '../Types/DocumentEntitlements'

describe('DecryptComment', () => {
  let decryptComment: DecryptComment
  let encryptionSerivce: EncryptionService<EncryptionContext.PersistentComment>

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
    decryptComment = new DecryptComment(encryptionSerivce)
  })

  it('should decrypt data', async () => {
    await decryptComment.execute(dto, markId, privateKeys)

    expect(encryptionSerivce.decryptData).toHaveBeenCalled()
  })

  it('should fetch verification key', async () => {
    await decryptComment.execute(dto, markId, privateKeys)

    expect(encryptionSerivce.getVerificationKey).toHaveBeenCalled()
  })

  it('should fail if cannot fetch verification key', async () => {
    ;(encryptionSerivce.getVerificationKey as jest.Mock).mockReturnValue(Result.fail('error'))

    const result = await decryptComment.execute(dto, markId, privateKeys)

    expect(result.isFailed()).toBeTruthy()
  })

  it('should verify data', async () => {
    await decryptComment.execute(dto, markId, privateKeys)

    expect(encryptionSerivce.verifyData).toHaveBeenCalled()
  })

  it('should fail if verification fails', async () => {
    ;(encryptionSerivce.verifyData as jest.Mock).mockReturnValue(Result.fail('error'))

    const result = await decryptComment.execute(dto, markId, privateKeys)

    expect(result.isFailed()).toBeTruthy()
  })

  it('should not verify if public viewer/editor', async () => {
    encryptionSerivce.verifyData = jest.fn()

    const result = await decryptComment.execute(dto, markId, publicKeys)

    expect(encryptionSerivce.verifyData).not.toHaveBeenCalled()

    expect(result.isFailed()).toBeFalsy()
  })
})
