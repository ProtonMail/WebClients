import { ApiResult, Result } from '@proton/docs-shared'
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
import type { LoggerInterface } from '@proton/utils/logs'
import type { DocumentEntitlements } from '../Types/DocumentEntitlements'

jest.mock('../Util/GenerateUuid', () => ({
  GenerateUUID: jest.fn(),
}))

jest.mock('@proton/docs-shared', () => ({
  ...jest.requireActual('@proton/docs-shared'),
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

const logger = {
  error: jest.fn(),
} as unknown as jest.Mocked<LoggerInterface>

const mockEventBus = {
  publish: jest.fn(),
}

describe('CreateThread', () => {
  let createThread: CreateThread

  const entitlements = {
    nodeMeta: { volumeId: 'volume-id', linkId: 'link-id' } as NodeMeta,
    keys: {
      userOwnAddress: 'foo@bar.com',
    } as unknown as DocumentKeys,
  } as unknown as DocumentEntitlements

  const dto = {
    decryptedDocumentName: 'Test',
    text: 'Test comment',
    entitlements,
    commentsState: mockCommentsState as unknown as LocalCommentsState,
    type: 1,
  }

  beforeEach(() => {
    createThread = new CreateThread(
      mockCommentsApi as unknown as DocsApi,
      mockEncryptComment as unknown as EncryptComment,
      mockDecryptComment as unknown as DecryptComment,
      mockEventBus as unknown as InternalEventBusInterface,
      logger,
    )
    ;(GenerateUUID as jest.Mock).mockReturnValue('uuid')
    ServerTime.now = jest.fn()
    ;(ServerTime.now as jest.Mock).mockReturnValue(new Date())
  })

  it('should create mark node, call encryptComment, api.createThread, and decryptComment in order', async () => {
    mockEncryptComment.execute.mockResolvedValue(Result.ok('encrypted-comment'))
    mockCommentsApi.createThread.mockResolvedValue(
      ApiResult.ok({
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
    expect(mockCommentsApi.createThread).toHaveBeenCalledWith(
      {
        commentType: 1,
        decryptedDocumentName: 'Test',
        encryptedMainCommentContent: 'encrypted-comment',
        markId: 'uuid',
        type: 1,
      },
      entitlements,
    )
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
    mockCommentsApi.createThread.mockResolvedValue(ApiResult.fail({ message: 'api error', code: 0 }))

    const result = await createThread.execute(dto)

    expect(result.isFailed()).toBe(true)
    expect(mockCommentsState.deleteThread).toHaveBeenCalledWith('uuid')
  })
})
