import { CommentResponseDto } from './../Api/Comments/Types'
import { Result } from '@standardnotes/domain-core'
import { DocumentKeys } from '@proton/drive-store'
import { DecryptComment } from './DecryptComment'
import { EncryptionService } from '../Services/Encryption/EncryptionService'
import { EncryptionContext } from '../Services/Encryption/EncryptionContext'

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
    ParentCommentID: 'string',
    Comments: comments,
  }

  const keys = {} as DocumentKeys
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
    await decryptComment.execute(dto, markId, keys)

    expect(encryptionSerivce.decryptData).toHaveBeenCalled()
  })

  it('should fetch verification key', async () => {
    await decryptComment.execute(dto, markId, keys)

    expect(encryptionSerivce.getVerificationKey).toHaveBeenCalled()
  })

  it('should fail if cannot fetch verification key', async () => {
    ;(encryptionSerivce.getVerificationKey as jest.Mock).mockReturnValue(Result.fail('error'))

    const result = await decryptComment.execute(dto, markId, keys)

    expect(result.isFailed()).toBeTruthy()
  })

  it('should verify data', async () => {
    await decryptComment.execute(dto, markId, keys)

    expect(encryptionSerivce.verifyData).toHaveBeenCalled()
  })

  it('should fail if verification fails', async () => {
    ;(encryptionSerivce.verifyData as jest.Mock).mockReturnValue(Result.fail('error'))

    const result = await decryptComment.execute(dto, markId, keys)

    expect(result.isFailed()).toBeTruthy()
  })
})
