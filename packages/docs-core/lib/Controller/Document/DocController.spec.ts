import type { DriveCompat, NodeMeta } from '@proton/drive-store'
import { DocController } from './DocController'
import type { SquashDocument } from '../../UseCase/SquashDocument'
import type { SeedInitialCommit } from '../../UseCase/SeedInitialCommit'
import type { LoadDocument } from '../../UseCase/LoadDocument'
import type { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import type { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import type { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import type { WebsocketServiceInterface } from '../../Services/Websockets/WebsocketServiceInterface'
import type {
  BroadcastSource,
  ClientRequiresEditorMethods,
  InternalEventBusInterface,
  RtsMessagePayload,
} from '@proton/docs-shared'
import { DecryptedMessage } from '@proton/docs-shared'
import type { LoggerInterface } from '@proton/utils/logs'
import type { LoadCommit } from '../../UseCase/LoadCommit'
import { ConnectionCloseReason } from '@proton/docs-proto'
import type { DecryptedCommit } from '../../Models/DecryptedCommit'
import { Result } from '../../Domain/Result/Result'
import type { ExportAndDownload } from '../../UseCase/ExportAndDownload'
import type { DocumentEntitlements } from '../../Types/DocumentEntitlements'
import type { WebsocketConnectionEventPayloads } from '../../Realtime/WebsocketEvent/WebsocketConnectionEventPayloads'
import type { WebsocketConnectionEvent } from '../../Realtime/WebsocketEvent/WebsocketConnectionEvent'
import { DocControllerEvent } from './DocControllerEvent'
import { MAX_DOC_SIZE, MAX_UPDATE_SIZE } from '../../Models/Constants'

describe('DocController', () => {
  let controller: DocController

  beforeEach(() => {
    controller = new DocController(
      {} as NodeMeta,
      {} as jest.Mocked<DriveCompat>,
      {} as jest.Mocked<SquashDocument>,
      {} as jest.Mocked<SeedInitialCommit>,
      {
        execute: jest
          .fn()
          .mockReturnValue(Result.ok({ keys: {}, meta: {}, lastCommitId: '123', entitlements: { keys: {} } })),
      } as unknown as jest.Mocked<LoadDocument>,
      {
        execute: jest.fn().mockReturnValue(Result.ok({ numberOfUpdates: jest.fn() })),
      } as unknown as jest.Mocked<LoadCommit>,
      {} as jest.Mocked<DuplicateDocument>,
      {} as jest.Mocked<CreateNewDocument>,
      {
        execute: jest.fn().mockReturnValue(
          Result.ok({
            latestCommitId: jest.fn().mockReturnValue('123'),
          }),
        ),
      } as unknown as jest.Mocked<GetDocumentMeta>,
      {} as jest.Mocked<ExportAndDownload>,
      {
        createConnection: jest.fn().mockReturnValue({ connect: jest.fn().mockResolvedValue(true) }),
        sendDocumentUpdateMessage: jest.fn(),
        flushPendingUpdates: jest.fn(),
        reconnectToDocumentWithoutDelay: jest.fn(),
        closeConnection: jest.fn(),
      } as unknown as jest.Mocked<WebsocketServiceInterface>,
      {
        addEventHandler: jest.fn(),
        publish: jest.fn(),
      } as unknown as jest.Mocked<InternalEventBusInterface>,
      {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as unknown as jest.Mocked<LoggerInterface>,
    )

    controller.entitlements = {
      role: {
        canEdit: () => true,
      },
      keys: {},
    } as unknown as DocumentEntitlements

    controller.beginInitialSyncTimer = jest.fn()
    controller.beginInitialConnectionTimer = jest.fn()

    controller.editorInvoker = {
      receiveMessage: jest.fn(),
      showEditor: jest.fn(),
      performOpeningCeremony: jest.fn(),
      changeLockedState: jest.fn().mockResolvedValue(false),
      performClosingCeremony: jest.fn(),
      getDocumentState: jest.fn(),
    } as unknown as jest.Mocked<ClientRequiresEditorMethods>
  })

  it('should queue updates received while editor was not yet ready', async () => {
    controller.editorInvoker = undefined

    await controller.handleDocumentUpdatesMessage({} as DecryptedMessage)

    expect(controller.updatesReceivedWhileEditorInvokerWasNotReady).toHaveLength(1)
  })

  it('should replay queued updates as soon as editor is ready, and clear the queue', async () => {
    controller.editorInvoker = undefined

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

    await controller.editorIsReadyToReceiveInvocations({
      receiveMessage: jest.fn(),
      showEditor: jest.fn(),
      performOpeningCeremony: jest.fn(),
      changeLockedState: jest.fn(),
    } as unknown as jest.Mocked<ClientRequiresEditorMethods>)

    expect(controller.handleDocumentUpdatesMessage).toHaveBeenCalled()
    expect(controller.updatesReceivedWhileEditorInvokerWasNotReady).toHaveLength(0)
  })

  describe('editorIsReadyToReceiveInvocations', () => {
    it('should send initial commit to editor', async () => {
      controller.sendInitialCommitToEditor = jest.fn()

      const editorInvoker = controller.editorInvoker!
      controller.editorInvoker = undefined
      await controller.editorIsReadyToReceiveInvocations(editorInvoker)

      expect(controller.sendInitialCommitToEditor).toHaveBeenCalled()
    })
  })

  describe('initialize', () => {
    it('should set the initial commit', async () => {
      controller.setInitialCommit = jest.fn()

      await controller.initialize()

      expect(controller.setInitialCommit).toHaveBeenCalled()
    })
  })

  describe('setInitialCommit', () => {
    it('should send the initial commit to the editor', async () => {
      controller.sendInitialCommitToEditor = jest.fn()

      await controller.setInitialCommit({
        needsSquash: jest.fn(),
      } as unknown as jest.Mocked<DecryptedCommit>)

      expect(controller.sendInitialCommitToEditor).toHaveBeenCalled()
    })

    it('should set last commit id property', async () => {
      await controller.setInitialCommit({
        needsSquash: jest.fn(),
        commitId: '456',
      } as unknown as jest.Mocked<DecryptedCommit>)

      expect(controller.lastCommitIdReceivedFromRtsOrApi).toBe('456')
    })
  })

  describe('showEditorIfAllConnectionsReady', () => {
    it('should not show editor if docs server connection is not ready', () => {
      controller.realtimeConnectionReady = true
      controller.docsServerConnectionReady = false
      controller.showEditor = jest.fn()

      controller.showEditorIfAllConnectionsReady()

      expect(controller.showEditor).not.toHaveBeenCalled()
    })

    it('should not show editor if realtime connection is not ready', () => {
      controller.realtimeConnectionReady = false
      controller.docsServerConnectionReady = true
      controller.showEditor = jest.fn()

      controller.showEditorIfAllConnectionsReady()

      expect(controller.showEditor).not.toHaveBeenCalled()
    })

    it('should not show editor if editorInvoker is undefined', () => {
      controller.editorInvoker = undefined
      controller.realtimeConnectionReady = true
      controller.docsServerConnectionReady = true
      controller.showEditor = jest.fn()

      controller.showEditorIfAllConnectionsReady()

      expect(controller.showEditor).not.toHaveBeenCalled()
    })
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

  describe('handleRealtimeConnectionReady', () => {
    it('should show editor', () => {
      controller.didAlreadyReceiveEditorReadyEvent = true
      controller.docsServerConnectionReady = true

      controller.handleRealtimeConnectionReady()

      expect(controller.editorInvoker!.showEditor).toHaveBeenCalled()
    })
  })

  describe('reloadEditingLockedState', () => {
    it('should lock if user does not have editing permissions', () => {
      controller.doesUserHaveEditingPermissions = jest.fn().mockReturnValue(false)

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should lock if experiencing errored sync', () => {
      controller.isExperiencingErroredSync = true

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should lock if websocket status is connecting', () => {
      controller.websocketStatus = 'connecting'

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should lock if size constraint reached', () => {
      controller.isLockedDueToSizeContraint = true

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should lock if websocket status is disconnected', () => {
      controller.websocketStatus = 'disconnected'

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should unlock if all flags are green', () => {
      controller.doesUserHaveEditingPermissions = jest.fn().mockReturnValue(true)
      controller.isExperiencingErroredSync = false
      controller.websocketStatus = 'connected'

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(false)
    })

    it('should lock if participation limit reached and user is not owner', () => {
      controller.doesUserOwnDocument = jest.fn().mockReturnValue(false)
      controller.participantTracker.isParticipantLimitReached = jest.fn().mockReturnValue(true)

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should not lock if participation limit reached and user is owner', () => {
      controller.doesUserOwnDocument = jest.fn().mockReturnValue(true)
      controller.participantTracker.isParticipantLimitReached = jest.fn().mockReturnValue(true)

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should lock if editor has rendering issue', () => {
      controller.hasEditorRenderingIssue = true

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })
  })

  describe('websocket lifecycle', () => {
    it('should lock document when websocket is still connecting', () => {
      controller.handleWebsocketConnectingEvent()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should begin initial sync timer on connected event', () => {
      controller.beginInitialSyncTimer = jest.fn()

      controller.handleWebsocketConnectedEvent()

      expect(controller.beginInitialSyncTimer).toHaveBeenCalled()
    })
  })

  describe('handleWebsocketDisconnectedEvent', () => {
    it('should prevent editing when websocket is closed', () => {
      const payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected] = {
        document: {} as NodeMeta,
        serverReason: ConnectionCloseReason.create({ code: ConnectionCloseReason.CODES.NORMAL_CLOSURE }),
      }
      controller.handleWebsocketDisconnectedEvent(payload)

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should refetch commit if disconnect reason is stale commit id', () => {
      const payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected] = {
        document: {} as NodeMeta,
        serverReason: ConnectionCloseReason.create({ code: ConnectionCloseReason.CODES.STALE_COMMIT_ID }),
      }
      controller.refetchCommitDueToStaleContents = jest.fn()

      controller.handleWebsocketDisconnectedEvent(payload)

      expect(controller.refetchCommitDueToStaleContents).toHaveBeenCalled()
    })
  })

  describe('handleCommitIdOutOfSyncEvent', () => {
    it('should refetch commit', () => {
      controller.refetchCommitDueToStaleContents = jest.fn()

      controller.handleFailedToGetTokenDueToCommitIdOutOfSyncEvent()

      expect(controller.refetchCommitDueToStaleContents).toHaveBeenCalled()
    })
  })

  describe('refetchCommitDueToStaleContents', () => {
    it('should post UnableToResolveCommitIdConflict error if unable to resolve', async () => {
      controller._loadCommit.execute = jest.fn().mockReturnValue(Result.fail('Unable to resolve'))
      controller._getDocumentMeta.execute = jest.fn().mockReturnValue(Result.fail('Unable to resolve'))

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(controller.eventBus.publish).toHaveBeenCalledWith({
        type: DocControllerEvent.UnableToResolveCommitIdConflict,
        payload: undefined,
      })
    })

    it('should not reprocess if already processing', async () => {
      controller._loadCommit.execute = jest.fn().mockReturnValue(Result.ok({}))
      controller._getDocumentMeta.execute = jest.fn().mockReturnValue(Result.ok({}))

      controller.isRefetchingStaleCommit = true

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(controller._loadCommit.execute).not.toHaveBeenCalled()
    })

    it('should re-set the initial commit if commit is successfully resolved', async () => {
      controller._loadCommit.execute = jest.fn().mockReturnValue(
        Result.ok({
          numberOfUpdates: jest.fn().mockReturnValue(0),
          needsSquash: jest.fn().mockReturnValue(false),
        }),
      )

      controller.setInitialCommit = jest.fn()

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(controller.setInitialCommit).toHaveBeenCalled()
    })

    it('should reconnect websocket without delay if commit is successfully resolved', async () => {
      controller._loadCommit.execute = jest.fn().mockReturnValue(
        Result.ok({
          numberOfUpdates: jest.fn().mockReturnValue(0),
          needsSquash: jest.fn().mockReturnValue(false),
        }),
      )

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(controller.websocketService.reconnectToDocumentWithoutDelay).toHaveBeenCalled()
    })
  })

  describe('handleWebsocketConnectedEvent', () => {
    it('should allow editing', () => {
      controller.handleWebsocketConnectedEvent()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(false)
    })
  })

  describe('handleWebsocketFailedToConnectEvent', () => {
    it('should block editing', () => {
      controller.handleWebsocketFailedToConnectEvent()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should set state to disconnected', () => {
      controller.handleWebsocketFailedToConnectEvent()

      expect(controller.websocketStatus).toBe('disconnected')
    })
  })

  describe('handleWebsocketAckStatusChangeEvent', () => {
    it('should reload editing locked state', () => {
      controller.reloadEditingLockedState = jest.fn()

      controller.handleWebsocketAckStatusChangeEvent({
        ledger: { hasErroredMessages: jest.fn() },
      } as unknown as WebsocketConnectionEventPayloads[WebsocketConnectionEvent.AckStatusChange])

      expect(controller.reloadEditingLockedState).toHaveBeenCalled()
    })
  })

  describe('editorRequestsPropagationOfUpdate', () => {
    it('should propagate update', () => {
      void controller.editorRequestsPropagationOfUpdate(
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

      expect(controller.websocketService.sendDocumentUpdateMessage).toHaveBeenCalled()
    })

    it('should increment size tracker size', () => {
      controller.sizeTracker.incrementSize = jest.fn()

      void controller.editorRequestsPropagationOfUpdate(
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

      void controller.editorRequestsPropagationOfUpdate(
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

      void controller.editorRequestsPropagationOfUpdate(
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

    it('should handle special conversion flow', () => {
      controller.handleEditorProvidingInitialConversionContent = jest.fn()

      void controller.editorRequestsPropagationOfUpdate(
        {
          type: {
            wrapper: 'conversion',
          },
          content: {
            byteLength: 123,
          },
        } as RtsMessagePayload,
        'mock' as BroadcastSource,
      )

      expect(controller.handleEditorProvidingInitialConversionContent).toHaveBeenCalled()
    })

    it('should not seed initial commit if update is not conversion', () => {
      controller.handleEditorProvidingInitialConversionContent = jest.fn()

      void controller.editorRequestsPropagationOfUpdate(
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

      expect(controller.handleEditorProvidingInitialConversionContent).not.toHaveBeenCalled()
    })
  })

  describe('createInitialCommit', () => {
    it('should set lastCommitIdReceivedFromRtsOrApi', async () => {
      controller._createInitialCommit.execute = jest.fn().mockReturnValue(Result.ok({ commitId: '123' }))

      await controller.createInitialCommit()

      expect(controller.lastCommitIdReceivedFromRtsOrApi).toBe('123')
    })
  })

  describe('handleAttemptingToBroadcastUpdateThatIsTooLarge', () => {
    it('should lock editing', () => {
      controller.reloadEditingLockedState = jest.fn()

      controller.handleAttemptingToBroadcastUpdateThatIsTooLarge()

      expect(controller.isLockedDueToSizeContraint).toBe(true)

      expect(controller.reloadEditingLockedState).toHaveBeenCalled()
    })
  })

  describe('handleEditorProvidingInitialConversionContent', () => {
    beforeEach(() => {
      controller.createInitialCommit = jest.fn().mockReturnValue(Result.ok({ commitId: '123' }))
    })

    it('should abort existing connection attempt', async () => {
      controller.websocketService.closeConnection = jest.fn()

      const promise = controller.handleEditorProvidingInitialConversionContent(new Uint8Array())

      expect(controller.abortWebsocketConnectionAttempt).toEqual(true)

      await promise

      expect(controller.abortWebsocketConnectionAttempt).toEqual(false)
      expect(controller.websocketService.closeConnection).toHaveBeenCalled()
    })

    it('should create initial commit', async () => {
      await controller.handleEditorProvidingInitialConversionContent(new Uint8Array())

      expect(controller.createInitialCommit).toHaveBeenCalled()
    })

    it('should reconnect to document without delay', async () => {
      controller.websocketService.reconnectToDocumentWithoutDelay = jest.fn()

      await controller.handleEditorProvidingInitialConversionContent(new Uint8Array())

      expect(controller.websocketService.reconnectToDocumentWithoutDelay).toHaveBeenCalled()
    })
  })

  describe('editorIsRequestingToLockAfterRenderingIssue', () => {
    it('should set hasEditorRenderingIssue', () => {
      controller.editorIsRequestingToLockAfterRenderingIssue()

      expect(controller.hasEditorRenderingIssue).toBe(true)
    })

    it('should reload editing locked state', () => {
      controller.reloadEditingLockedState = jest.fn()

      controller.editorIsRequestingToLockAfterRenderingIssue()

      expect(controller.reloadEditingLockedState).toHaveBeenCalled()
    })
  })
})
