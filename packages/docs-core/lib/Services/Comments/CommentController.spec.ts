import type { Mocked } from 'vitest'
import { CommentController } from './CommentController'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { InternalEventBusInterface } from '@proton/docs-shared/Events/InternalEventBusInterface'
import { Result } from '@proton/docs-shared/Result'

import type { PrivateKeyReference, SessionKey } from '@protontech/crypto'
import type { WebsocketServiceInterface } from '../Websockets/WebsocketServiceInterface'
import type { DocsApi } from '../../Api/DocsApi'
import type { EncryptComment } from '../../UseCase/EncryptComment'
import type { CreateThread } from '../../UseCase/CreateThread'
import type { CreateComment } from '../../UseCase/CreateComment'
import type { LoadThreads } from '../../UseCase/LoadThreads'
import type { HandleRealtimeCommentsEvent } from '../../UseCase/HandleRealtimeCommentsEvent'
import { WebsocketConnectionEvent } from '../../Realtime/WebsocketEvent/WebsocketConnectionEvent'
import type { MetricService } from '../Metrics/MetricService'
import type { DocumentStateValues } from '../../State/DocumentState'
import { DocumentState } from '../../State/DocumentState'

describe('CommentController', () => {
  let controller: CommentController

  let encryptComment: EncryptComment
  let createThread: CreateThread
  let createComment: CreateComment
  let loadThreads: LoadThreads

  let websocketService: WebsocketServiceInterface
  let eventBus: InternalEventBusInterface
  let api: DocsApi
  let logger: LoggerInterface
  let handleRealtimeCommentsEvent: HandleRealtimeCommentsEvent
  let documentState: DocumentState

  beforeEach(() => {
    websocketService = {
      sendEventMessage: vi.fn(),
    } as unknown as Mocked<WebsocketServiceInterface>

    api = {} as unknown as Mocked<DocsApi>

    eventBus = {
      addEventHandler: vi.fn(),
    } as unknown as Mocked<InternalEventBusInterface>

    logger = {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    } as unknown as Mocked<LoggerInterface>

    encryptComment = {
      execute: vi.fn(),
    } as unknown as Mocked<EncryptComment>

    createThread = {
      execute: vi.fn().mockReturnValue(
        Result.ok({
          asPayload: vi.fn(),
        }),
      ),
    } as unknown as Mocked<CreateThread>

    createComment = {
      execute: vi.fn(),
    } as unknown as Mocked<CreateComment>

    loadThreads = {
      execute: vi.fn(),
    } as unknown as Mocked<LoadThreads>

    handleRealtimeCommentsEvent = {
      execute: vi.fn(),
    } as unknown as Mocked<HandleRealtimeCommentsEvent>

    const metricService = {
      reportSuggestionsTelemetry: vi.fn(),
      reportSuggestionCreated: vi.fn(),
    } as unknown as Mocked<MetricService>

    documentState = new DocumentState({
      ...DocumentState.defaults,
      documentName: 'document-name',
      documentMeta: {},
      entitlements: {
        nodeMeta: { linkId: 'link-id-123', volumeId: 'volume-id-456' },
        keys: {
          documentContentKey: 'key-123' as unknown as SessionKey,
          userAddressPrivateKey: 'private-key-123' as unknown as PrivateKeyReference,
          userOwnAddress: 'foo',
        },
      },
    } as DocumentStateValues)

    controller = new CommentController(
      documentState,
      websocketService,
      metricService,
      api,
      encryptComment,
      createThread,
      createComment,
      loadThreads,
      handleRealtimeCommentsEvent,
      eventBus,
      logger,
    )
  })

  it('should not refetch all comments on the first websocket connection', async () => {
    controller.fetchAllComments = vi.fn()

    await controller.handleEvent({
      type: WebsocketConnectionEvent.ConnectionEstablishedButNotYetReady,
      payload: undefined,
    })

    expect(controller.fetchAllComments).not.toHaveBeenCalled()
  })

  it('should refetch all comments upon websocket reconnection', async () => {
    controller.fetchAllComments = vi.fn()

    await controller.handleEvent({
      type: WebsocketConnectionEvent.ConnectionEstablishedButNotYetReady,
      payload: undefined,
    })

    await controller.handleEvent({
      type: WebsocketConnectionEvent.ConnectionEstablishedButNotYetReady,
      payload: undefined,
    })

    expect(controller.fetchAllComments).toHaveBeenCalledTimes(1)
  })

  describe('shouldSendDocumentName', () => {
    it('should be false when currentDocumentEmailDocTitleEnabled is false', () => {
      documentState.setProperty('currentDocumentEmailDocTitleEnabled', false)

      expect(controller.shouldSendDocumentName).toBe(false)
    })

    it('should be true when currentDocumentEmailDocTitleEnabled is true', () => {
      documentState.setProperty('currentDocumentEmailDocTitleEnabled', true)

      expect(controller.shouldSendDocumentName).toBe(true)
    })
  })

  describe('createCommentThread', () => {
    it('should send the document name when currentDocumentEmailDocTitleEnabled is true', async () => {
      documentState.setProperty('currentDocumentEmailDocTitleEnabled', true)

      await controller.createCommentThread('comment-content')

      expect(createThread.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          decryptedDocumentName: 'document-name',
        }),
      )
    })

    it('should not send the document name when currentDocumentEmailDocTitleEnabled is false', async () => {
      documentState.setProperty('currentDocumentEmailDocTitleEnabled', false)

      await controller.createCommentThread('comment-content')

      expect(createThread.execute).toHaveBeenCalledWith(
        expect.not.objectContaining({
          decryptedDocumentName: 'document-name',
        }),
      )
    })
  })

  describe('createSuggestionThread', () => {
    it('should send the document name when currentDocumentEmailDocTitleEnabled is true', async () => {
      documentState.setProperty('currentDocumentEmailDocTitleEnabled', true)

      await controller.createSuggestionThread('suggestion-id', 'comment-content', 'replace')

      expect(createThread.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          decryptedDocumentName: 'document-name',
        }),
      )
    })

    it('should not send the document name when currentDocumentEmailDocTitleEnabled is false', async () => {
      documentState.setProperty('currentDocumentEmailDocTitleEnabled', false)

      await controller.createSuggestionThread('suggestion-id', 'comment-content', 'replace')

      expect(createThread.execute).toHaveBeenCalledWith(
        expect.not.objectContaining({
          decryptedDocumentName: 'document-name',
        }),
      )
    })
  })
})
