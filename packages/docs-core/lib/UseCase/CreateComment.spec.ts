import { Result } from '../Domain/Result/Result'
import type { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { Comment } from '../Models'
import { GenerateUUID } from '../Util/GenerateUuid'
import type { EncryptComment } from './EncryptComment'
import type { LocalCommentsState } from '../Services/Comments/LocalCommentsState'
import { CreateComment } from './CreateComment'
import type { DocsApi } from '../Api/DocsApi'

jest.mock('../Util/GenerateUuid', () => ({
  GenerateUUID: jest.fn(),
}))

const mockEncryptComment = {
  execute: jest.fn(),
} as unknown as jest.Mocked<EncryptComment>

const mockCommentsApi = {
  addCommentToThread: jest.fn(),
} as unknown as jest.Mocked<DocsApi>

const mockCommentsState = {
  findThreadById: jest.fn(),
  addComment: jest.fn(),
  deleteComment: jest.fn(),
  replacePlaceholderComment: jest.fn(),
} as unknown as jest.Mocked<LocalCommentsState>

describe('CreateComment', () => {
  let createComment: CreateComment

  const dto = {
    text: 'Test comment',
    threadID: 'thread-id',
    lookup: { volumeId: 'volume-id', linkId: 'link-id' } as NodeMeta,
    userDisplayName: 'User',
    keys: {
      userOwnAddress: 'foo@bar.com',
    } as DocumentKeys,
    commentsState: mockCommentsState,
    type: 1,
  }

  beforeEach(() => {
    createComment = new CreateComment(
      mockCommentsApi as unknown as DocsApi,
      mockEncryptComment as unknown as EncryptComment,
    )
    ;(GenerateUUID as jest.Mock).mockReturnValue('uuid')
  })

  it('should call encryptComment, api.addCommentToThread, and decryptComment in order', async () => {
    mockCommentsState.findThreadById.mockReturnValue({ markID: 'mark-id' } as never)
    mockEncryptComment.execute.mockResolvedValue(Result.ok('encrypted-comment'))
    mockCommentsApi.addCommentToThread.mockResolvedValue(
      Result.ok({ Comment: { text: 'encrypted-response-comment', AuthorEmail: 'foo@bar.com' } as never, Code: 1000 }),
    )

    await createComment.execute(dto)

    expect(mockCommentsState.findThreadById).toHaveBeenCalledWith('thread-id')
    expect(mockCommentsState.addComment).toHaveBeenCalledWith(expect.any(Comment), 'thread-id')
    expect(mockEncryptComment.execute).toHaveBeenCalledWith('Test comment', 'mark-id', {
      userOwnAddress: 'foo@bar.com',
    })
    expect(mockCommentsApi.addCommentToThread).toHaveBeenCalledWith({
      volumeId: 'volume-id',
      linkId: 'link-id',
      threadId: 'thread-id',
      encryptedContent: 'encrypted-comment',
      parentCommentId: null,
      authorEmail: 'foo@bar.com',
      type: 1,
    })
    expect(mockCommentsState.replacePlaceholderComment).toHaveBeenCalled()
  })

  it('should delete comment if encryption fails', async () => {
    mockCommentsState.findThreadById.mockReturnValue({ markID: 'mark-id' } as never)
    mockEncryptComment.execute.mockResolvedValue(Result.fail('encryption error'))

    const result = await createComment.execute(dto)

    expect(result.isFailed()).toBe(true)
    expect(mockCommentsState.deleteComment).toHaveBeenCalledWith({ commentID: 'uuid', threadID: 'thread-id' })
  })

  it('should delete comment if api call fails', async () => {
    mockCommentsState.findThreadById.mockReturnValue({ markID: 'mark-id' } as never)
    mockEncryptComment.execute.mockResolvedValue(Result.ok('encrypted-comment'))
    mockCommentsApi.addCommentToThread.mockResolvedValue(Result.fail('api error'))

    const result = await createComment.execute(dto)

    expect(result.isFailed()).toBe(true)
    expect(mockCommentsState.deleteComment).toHaveBeenCalledWith({ commentID: 'uuid', threadID: 'thread-id' })
  })
})
