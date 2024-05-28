import { Result } from '@standardnotes/domain-core'
import { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { CommentThread } from '../Models'
import { InternalEventBusInterface, ServerTime } from '@proton/docs-shared'
import { GenerateUUID } from '../Util/GenerateUuid'
import { EncryptComment } from './EncryptComment'
import { DecryptComment } from './DecryptComment'
import { LocalCommentsState } from '../Services/Comments/LocalCommentsState'
import { CommentsApi } from '../Api/Comments/CommentsApi'
import { CreateThread } from './CreateThread'

jest.mock('../Util/GenerateUuid', () => ({
  GenerateUUID: jest.fn(),
}))

jest.mock('@proton/docs-shared', () => ({
  ServerTime: jest.fn().mockImplementation(() => ({})),
  CommentThreadState: {
    Active: 'Active',
  },
  CommentsEvent: {
    CreateMarkNode: 'CreateMarkNode',
  },
}))

const mockEncryptComment = {
  execute: jest.fn(),
}

const mockDecryptComment = {
  execute: jest.fn(),
}

const mockCommentsApi = {
  createThread: jest.fn(),
}

const mockCommentsState = {
  findThreadById: jest.fn(),
  addThread: jest.fn(),
  deleteThread: jest.fn(),
  replacePlaceholderThread: jest.fn(),
}

const mockEventBus = {
  publish: jest.fn(),
}

describe('CreateThread', () => {
  let createThread: CreateThread

  const dto = {
    text: 'Test comment',
    lookup: { volumeId: 'volume-id', linkId: 'link-id' } as NodeMeta,
    userDisplayName: 'User',
    keys: {} as DocumentKeys,
    commentsState: mockCommentsState as unknown as LocalCommentsState,
  }

  beforeEach(() => {
    createThread = new CreateThread(
      mockCommentsApi as unknown as CommentsApi,
      mockEncryptComment as unknown as EncryptComment,
      mockDecryptComment as unknown as DecryptComment,
      mockEventBus as unknown as InternalEventBusInterface,
    )
    ;(GenerateUUID as jest.Mock).mockReturnValue('uuid')
    ServerTime.now = jest.fn()
    ;(ServerTime.now as jest.Mock).mockReturnValue(new Date())
  })

  it('should create mark node, call encryptComment, api.createThread, and decryptComment in order', async () => {
    mockEncryptComment.execute.mockResolvedValue(Result.ok('encrypted-comment'))
    mockCommentsApi.createThread.mockResolvedValue(
      Result.ok({
        CommentThread: {
          CommentThreadID: 'thread-id',
          Mark: 'mark-id',
          Comments: ['encrypted-response-comment'],
        },
      }),
    )
    mockDecryptComment.execute.mockResolvedValue(Result.ok({ id: 'uuid', text: 'decrypted comment' }))

    await createThread.execute(dto)

    expect(mockCommentsState.addThread).toHaveBeenCalledWith(expect.any(CommentThread))
    expect(mockEncryptComment.execute).toHaveBeenCalledWith('Test comment', 'uuid', {})
    expect(mockCommentsApi.createThread).toHaveBeenCalledWith('volume-id', 'link-id', 'uuid', 'encrypted-comment')
    expect(mockDecryptComment.execute).toHaveBeenCalledWith('encrypted-response-comment', 'mark-id', {})
    expect(mockCommentsState.replacePlaceholderThread).toHaveBeenCalledWith('uuid', expect.any(CommentThread))
  })

  it('should delete comment if encryption fails', async () => {
    mockCommentsState.findThreadById.mockReturnValue({ markID: 'mark-id' })
    mockEncryptComment.execute.mockResolvedValue(Result.fail('encryption error'))

    const result = await createThread.execute(dto)

    expect(result.isFailed()).toBe(true)
    expect(mockCommentsState.deleteThread).toHaveBeenCalledWith('uuid')
  })

  it('should delete comment if api call fails', async () => {
    mockCommentsState.findThreadById.mockReturnValue({ markID: 'mark-id' })
    mockEncryptComment.execute.mockResolvedValue(Result.ok('encrypted-comment'))
    mockCommentsApi.createThread.mockResolvedValue(Result.fail('api error'))

    const result = await createThread.execute(dto)

    expect(result.isFailed()).toBe(true)
    expect(mockCommentsState.deleteThread).toHaveBeenCalledWith('uuid')
  })
})
