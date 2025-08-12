const mockAssertUnreachableAndLog = jest.fn()
jest.mock('@proton/docs-shared', () => ({
  ...jest.requireActual('@proton/docs-shared'),
  assertUnreachableAndLog: (...args: any[]) => mockAssertUnreachableAndLog(...args),
}))

import type {
  DocumentMetaInterface,
  InternalEventBusInterface,
  InternalEventInterface,
  RtsMessagePayload,
  WebsocketConnectionInterface,
} from '@proton/docs-shared'
import { ApiResult, DecryptedMessage, Result } from '@proton/docs-shared'
import { BroadcastSource, DocumentRole } from '@proton/docs-shared'
import type { DecryptedNode, NodeMeta } from '@proton/drive-store'
import { MAX_DOC_SIZE, MAX_UPDATE_SIZE } from '../Models/Constants'
import type { WebsocketServiceInterface } from '../Services/Websockets/WebsocketServiceInterface'
import {
  MAX_MS_TO_WAIT_FOR_RTS_CONNECTION_BEFORE_DISPLAYING_EDITOR,
  MAX_MS_TO_WAIT_FOR_RTS_SYNC_AFTER_CONNECT,
  RealtimeController,
} from './RealtimeController'
import type { LoggerInterface } from '@proton/utils/logs'
import { ProcessedIncomingRealtimeEventMessage } from '@proton/docs-shared'
import { ConnectionCloseReason, EventTypeEnum } from '@proton/docs-proto'
import type { DocumentEntitlements } from '../Types/DocumentEntitlements'
import type { AckLedgerInterface } from '../Services/Websockets/AckLedger/AckLedgerInterface'
import type { DocumentStateValues } from '../State/DocumentState'
import { DocumentState } from '../State/DocumentState'
import { DocSizeTracker } from '../SizeTracker/SizeTracker'
import type { DecryptedCommit } from '../Models/DecryptedCommit'
import { WebsocketConnectionEvent } from '../Realtime/WebsocketEvent/WebsocketConnectionEvent'
import { DocControllerEvent } from '../AuthenticatedDocController/AuthenticatedDocControllerEvent'
import type { GetDocumentMeta } from '../UseCase/GetDocumentMeta'
import type { FetchDecryptedCommit } from '../UseCase/FetchDecryptedCommit'
import type { UnleashClient } from '@proton/unleash'

