import { DocumentKeys, DriveCompat, NodeMeta } from '@proton/drive-store'
import { DocController } from './DocController'
import { UserService } from '../../Services/User/UserService'
import { SquashDocument } from '../../UseCase/SquashDocument'
import { DebugCreateInitialCommit } from '../../UseCase/CreateInitialCommit'
import { LoadDocument } from '../../UseCase/LoadDocument'
import { DecryptMessage } from '../../UseCase/DecryptMessage'
import { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import { WebsocketServiceInterface } from '../../Services/Websockets/WebsocketServiceInterface'
import {
  ClientRequiresEditorMethods,
  InternalEventBusInterface,
  WebsocketDisconnectedPayload,
} from '@proton/docs-shared'
import { Result } from '@standardnotes/domain-core'
import { LoggerInterface } from '@proton/utils/logs'
import { LoadCommit } from '../../UseCase/LoadCommit'
import { ConnectionCloseReason, ServerMessageWithDocumentUpdates } from '@proton/docs-proto'
import { DecryptedCommit } from '../../Models/DecryptedCommit'

describe('DocController', () => {
  let controller: DocController

  beforeEach(() => {
    controller = new DocController(
      {} as NodeMeta,
      {
        user: { Email: 'foo@bar.com' },
      } as jest.Mocked<UserService>,
      {} as jest.Mocked<DriveCompat>,
      {} as jest.Mocked<SquashDocument>,
      {} as jest.Mocked<DebugCreateInitialCommit>,
      {
        execute: jest.fn().mockReturnValue(Result.ok({ keys: {}, meta: {}, lastCommitId: '123' })),
      } as unknown as jest.Mocked<LoadDocument>,
      {
        execute: jest.fn().mockReturnValue(Result.ok({ numberOfUpdates: jest.fn() })),
      } as unknown as jest.Mocked<LoadCommit>,
      {
        execute: jest.fn().mockReturnValue(Result.ok({ content: '' })),
      } as unknown as jest.Mocked<DecryptMessage>,
      {} as jest.Mocked<DuplicateDocument>,
      {} as jest.Mocked<CreateNewDocument>,
      {} as jest.Mocked<GetDocumentMeta>,
      {
        createConnection: jest.fn().mockReturnValue({ connect: jest.fn().mockResolvedValue(true) }),
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

    controller.keys = {} as DocumentKeys

    controller.beginInitialSyncTimer = jest.fn()
    controller.beginInitialConnectionTimer = jest.fn()

    controller.editorInvoker = {
      receiveMessage: jest.fn(),
      showEditor: jest.fn(),
      performOpeningCeremony: jest.fn(),
      changeEditingAllowance: jest.fn().mockResolvedValue(true),
      performClosingCeremony: jest.fn(),
    } as unknown as jest.Mocked<ClientRequiresEditorMethods>
  })

  it('should queue updates received while editor was not yet ready', async () => {
    controller.editorInvoker = undefined

    await controller.handleDocumentUpdatesMessage({} as ServerMessageWithDocumentUpdates, {} as DocumentKeys)

    expect(controller.updatesReceivedWhileEditorInvokerWasNotReady).toHaveLength(1)
  })

  it('should replay queued updates as soon as editor is ready, and clear the queue', async () => {
    controller.editorInvoker = undefined

    await controller.handleDocumentUpdatesMessage(new ServerMessageWithDocumentUpdates(), {} as DocumentKeys)

    controller.handleDocumentUpdatesMessage = jest.fn()

    await controller.editorIsReadyToReceiveInvocations({
      receiveMessage: jest.fn(),
      showEditor: jest.fn(),
      performOpeningCeremony: jest.fn(),
      changeEditingAllowance: jest.fn(),
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

      controller.setInitialCommit({
        needsSquash: jest.fn(),
      } as unknown as jest.Mocked<DecryptedCommit>)

      expect(controller.sendInitialCommitToEditor).toHaveBeenCalled()
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

  describe('handleRealtimeConnectionReady', () => {
    it('should show editor', () => {
      controller.didAlreadyReceiveEditorReadyEvent = true
      controller.docsServerConnectionReady = true

      controller.handleRealtimeConnectionReady()

      expect(controller.editorInvoker!.showEditor).toHaveBeenCalled()
    })
  })

  describe('websocket lifecycle', () => {
    it('should prevent editing when websocket is still connecting', () => {
      controller.handleWebsocketConnectingEvent()

      expect(controller.editorInvoker!.changeEditingAllowance).toHaveBeenCalledWith(false)
    })

    it('should prevent editing when websocket is closed', () => {
      const payload: WebsocketDisconnectedPayload = {
        document: {} as NodeMeta,
        serverReason: ConnectionCloseReason.create({ code: ConnectionCloseReason.CODES.NORMAL_CLOSURE }),
      }
      controller.handleWebsocketDisconnectedEvent(payload)

      expect(controller.editorInvoker!.changeEditingAllowance).toHaveBeenCalledWith(false)
    })

    it('should begin initial sync timer on connected event', () => {
      controller.beginInitialSyncTimer = jest.fn()

      controller.handleWebsocketConnectedEvent()

      expect(controller.beginInitialSyncTimer).toHaveBeenCalled()
    })
  })

  describe('handleWebsocketConnectedEvent', () => {
    it('should allow editing', () => {
      controller.handleWebsocketConnectedEvent()

      expect(controller.editorInvoker!.changeEditingAllowance).toHaveBeenCalledWith(true)
    })
  })
})
