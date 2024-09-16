import { Result } from '../Domain/Result/Result'
import type { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { CommentThread } from '../Models'
import type { InternalEventBusInterface } from '@proton/docs-shared'
import { ServerTime } from '@proton/docs-shared'
import { GenerateUUID } from '../Util/GenerateUuid'
import type { EncryptComment } from './EncryptComment'
import type { DecryptComment } from './DecryptComment'
import type { LocalCommentsState } from '../Services/Comments/LocalCommentsState'
import { CreateThread } from './CreateThread'
import type { DocsApi } from '../Api/DocsApi'

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
} as unknown as jest.Mocked<EncryptComment>

const mockDecryptComment = {
  execute: jest.fn(),
} as unknown as jest.Mocked<DecryptComment>

const mockCommentsApi = {
  createThread: jest.fn(),
} as unknown as jest.Mocked<DocsApi>

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
    authorEmail: 'User',
    keys: {
      userOwnAddress: 'foo@bar.com',
    } as unknown as DocumentKeys,
    commentsState: mockCommentsState as unknown as LocalCommentsState,
    type: 1,
  }

  beforeEach(() => {
    createThread = new CreateThread(
      mockCommentsApi as unknown as DocsApi,
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
        } as never,
        Code: 1000,
      }),
    )
    mockDecryptComment.execute.mockResolvedValue(Result.ok({ id: 'uuid', text: 'decrypted comment' } as never))

    await createThread.execute(dto)

    expect(mockCommentsState.addThread).toHaveBeenCalledWith(expect.any(CommentThread))
    expect(mockEncryptComment.execute).toHaveBeenCalledWith('Test comment', 'uuid', {
      userOwnAddress: 'foo@bar.com',
    })
    expect(mockCommentsApi.createThread).toHaveBeenCalledWith({
      volumeId: 'volume-id',
      linkId: 'link-id',
      markId: 'uuid',
      encryptedMainCommentContent: 'encrypted-comment',
      authorEmail: 'foo@bar.com',
      type: 1,
    })
    expect(mockDecryptComment.execute).toHaveBeenCalledWith('encrypted-response-comment', 'mark-id', {
      userOwnAddress: 'foo@bar.com',
    })
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