describe('RealtimeController', () => {
  let controller: RealtimeController
  let documentState: DocumentState
  let websocketService: jest.Mocked<WebsocketServiceInterface>
  let logger: jest.Mocked<LoggerInterface>
  let eventBus: jest.Mocked<InternalEventBusInterface>

  beforeEach(async () => {
    jest.useFakeTimers()

    documentState = new DocumentState({
      ...DocumentState.defaults,
      documentMeta: {
        latestCommitId: () => '123',
      } as unknown as DocumentMetaInterface,
      entitlements: { keys: {}, role: new DocumentRole('Editor'), nodeMeta: {} } as unknown as DocumentEntitlements,
      decryptedNode: {} as DecryptedNode,
    } as DocumentStateValues)

    websocketService = {
      createConnection: jest.fn().mockReturnValue({ connect: jest.fn().mockResolvedValue(true) }),
      sendDocumentUpdateMessage: jest.fn(),
      flushPendingUpdates: jest.fn(),
      reconnectToDocumentWithoutDelay: jest.fn(),
      closeConnection: jest.fn(),
      sendEventMessage: jest.fn(),
      debugSendCommitCommandToRTS: jest.fn(),
      isConnected: jest.fn(),
      setDocumentType: jest.fn(),
    } as unknown as jest.Mocked<WebsocketServiceInterface>

    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerInterface>

    eventBus = {
      addEventHandler: jest.fn(),
      publish: jest.fn(),
    } as unknown as jest.Mocked<InternalEventBusInterface>

    controller = new RealtimeController(
      websocketService,
      eventBus,
      documentState,
      {
        execute: jest.fn().mockReturnValue(
          Result.ok({
            numberOfUpdates: jest.fn(),
            squashedRepresentation: jest.fn().mockReturnValue(new Uint8Array(0)),
            needsSquash: jest.fn().mockReturnValue(false),
            byteSize: 0,
          }),
        ),
      } as unknown as jest.Mocked<FetchDecryptedCommit>,
      {
        execute: jest.fn().mockReturnValue(
          Result.ok({
            latestCommitId: jest.fn().mockReturnValue('123'),
          }),
        ),
      } as unknown as jest.Mocked<GetDocumentMeta>,
      logger,
      {
        isReady: jest.fn().mockReturnValue(true),
        isEnabled: jest.fn().mockReturnValue(false),
      } as unknown as jest.Mocked<UnleashClient>,
      'doc',
    )

    documentState.setProperty('editorReady', true)
  })

  afterEach(() => {
    if (!controller.isDestroyed) {
      controller.destroy()
    }
    jest.clearAllMocks()
  })

  test('should expose correct constant values', () => {
    expect(MAX_MS_TO_WAIT_FOR_RTS_SYNC_AFTER_CONNECT).toBe(100)
    expect(MAX_MS_TO_WAIT_FOR_RTS_CONNECTION_BEFORE_DISPLAYING_EDITOR).toBe(3_000)
  })

  test('should properly initialize controller with all dependencies', () => {
    expect(controller.isDestroyed).toBe(false)
    expect(controller.abortWebsocketConnectionAttempt).toBe(false)
    expect(controller.sizeTracker).toBeInstanceOf(DocSizeTracker)
    expect(controller.updatesReceivedWhileParentNotReady).toEqual([])
  })

  describe('RealtimeController subscriptions', () => {
    describe('editorReady subscription', () => {
      it('should call onEditorReadyEvent when editor becomes ready', () => {
        const spy = jest.spyOn(controller, 'onEditorReadyEvent')
        documentState.setProperty('editorReady', true)
        expect(spy).toHaveBeenCalled()
      })

      it('should not call onEditorReadyEvent when editor is not ready', () => {
        const spy = jest.spyOn(controller, 'onEditorReadyEvent')
        documentState.setProperty('editorReady', false)
        expect(spy).not.toHaveBeenCalled()
      })
    })

    describe('baseCommit subscription', () => {
      it('should reset size tracker when baseCommit is set', () => {
        const spy = jest.spyOn(controller, 'resetSizeTracker')
        documentState.setProperty('baseCommit', { byteSize: 1000 } as DecryptedCommit)
        expect(spy).toHaveBeenCalledWith(1000)
      })

      it('should not reset size tracker when baseCommit is null', () => {
        const spy = jest.spyOn(controller, 'resetSizeTracker')
        documentState.setProperty('baseCommit', undefined)
        expect(spy).not.toHaveBeenCalled()
      })
    })

    describe('EditorRequestsPropagationOfUpdate subscription', () => {
      it('should propagate non-conversion updates', () => {
        const spy = jest.spyOn(controller, 'propagateUpdate')
        const payload = {
          message: { type: { wrapper: 'du' }, content: new Uint8Array() },
          debugSource: BroadcastSource.TypingStatusChange,
        } as { message: RtsMessagePayload; debugSource: BroadcastSource }
        documentState.emitEvent({
          name: 'EditorRequestsPropagationOfUpdate',
          payload,
        })
        expect(spy).toHaveBeenCalledWith(payload.message, payload.debugSource)
      })
    })

    describe('DriveFileConversion subscriptions', () => {
      it('should handle conversion begin', () => {
        documentState.emitEvent({
          name: 'DriveFileConversionToDocBegan',
          payload: undefined,
        })
        expect(controller.abortWebsocketConnectionAttempt).toBe(true)
        const nodeMeta = documentState.getProperty('entitlements').nodeMeta
        expect(websocketService.closeConnection).toHaveBeenCalledWith(nodeMeta)
      })

      it('should handle conversion success', () => {
        documentState.emitEvent({
          name: 'DriveFileConversionToDocSucceeded',
          payload: undefined,
        })
        expect(controller.abortWebsocketConnectionAttempt).toBe(false)
        const nodeMeta = documentState.getProperty('entitlements').nodeMeta
        expect(websocketService.reconnectToDocumentWithoutDelay).toHaveBeenCalledWith(nodeMeta, {
          invalidateTokenCache: true,
        })
      })
    })

    describe('currentCommitId subscription', () => {
      it('should reconnect when commitId changes and not connected', async () => {
        websocketService.isConnected.mockReturnValue(false)
        documentState.setProperty('currentCommitId', 'new-id')
        documentState.setProperty('currentCommitId', 'newer-id')

        await Promise.resolve()

        expect(logger.info).toHaveBeenCalledWith(
          'Reconnecting to RTS because currentCommitId changed and we are not connected',
        )
        const nodeMeta = documentState.getProperty('entitlements').nodeMeta
        expect(websocketService.reconnectToDocumentWithoutDelay).toHaveBeenCalledWith(nodeMeta, {
          invalidateTokenCache: true,
        })
      })

      it('should not reconnect when connected', () => {
        websocketService.isConnected.mockReturnValue(true)
        documentState.setProperty('currentCommitId', 'new-id')
        documentState.setProperty('currentCommitId', 'newer-id')

        expect(websocketService.reconnectToDocumentWithoutDelay).not.toHaveBeenCalled()
      })
    })

    describe('documentTrashState subscription', () => {
      it('should reconnect when document is untrashed and not connected', () => {
        websocketService.isConnected.mockReturnValue(false)
        documentState.setProperty('documentTrashState', 'trashed')
        documentState.setProperty('documentTrashState', 'not_trashed')

        expect(logger.info).toHaveBeenCalledWith('Reconnecting to RTS because document was untrashed')
        const nodeMeta = documentState.getProperty('entitlements').nodeMeta
        expect(websocketService.reconnectToDocumentWithoutDelay).toHaveBeenCalledWith(nodeMeta, {
          invalidateTokenCache: false,
        })
      })

      it('should not reconnect for other trash state changes', () => {
        websocketService.isConnected.mockReturnValue(false)
        documentState.setProperty('documentTrashState', 'not_trashed')
        documentState.setProperty('documentTrashState', 'trashed')

        expect(websocketService.reconnectToDocumentWithoutDelay).not.toHaveBeenCalled()
      })
    })
  })

  it('should queue updates received while parent was not yet ready', async () => {
    documentState.setProperty('editorReady', false)

    await controller.handleDocumentUpdatesMessage({} as DecryptedMessage)

    expect(controller.updatesReceivedWhileParentNotReady).toHaveLength(1)
  })

  it('should replay queued updates as soon as parent is ready, and clear the queue', async () => {
    documentState.setProperty('editorReady', false)

    await controller.handleDocumentUpdatesMessage(
      new DecryptedMessage({
        content: new Uint8Array(),
        signature: new Uint8Array(),
        authorAddress: '123',
        aad: '123',
        timestamp: 0,
      }),
    )

    controller.handleDocumentUpdatesMessage = jest.fn()

    documentState.setProperty('editorReady', true)

    expect(controller.handleDocumentUpdatesMessage).toHaveBeenCalled()
    expect(controller.updatesReceivedWhileParentNotReady).toHaveLength(0)
  })

  describe('handleDocumentUpdatesMessage', () => {
    it('should increment size tracker size', async () => {
      controller.sizeTracker.incrementSize = jest.fn()

      await controller.handleDocumentUpdatesMessage({
        byteSize: jest.fn().mockReturnValue(25),
      } as unknown as DecryptedMessage)

      expect(controller.sizeTracker.incrementSize).toHaveBeenCalledWith(25)
    })
  })

  describe('websocket lifecycle', () => {
    it('should begin initial sync timer on connected event', () => {
      controller.beginInitialSyncTimer = jest.fn()

      controller.handleWebsocketConnectedEvent()

      expect(controller.beginInitialSyncTimer).toHaveBeenCalled()
    })
  })

  describe('propagateUpdate', () => {
    it('should increment size tracker size', () => {
      controller.sizeTracker.incrementSize = jest.fn()

      void controller.propagateUpdate(
        {
          type: {
            wrapper: 'du',
          },
          content: {
            byteLength: 123,
          },
        } as RtsMessagePayload,
        'mock' as BroadcastSource,
      )

      expect(controller.sizeTracker.incrementSize).toHaveBeenCalledWith(123)
    })

    it('should refuse propagation of update if the update is larger than the max update size', () => {
      controller.handleAttemptingToBroadcastUpdateThatIsTooLarge = jest.fn()

      void controller.propagateUpdate(
        {
          type: {
            wrapper: 'du',
          },
          content: {
            byteLength: MAX_UPDATE_SIZE + 1,
          },
        } as RtsMessagePayload,
        'mock' as BroadcastSource,
      )

      expect(controller.handleAttemptingToBroadcastUpdateThatIsTooLarge).toHaveBeenCalled()
      expect(controller.websocketService.sendDocumentUpdateMessage).not.toHaveBeenCalled()
    })

    it('should refuse propagation of update if the update would exceed total document size', () => {
      controller.sizeTracker.resetWithSize(MAX_DOC_SIZE - 1)

      controller.handleAttemptingToBroadcastUpdateThatIsTooLarge = jest.fn()

      void controller.propagateUpdate(
        {
          type: {
            wrapper: 'du',
          },
          content: {
            byteLength: 2,
          },
        } as RtsMessagePayload,
        'mock' as BroadcastSource,
      )

      expect(controller.handleAttemptingToBroadcastUpdateThatIsTooLarge).toHaveBeenCalled()
      expect(controller.websocketService.sendDocumentUpdateMessage).not.toHaveBeenCalled()
    })
  })

  describe('handleAttemptingToBroadcastUpdateThatIsTooLarge', () => {
    it('should flush pending updates', () => {
      controller.logger.error = jest.fn()

      controller.websocketService.flushPendingUpdates = jest.fn()

      controller.handleAttemptingToBroadcastUpdateThatIsTooLarge()
    })

    it('should set isLockedDueToSizeContraint', () => {
      controller.logger.error = jest.fn()

      controller.handleAttemptingToBroadcastUpdateThatIsTooLarge()

      expect(documentState.getProperty('realtimeIsLockedDueToSizeContraint')).toBe(true)
    })
  })

  describe('handleRealtimeServerEvent', () => {
    it('should queue events received while parent is not ready', async () => {
      documentState.setProperty('editorReady', false)
      const event = new ProcessedIncomingRealtimeEventMessage({
        type: EventTypeEnum.ClientIsRequestingOtherClientsToBroadcastTheirState,
      })

      await controller.handleRealtimeServerEvent([event])

      expect(controller.updatesReceivedWhileParentNotReady).toHaveLength(1)
    })

    it('should handle ClientIsRequestingOtherClientsToBroadcastTheirState event', async () => {
      const event = new ProcessedIncomingRealtimeEventMessage({
        type: EventTypeEnum.ClientIsRequestingOtherClientsToBroadcastTheirState,
      })

      documentState.emitEvent = jest.fn()

      await controller.handleRealtimeServerEvent([event])

      expect(documentState.emitEvent).toHaveBeenCalledWith({
        name: 'RealtimeRequestingClientToBroadcastItsState',
        payload: undefined,
      })
    })

    it('should handle ServerIsInformingClientThatTheDocumentCommitHasBeenUpdated event', async () => {
      const commitId = 'test-commit-id'
      const event = new ProcessedIncomingRealtimeEventMessage({
        type: EventTypeEnum.ServerIsInformingClientThatTheDocumentCommitHasBeenUpdated,
        content: new TextEncoder().encode(JSON.stringify({ commitId })),
      })

      documentState.setProperty = jest.fn()

      await controller.handleRealtimeServerEvent([event])

      expect(documentState.setProperty).toHaveBeenCalledWith('currentCommitId', commitId)
    })

    it('should handle ClientHasSentACommentMessage event', async () => {
      const content = new Uint8Array([1, 2, 3])
      const event = new ProcessedIncomingRealtimeEventMessage({
        type: EventTypeEnum.ClientHasSentACommentMessage,
        content,
      })

      eventBus.publish = jest.fn()

      await controller.handleRealtimeServerEvent([event])

      expect(eventBus.publish).toHaveBeenCalledWith({
        type: DocControllerEvent.RealtimeCommentMessageReceived,
        payload: {
          message: content,
        },
      })
    })

    it('should handle ClientIsBroadcastingItsPresenceState event', async () => {
      const content = new Uint8Array([1, 2, 3])
      const event = new ProcessedIncomingRealtimeEventMessage({
        type: EventTypeEnum.ClientIsBroadcastingItsPresenceState,
        content,
      })

      documentState.emitEvent = jest.fn()

      await controller.handleRealtimeServerEvent([event])

      expect(documentState.emitEvent).toHaveBeenCalledWith({
        name: 'RealtimeReceivedOtherClientPresenceState',
        payload: content,
      })
    })

    it('should call handleRealtimeConnectionReady for ServerHasMoreOrLessGivenTheClientEverythingItHas event', async () => {
      const spy = jest.spyOn(controller, 'handleRealtimeConnectionReady')
      const event = new ProcessedIncomingRealtimeEventMessage({
        type: EventTypeEnum.ServerHasMoreOrLessGivenTheClientEverythingItHas,
      })

      await controller.handleRealtimeServerEvent([event])

      expect(spy).toHaveBeenCalled()
    })

    it('should do nothing for activity indicator events', async () => {
      const spy = jest.spyOn(controller, 'handleRealtimeConnectionReady')
      const event = new ProcessedIncomingRealtimeEventMessage({
        type: EventTypeEnum.ServerIsPlacingEmptyActivityIndicatorInStreamToIndicateTheStreamIsStillActive,
      })

      await controller.handleRealtimeServerEvent([event])

      expect(spy).not.toHaveBeenCalled()
    })

    it('should do nothing for debug commit request events', async () => {
      const spy = jest.spyOn(controller, 'handleRealtimeConnectionReady')
      const event = new ProcessedIncomingRealtimeEventMessage({
        type: EventTypeEnum.ClientIsDebugRequestingServerToPerformCommit,
      })

      await controller.handleRealtimeServerEvent([event])

      expect(spy).not.toHaveBeenCalled()
    })

    it('should do nothing for ready to accept messages events', async () => {
      const spy = jest.spyOn(controller, 'handleRealtimeConnectionReady')
      const event = new ProcessedIncomingRealtimeEventMessage({
        type: EventTypeEnum.ServerIsReadyToAcceptClientMessages,
      })

      await controller.handleRealtimeServerEvent([event])

      expect(spy).not.toHaveBeenCalled()
    })

    it('should do nothing for disconnect clients events', async () => {
      const spy = jest.spyOn(controller, 'handleRealtimeConnectionReady')
      const event = new ProcessedIncomingRealtimeEventMessage({
        type: EventTypeEnum.ServerIsNotifyingOtherServersToDisconnectAllClientsFromTheStream,
      })

      await controller.handleRealtimeServerEvent([event])

      expect(spy).not.toHaveBeenCalled()
    })

    it('should call assertUnreachableAndLog for unknown event types', async () => {
      const event = new ProcessedIncomingRealtimeEventMessage({
        // @ts-expect-error intentionally passing invalid event type
        type: 'unknown',
        content: new Uint8Array(),
      })

      await controller.handleRealtimeServerEvent([event])

      expect(mockAssertUnreachableAndLog).toHaveBeenCalledWith(event.props)
    })
  })

  describe('initializeConnection', () => {
    it('should create connection with correct parameters', () => {
      const mockEntitlements = { keys: {}, nodeMeta: {} } as DocumentEntitlements
      const mockCurrentCommitId = 'commit-123'
      documentState.setProperty('currentCommitId', mockCurrentCommitId)
      documentState.setProperty('entitlements', mockEntitlements)

      controller.initializeConnection()

      expect(websocketService.createConnection).toHaveBeenCalledWith(documentState)

      // Test that the commitId callback returns the current commit ID
      const firstParam = websocketService.createConnection.mock.calls[0][0]
      const commitId = firstParam.getProperty('currentCommitId')
      expect(commitId).toBe(mockCurrentCommitId)
    })

    it('should log error if connection fails', async () => {
      const mockError = new Error('Connection failed')
      const mockConnection = {
        connect: jest.fn().mockRejectedValue(mockError),
      } as unknown as WebsocketConnectionInterface

      websocketService.createConnection.mockReturnValue(mockConnection)
      const entitlements = { keys: {} } as DocumentEntitlements
      documentState.setProperty('entitlements', entitlements)

      const returnedConnection = controller.initializeConnection()
      expect(returnedConnection).toBe(mockConnection)

      // Wait for promise rejection to be handled
      await mockConnection.connect().catch(() => {}) // catch here to prevent test failure

      expect(logger.error).toHaveBeenCalledWith(mockError)
    })

    it('should return connection and start timer', () => {
      const mockConnection = {
        connect: jest.fn().mockResolvedValue(undefined),
      } as unknown as WebsocketConnectionInterface

      websocketService.createConnection.mockReturnValue(mockConnection)
      const entitlements = { keys: {} } as DocumentEntitlements
      documentState.setProperty('entitlements', entitlements)

      const spy = jest.spyOn(controller, 'beginInitialConnectionTimer')
      const returnedConnection = controller.initializeConnection()

      expect(returnedConnection).toBe(mockConnection)
      expect(spy).toHaveBeenCalled()
    })

    it('should pass abort callback to connect', async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined)
      const mockConnection = {
        connect: mockConnect,
      } as unknown as WebsocketConnectionInterface

      websocketService.createConnection.mockReturnValue(mockConnection)
      const entitlements = { keys: {} } as DocumentEntitlements
      documentState.setProperty('entitlements', entitlements)

      controller.abortWebsocketConnectionAttempt = true
      controller.initializeConnection()

      // Get and test the abort callback
      const abortCallback = mockConnect.mock.calls[0][0]
      expect(abortCallback()).toBe(true)

      controller.abortWebsocketConnectionAttempt = false
      expect(abortCallback()).toBe(false)
    })
  })

  describe('destroy', () => {
    it('should clear both timers if they exist', () => {
      // Set up both timers
      controller.beginInitialConnectionTimer()
      controller.beginInitialSyncTimer()

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      controller.destroy()

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2)
      expect(clearTimeoutSpy).toHaveBeenCalledWith(controller.initialSyncTimer)
      expect(clearTimeoutSpy).toHaveBeenCalledWith(controller.initialConnectionTimer)
    })

    it('should not attempt to clear timers if they do not exist', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      controller.destroy()

      expect(clearTimeoutSpy).not.toHaveBeenCalled()
    })

    it('should set isDestroyed to true', () => {
      controller.destroy()

      expect(controller.isDestroyed).toBe(true)
    })
  })

  describe('resetSizeTracker', () => {
    it('should reset size tracker and clear received DUs', () => {
      controller.sizeTracker.resetWithSize = jest.fn()

      controller.resetSizeTracker(100)

      expect(controller.sizeTracker.resetWithSize).toHaveBeenCalledWith(100)
    })
  })

  describe('handleWebsocketConnectingEvent', () => {
    it('should update status and call callback', () => {
      documentState.setProperty('realtimeStatus', 'disconnected')

      controller.handleWebsocketConnectingEvent()

      expect(documentState.getProperty('realtimeStatus')).toBe('connecting')
      expect(controller.logger.info).toHaveBeenCalledWith('Websocket connecting')
    })
  })

  describe('handleWebsocketDisconnectedEvent', () => {
    it('should update status and call callback with reason', () => {
      const nodeMeta = documentState.getProperty('entitlements').nodeMeta
      documentState.setProperty('realtimeStatus', 'connected')
      const event = {
        document: nodeMeta,
        serverReason: ConnectionCloseReason.create({ code: 1000, message: 'test' }),
      }

      documentState.emitEvent = jest.fn()

      controller.handleWebsocketDisconnectedEvent(event)

      expect(documentState.getProperty('realtimeStatus')).toBe('disconnected')
      expect(documentState.emitEvent).toHaveBeenCalledWith({
        name: 'RealtimeConnectionClosed',
        payload: event.serverReason,
      })
    })
  })

  describe('handleWebsocketFailedToConnectEvent', () => {
    it('should update status and call callback', () => {
      documentState.setProperty('realtimeStatus', 'connecting')
      documentState.emitEvent = jest.fn()

      controller.handleWebsocketFailedToConnectEvent()

      expect(documentState.getProperty('realtimeStatus')).toBe('disconnected')
      expect(documentState.emitEvent).toHaveBeenCalledWith({
        name: 'RealtimeFailedToConnect',
        payload: undefined,
      })
    })
  })

  describe('handleWebsocketAckStatusChangeEvent', () => {
    it('should update sync status and call callback', () => {
      const mockLedger = { hasErroredMessages: jest.fn().mockReturnValue(true) } as unknown as AckLedgerInterface

      controller.handleWebsocketAckStatusChangeEvent({ ledger: mockLedger })

      expect(documentState.getProperty('realtimeIsExperiencingErroredSync')).toBe(true)
    })

    it('should handle non-errored status', () => {
      const mockLedger = { hasErroredMessages: jest.fn().mockReturnValue(false) } as unknown as AckLedgerInterface

      controller.handleWebsocketAckStatusChangeEvent({ ledger: mockLedger })

      expect(documentState.getProperty('realtimeIsExperiencingErroredSync')).toBe(false)
    })
  })

  describe('handleRealtimeConnectionReady', () => {
    it('should not proceed if controller is destroyed', () => {
      controller.isDestroyed = true

      controller.handleRealtimeConnectionReady()

      expect(documentState.getProperty('realtimeReadyToBroadcast')).toBe(false)
    })

    it('should clear sync timer and update ready status', () => {
      controller.initialSyncTimer = setTimeout(() => {}, 1000)
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      controller.handleRealtimeConnectionReady()

      expect(clearTimeoutSpy).toHaveBeenCalled()
      expect(controller.initialSyncTimer).toBeNull()
      expect(documentState.getProperty('realtimeReadyToBroadcast')).toBe(true)
    })

    it('should not set realtimeReadyToBroadcast if it is already true', () => {
      documentState.setProperty('realtimeReadyToBroadcast', true)
      const spy = jest.spyOn(documentState, 'setProperty')

      controller.handleRealtimeConnectionReady()

      expect(spy).not.toHaveBeenCalledWith('realtimeReadyToBroadcast', true)
    })
  })

  describe('beginInitialConnectionTimer', () => {
    it('should set timer and call timeout callback after delay', () => {
      controller.beginInitialConnectionTimer()
      documentState.setProperty = jest.fn()

      expect(controller.initialConnectionTimer).toBeDefined()

      jest.advanceTimersByTime(MAX_MS_TO_WAIT_FOR_RTS_CONNECTION_BEFORE_DISPLAYING_EDITOR + 1)

      expect(controller.logger.warn).toHaveBeenCalledWith(
        'Initial connection with RTS cannot seem to be formed in a reasonable time',
      )
      expect(documentState.setProperty).toHaveBeenCalledWith('realtimeConnectionTimedOut', true)
    })
  })

  describe('beginInitialSyncTimer', () => {
    it('should set timer and handle ready state after delay', () => {
      controller.beginInitialSyncTimer()

      expect(controller.initialSyncTimer).toBeDefined()

      jest.advanceTimersByTime(100)

      expect(controller.logger.warn).toHaveBeenCalledWith(
        'Client did not receive ServerHasMoreOrLessGivenTheClientEverythingItHas event in time',
      )
      expect(documentState.getProperty('realtimeReadyToBroadcast')).toBe(true)
    })
  })

  describe('propagateUpdate', () => {
    it('should handle event messages', () => {
      const content = new Uint8Array([1, 2, 3])
      const eventType = EventTypeEnum.ClientHasSentACommentMessage
      const message = {
        type: { wrapper: 'events', eventType },
        content,
      } as RtsMessagePayload

      controller.propagateUpdate(message, BroadcastSource.DocumentBufferFlush)

      expect(controller.websocketService.sendEventMessage).toHaveBeenCalledWith(
        expect.any(Object),
        content,
        eventType,
        BroadcastSource.DocumentBufferFlush,
      )
    })

    it('should throw error for unknown message type', () => {
      const message = {
        type: { wrapper: 'unknown' },
        content: new Uint8Array(),
      } as unknown as RtsMessagePayload

      expect(() => controller.propagateUpdate(message, BroadcastSource.DocumentBufferFlush)).toThrow(
        'Unknown message type',
      )
    })
  })

  describe('closeConnection', () => {
    it('should call websocket service to close connection', () => {
      controller.closeConnection()

      const nodeMeta = documentState.getProperty('entitlements').nodeMeta
      expect(controller.websocketService.closeConnection).toHaveBeenCalledWith(nodeMeta)
    })
  })

  describe('reconnect', () => {
    it('should call websocket service to reconnect', async () => {
      await controller.reconnect({ invalidateTokenCache: true })

      const nodeMeta = documentState.getProperty('entitlements').nodeMeta
      expect(controller.websocketService.reconnectToDocumentWithoutDelay).toHaveBeenCalledWith(nodeMeta, {
        invalidateTokenCache: true,
      })
    })
  })

  describe('getConnectionStatus', () => {
    it('should return current websocket status', () => {
      documentState.setProperty('realtimeStatus', 'connected')
      expect(documentState.getProperty('realtimeStatus')).toBe('connected')

      documentState.setProperty('realtimeStatus', 'connecting')
      expect(documentState.getProperty('realtimeStatus')).toBe('connecting')

      documentState.setProperty('realtimeStatus', 'disconnected')
      expect(documentState.getProperty('realtimeStatus')).toBe('disconnected')
    })
  })

  describe('debugSendCommitCommandToRTS', () => {
    it('should call websocket service with correct parameters', async () => {
      const entitlements = { keys: {} } as DocumentEntitlements

      await controller.debugSendCommitCommandToRTS(entitlements)

      const nodeMeta = documentState.getProperty('entitlements').nodeMeta
      expect(controller.websocketService.debugSendCommitCommandToRTS).toHaveBeenCalledWith(nodeMeta, entitlements.keys)
    })
  })

  describe('DebugMenuRequestingCommitWithRTS subscription', () => {
    it('should call debugSendCommitCommandToRTS with payload', () => {
      const spy = jest.spyOn(controller, 'debugSendCommitCommandToRTS')
      const mockEntitlements = {} as DocumentEntitlements

      documentState.emitEvent({
        name: 'DebugMenuRequestingCommitWithRTS',
        payload: mockEntitlements,
      })

      expect(spy).toHaveBeenCalledWith(mockEntitlements)
    })
  })

  describe('onEditorReadyEvent', () => {
    it('should throw error when trying to replay unknown message type', () => {
      // @ts-expect-error intentionally pushing invalid message type
      controller.updatesReceivedWhileParentNotReady.push({ foo: 'bar' })

      expect(() => controller.onEditorReadyEvent()).toThrow('Attempting to replay unknown message type')
    })

    it('should handle ProcessedIncomingRealtimeEventMessage correctly', () => {
      const mockMessage = new ProcessedIncomingRealtimeEventMessage({
        type: EventTypeEnum.ClientHasSentACommentMessage,
        content: new Uint8Array(),
      })
      controller.updatesReceivedWhileParentNotReady.push(mockMessage)

      const spy = jest.spyOn(controller, 'handleRealtimeServerEvent')
      controller.onEditorReadyEvent()

      expect(spy).toHaveBeenCalledWith([mockMessage])
    })

    it('should handle DecryptedMessage correctly', () => {
      const mockMessage = new DecryptedMessage({
        content: new Uint8Array(),
        signature: new Uint8Array(),
        authorAddress: '',
        aad: '',
        timestamp: 0,
      })
      controller.updatesReceivedWhileParentNotReady.push(mockMessage)

      const spy = jest.spyOn(controller, 'handleDocumentUpdatesMessage')
      controller.onEditorReadyEvent()

      expect(spy).toHaveBeenCalledWith(mockMessage)
    })
  })

  describe('handleEvent', () => {
    it('should handle Disconnected event', async () => {
      const spy = jest.spyOn(controller, 'handleWebsocketDisconnectedEvent')
      const payload = { serverReason: { props: { code: 1000, message: 'test' } } }

      await controller.handleEvent({
        type: WebsocketConnectionEvent.Disconnected,
        payload,
      })

      expect(spy).toHaveBeenCalledWith(payload)
    })

    it('should handle FailedToConnect event', async () => {
      const spy = jest.spyOn(controller, 'handleWebsocketFailedToConnectEvent')

      await controller.handleEvent({
        type: WebsocketConnectionEvent.FailedToConnect,
        payload: undefined,
      })

      expect(spy).toHaveBeenCalled()
    })

    it('should handle ConnectedAndReady event', async () => {
      const spy = jest.spyOn(controller, 'handleWebsocketConnectedEvent')

      await controller.handleEvent({
        type: WebsocketConnectionEvent.ConnectedAndReady,
        payload: undefined,
      })

      expect(spy).toHaveBeenCalled()
    })

    it('should handle Connecting event', async () => {
      const spy = jest.spyOn(controller, 'handleWebsocketConnectingEvent')

      await controller.handleEvent({
        type: WebsocketConnectionEvent.Connecting,
        payload: undefined,
      })

      expect(spy).toHaveBeenCalled()
    })

    it('should handle DocumentUpdateMessage event', async () => {
      const spy = jest.spyOn(controller, 'handleDocumentUpdatesMessage')
      const message = new DecryptedMessage({
        content: new Uint8Array(),
        signature: new Uint8Array(),
        authorAddress: '',
        aad: '',
        timestamp: 0,
      })

      await controller.handleEvent({
        type: WebsocketConnectionEvent.DocumentUpdateMessage,
        payload: { message },
      })

      expect(spy).toHaveBeenCalledWith(message)
    })

    it('should handle EventMessage event', async () => {
      const spy = jest.spyOn(controller, 'handleRealtimeServerEvent')
      const message = [
        new ProcessedIncomingRealtimeEventMessage({
          type: EventTypeEnum.ClientHasSentACommentMessage,
          content: new Uint8Array(),
        }),
      ]

      await controller.handleEvent({
        type: WebsocketConnectionEvent.EventMessage,
        payload: { message },
      })

      expect(spy).toHaveBeenCalledWith(message)
    })

    it('should handle AckStatusChange event', async () => {
      const spy = jest.spyOn(controller, 'handleWebsocketAckStatusChangeEvent')
      const payload = {
        ledger: {
          hasErroredMessages: () => false,
        },
      }

      await controller.handleEvent({
        type: WebsocketConnectionEvent.AckStatusChange,
        payload,
      })

      expect(spy).toHaveBeenCalledWith(payload)
    })

    it('should return early for unhandled event types', async () => {
      const emitEventSpy = jest.spyOn(documentState, 'emitEvent')

      const event: InternalEventInterface<unknown> = {
        type: 'UnhandledEventType',
        payload: undefined,
      }

      await controller.handleEvent(event)

      expect(emitEventSpy).not.toHaveBeenCalled()
    })

    it('should refetch commit', async () => {
      controller.refetchCommitDueToStaleContents = jest.fn()

      const event: InternalEventInterface<unknown> = {
        type: WebsocketConnectionEvent.FailedToGetTokenCommitIdOutOfSync,
        payload: undefined,
      }

      await controller.handleEvent(event)

      expect(controller.refetchCommitDueToStaleContents).toHaveBeenCalled()
    })
  })

  describe('handleWebsocketConnectedEvent', () => {
    it('should clear initialConnectionTimer if it exists', () => {
      controller.beginInitialConnectionTimer()
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      controller.handleWebsocketConnectedEvent()

      expect(clearTimeoutSpy).toHaveBeenCalledWith(controller.initialConnectionTimer)
    })

    it('should not attempt to clear timer if it does not exist', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      controller.handleWebsocketConnectedEvent()

      expect(clearTimeoutSpy).not.toHaveBeenCalled()
    })
  })

  describe('handle realtime disconnection', () => {
    it('should refetch commit if disconnect reason is stale commit id', () => {
      controller.refetchCommitDueToStaleContents = jest.fn()

      controller.handleWebsocketDisconnectedEvent({
        serverReason: ConnectionCloseReason.create({ code: ConnectionCloseReason.CODES.STALE_COMMIT_ID }),
        document: {} as NodeMeta,
      })

      expect(controller.refetchCommitDueToStaleContents).toHaveBeenCalled()
    })
  })

  describe('refetchCommitDueToStaleContents', () => {
    it('should post UnableToResolveCommitIdConflict error if unable to resolve', async () => {
      controller.logger.error = jest.fn()
      eventBus.publish = jest.fn()

      controller._fetchDecryptedCommit.execute = jest
        .fn()
        .mockReturnValue(ApiResult.fail({ message: 'Unable to resolve', code: 0 }))
      controller._getDocumentMeta.execute = jest
        .fn()
        .mockReturnValue(ApiResult.fail({ message: 'Unable to resolve', code: 0 }))

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(eventBus.publish).toHaveBeenCalledWith({
        type: DocControllerEvent.UnableToResolveCommitIdConflict,
        payload: undefined,
      })
    })

    it('should not reprocess if already processing', async () => {
      controller._fetchDecryptedCommit.execute = jest.fn().mockReturnValue(
        Result.ok({
          numberOfUpdates: jest.fn(),
          squashedRepresentation: jest.fn().mockReturnValue(new Uint8Array()),
          needsSquash: jest.fn().mockReturnValue(false),
        }),
      )
      controller._getDocumentMeta.execute = jest.fn().mockReturnValue(Result.ok({}))

      controller.isRefetchingStaleCommit = true

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(controller._fetchDecryptedCommit.execute).not.toHaveBeenCalled()
    })

    it('should re-set the initial commit if commit is successfully resolved', async () => {
      controller._fetchDecryptedCommit.execute = jest.fn().mockReturnValue(
        Result.ok({
          numberOfMessages: jest.fn().mockReturnValue(0),
          needsSquash: jest.fn().mockReturnValue(false),
          squashedRepresentation: jest.fn().mockReturnValue(new Uint8Array()),
        }),
      )

      documentState.setProperty = jest.fn()

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(documentState.setProperty).toHaveBeenCalledWith('baseCommit', expect.anything())
    })
  })
})
