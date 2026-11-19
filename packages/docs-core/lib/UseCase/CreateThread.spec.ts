import type { Mock, Mocked } from 'vitest'
import { ApiResult } from '@proton/docs-shared/ApiResult'
import type { NodeMeta } from '@proton/docs-shared/BasicTypes'
import type { InternalEventBusInterface } from '@proton/docs-shared/Events/InternalEventBusInterface'
import { GenerateUUID } from '@proton/docs-shared/GenerateUuid'
import { Result } from '@proton/docs-shared/Result'
import { ServerTime } from '@proton/docs-shared/ServerTime'
import type { DocumentKeys } from '@proton/docs-shared/CryptoTypes'
import { CommentThread } from '../Models/CommentThread'
import type { EncryptComment } from './EncryptComment'
import type { DecryptComment } from './DecryptComment'
import type { LocalCommentsState } from '../Services/Comments/LocalCommentsState'
import { CreateThread } from './CreateThread'
import type { DocsApi } from '../Api/DocsApi'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { DocumentEntitlements } from '../Types/DocumentEntitlements'

vi.mock('@proton/docs-shared/GenerateUuid', async () => ({
  ...(await vi.importActual('@proton/docs-shared/GenerateUuid')),
  GenerateUUID: vi.fn(),
}))

vi.mock('@proton/docs-shared/ServerTime', async () => ({
  ...(await vi.importActual('@proton/docs-shared/ServerTime')),
  ServerTime: vi.fn().mockImplementation(function () {
    return {}
  }),
}))

vi.mock('@proton/docs-shared/CommentThreadState', async () => ({
  ...(await vi.importActual('@proton/docs-shared/CommentThreadState')),
  CommentThreadState: {
    Active: 'Active',
  },
}))

vi.mock('@proton/docs-shared/CommentsEvent', async () => ({
  ...(await vi.importActual('@proton/docs-shared/CommentsEvent')),
  CommentsEvent: {
    CreateMarkNode: 'CreateMarkNode',
  },
}))

const mockEncryptComment = {
  execute: vi.fn(),
} as unknown as Mocked<EncryptComment>

const mockDecryptComment = {
  execute: vi.fn(),
} as unknown as Mocked<DecryptComment>

const mockCommentsApi = {
  createThread: vi.fn(),
} as unknown as Mocked<DocsApi>

const mockCommentsState = {
  findThreadById: vi.fn(),
  addThread: vi.fn(),
  deleteThread: vi.fn(),
  replacePlaceholderThread: vi.fn(),
}

const logger = {
  error: vi.fn(),
} as unknown as Mocked<LoggerInterface>

const mockEventBus = {
  publish: vi.fn(),
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
    ;(GenerateUUID as Mock).mockReturnValue('uuid')
    ServerTime.now = vi.fn()
    ;(ServerTime.now as Mock).mockReturnValue(new Date())
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
