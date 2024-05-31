import { Result } from '@standardnotes/domain-core'
import { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { Comment } from '../Models'
import { ServerTime } from '@proton/docs-shared'
import { GenerateUUID } from '../Util/GenerateUuid'
import { EncryptComment } from './EncryptComment'
import { LocalCommentsState } from '../Services/Comments/LocalCommentsState'
import { CommentsApi } from '../Api/Comments/CommentsApi'
import { CreateComment } from './CreateComment'

jest.mock('../Util/GenerateUuid', () => ({
  GenerateUUID: jest.fn(),
}))

jest.mock('@proton/docs-shared', () => ({
  ServerTime: {
    now: jest.fn(),
  },
}))

const mockEncryptComment = {
  execute: jest.fn(),
}

const mockCommentsApi = {
  addCommentToThread: jest.fn(),
}

const mockCommentsState = {
  findThreadById: jest.fn(),
  addComment: jest.fn(),
  deleteComment: jest.fn(),
  replacePlaceholderComment: jest.fn(),
}

describe('CreateComment', () => {
  let createComment: CreateComment

  const dto = {
    text: 'Test comment',
    threadID: 'thread-id',
    lookup: { volumeId: 'volume-id', linkId: 'link-id' } as NodeMeta,
    userDisplayName: 'User',
    keys: {} as DocumentKeys,
    commentsState: mockCommentsState as unknown as LocalCommentsState,
  }

  beforeEach(() => {
    createComment = new CreateComment(
      mockCommentsApi as unknown as CommentsApi,
      mockEncryptComment as unknown as EncryptComment,
    )
    ;(GenerateUUID as jest.Mock).mockReturnValue('uuid')
    ;(ServerTime.now as jest.Mock).mockReturnValue(new Date())
  })

  it('should call encryptComment, api.addCommentToThread, and decryptComment in order', async () => {
    mockCommentsState.findThreadById.mockReturnValue({ markID: 'mark-id' })
    mockEncryptComment.execute.mockResolvedValue(Result.ok('encrypted-comment'))
    mockCommentsApi.addCommentToThread.mockResolvedValue(Result.ok({ Comment: 'encrypted-response-comment' }))

    await createComment.execute(dto)

    expect(mockCommentsState.findThreadById).toHaveBeenCalledWith('thread-id')
    expect(mockCommentsState.addComment).toHaveBeenCalledWith(expect.any(Comment), 'thread-id')
    expect(mockEncryptComment.execute).toHaveBeenCalledWith('Test comment', 'mark-id', {})
    expect(mockCommentsApi.addCommentToThread).toHaveBeenCalledWith(
      'volume-id',
      'link-id',
      'thread-id',
      'encrypted-comment',
      null,
    )
    expect(mockCommentsState.replacePlaceholderComment).toHaveBeenCalledWith('uuid', {
      id: 'uuid',
      text: 'decrypted comment',
    })
  })

  it('should delete comment if encryption fails', async () => {
    mockCommentsState.findThreadById.mockReturnValue({ markID: 'mark-id' })
    mockEncryptComment.execute.mockResolvedValue(Result.fail('encryption error'))

    const result = await createComment.execute(dto)

    expect(result.isFailed()).toBe(true)
    expect(mockCommentsState.deleteComment).toHaveBeenCalledWith({ commentID: 'uuid', threadID: 'thread-id' })
  })

  it('should delete comment if api call fails', async () => {
    mockCommentsState.findThreadById.mockReturnValue({ markID: 'mark-id' })
    mockEncryptComment.execute.mockResolvedValue(Result.ok('encrypted-comment'))
    mockCommentsApi.addCommentToThread.mockResolvedValue(Result.fail('api error'))

    const result = await createComment.execute(dto)

    expect(result.isFailed()).toBe(true)
    expect(mockCommentsState.deleteComment).toHaveBeenCalledWith({ commentID: 'uuid', threadID: 'thread-id' })
  })
})
