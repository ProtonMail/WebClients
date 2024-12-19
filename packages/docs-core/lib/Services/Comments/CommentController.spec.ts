import { CommentController } from './CommentController'
import type { LoggerInterface } from '@proton/utils/logs'
import { Result, type InternalEventBusInterface } from '@proton/docs-shared'

import type { PrivateKeyReference, SessionKey } from '@proton/crypto'
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
      sendEventMessage: jest.fn(),
    } as unknown as jest.Mocked<WebsocketServiceInterface>

    api = {} as unknown as jest.Mocked<DocsApi>

    eventBus = {
      addEventHandler: jest.fn(),
    } as unknown as jest.Mocked<InternalEventBusInterface>

    logger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerInterface>

    encryptComment = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<EncryptComment>

    createThread = {
      execute: jest.fn().mockReturnValue(
        Result.ok({
          asPayload: jest.fn(),
        }),
      ),
    } as unknown as jest.Mocked<CreateThread>

    createComment = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateComment>

    loadThreads = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<LoadThreads>

    handleRealtimeCommentsEvent = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<HandleRealtimeCommentsEvent>

    const metricService = {
      reportSuggestionsTelemetry: jest.fn(),
      reportSuggestionCreated: jest.fn(),
    } as unknown as jest.Mocked<MetricService>

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

  it('should refetch all comments upon websocket reconnection', async () => {
    controller.fetchAllComments = jest.fn()

    await controller.handleEvent({
      type: WebsocketConnectionEvent.ConnectionEstablishedButNotYetReady,
      payload: undefined,
    })

    expect(controller.fetchAllComments).toHaveBeenCalled()
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
