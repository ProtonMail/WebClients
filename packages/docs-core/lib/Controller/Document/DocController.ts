import { c } from 'ttag'
import { LoggerInterface } from '@standardnotes/utils'
import { SquashDocument } from '../../UseCase/SquashDocument'
import { UserService } from '../../Services/User/UserService'
import { WebsocketConnection } from '../../Realtime/WebsocketConnection'
import { WebsocketCallbacks } from '../../Realtime/WebsocketCallbacks'
import * as encoding from 'lib0/encoding'
import { EncryptMessage } from '../../UseCase/EncryptMessage'
import { DecryptMessage } from '../../UseCase/DecryptMessage'
import { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import { DecryptedNode, DriveCompat, NodeMeta } from '@proton/drive-store'
import { GetRealtimeUrlAndToken } from '../../Api/Docs/CreateRealtimeValetToken'
import {
  DocChangeObserver,
  WebsocketConnectionEvent,
  InternalEventBusInterface,
  ClientRequiresEditorMethods,
  RtsMessagePayload,
  DocumentMetaInterface,
  DocAwarenessEvent,
  DocsAwarenessStateChangeData,
  WebsocketStatusChangedPayload,
  WebsocketConnectionStatus,
  WebsocketDisconnectedReason,
  DocUpdateOrigin,
} from '@proton/docs-shared'
import {
  ServerMessageWithDocumentUpdates,
  CreateDocumentUpdateMessage,
  ServerMessage,
  EventType,
  CreateClientEventMessage,
  ServerMessageType,
  Event,
  EventTypeEnum,
  ConnectionCloseReason,
  DocumentUpdateVersion,
  ClientEventVersion,
} from '@proton/docs-proto'
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding'
import { LoadDocument } from '../../UseCase/LoadDocument'
import { DecryptedCommit } from '../../Models/DecryptedCommit'
import { DebugSendCommitCommandToRTS } from '../../UseCase/SendCommitCommandToRTS'
import { DocControllerInterface } from './DocControllerInterface'
import { DocumentKeys } from '@proton/drive-store'
import { DebugCreateInitialCommit } from '../../UseCase/CreateInitialCommit'
import { Result } from '@standardnotes/domain-core'
import { DocLoadSuccessResult } from './DocLoadSuccessResult'
import { UserState } from '@lexical/yjs'
import { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import { getErrorString } from '../../Util/GetErrorString'

/**
 * Controls the lifecycle of a single document.
 */
export class DocController implements DocControllerInterface {
  private keys: DocumentKeys | null = null
  private decryptedNode?: DecryptedNode
  private changeObservers: DocChangeObserver[] = []
  private editorInvoker?: ClientRequiresEditorMethods
  private docMeta!: DocumentMetaInterface
  private initialCommit?: DecryptedCommit
  private lastCommitIdReceivedFromRts?: string

  public readonly username: string
  public connection?: WebsocketConnection
  public initialized = false

  constructor(
    private readonly lookup: NodeMeta,
    userService: UserService,
    private driveCompat: DriveCompat,
    private _squashDocument: SquashDocument,
    private _createInitialCommit: DebugCreateInitialCommit,
    private _sendCommitCommandToRTS: DebugSendCommitCommandToRTS,
    private _loadDocument: LoadDocument,
    private _encryptMessage: EncryptMessage,
    private _decryptMessage: DecryptMessage,
    private _duplicateDocument: DuplicateDocument,
    private _createNewDocument: CreateNewDocument,
    private _createRealtimeValetToken: GetRealtimeUrlAndToken,
    private _getDocumentMeta: GetDocumentMeta,
    private eventBus: InternalEventBusInterface,
    private logger: LoggerInterface,
  ) {
    this.username = userService.user.Email || userService.getUserId()
  }

  public setEditorInvoker(editorInvoker: ClientRequiresEditorMethods): void {
    this.editorInvoker = editorInvoker
  }

  public addChangeObserver(observer: DocChangeObserver): () => void {
    this.changeObservers.push(observer)

    return () => {
      this.changeObservers = this.changeObservers.filter((o) => o !== observer)
    }
  }

  public getSureDocument(): DocumentMetaInterface {
    if (!this.docMeta) {
      throw new Error('Attempting to access document before it is initialized')
    }

    return this.docMeta
  }

  public async initialize(): Promise<Result<DocLoadSuccessResult>> {
    const loadResult = await this._loadDocument.execute(this.lookup)
    if (loadResult.isFailed()) {
      this.logger.error('Failed to load document', loadResult.getError())
      return Result.fail(loadResult.getError())
    }

    const { keys, docMeta, decryptedCommit } = loadResult.getValue()

    this.logger.info(`Loaded commit with ${decryptedCommit?.numberOfUpdates()} updates`)

    this.setInitialCommit(decryptedCommit)
    this.keys = keys
    this.docMeta = docMeta

    this.logger.info(`Loaded document with last commit id ${decryptedCommit?.commitId}`)

    const websocketCallbacks: WebsocketCallbacks = {
      onConnectionConnecting: () => {
        this.eventBus.publish<WebsocketStatusChangedPayload>({
          type: WebsocketConnectionEvent.StatusChanged,
          payload: {
            status: WebsocketConnectionStatus.Connecting,
          },
        })
        if (this.editorInvoker) {
          this.editorInvoker.handleWSConnectionStatusChange(WebsocketConnectionStatus.Connecting).catch(console.error)
        }
      },

      onConnectionClose: (reason) => {
        this.eventBus.publish<WebsocketStatusChangedPayload>({
          type: WebsocketConnectionEvent.StatusChanged,
          payload: {
            status: WebsocketConnectionStatus.Disconnected,
            reason: WebsocketDisconnectedReason.Unknown,
          },
        })

        if (this.editorInvoker) {
          void this.editorInvoker.performClosingCeremony()
          void this.editorInvoker.handleWSConnectionStatusChange(WebsocketConnectionStatus.Disconnected)
        }

        if (reason.props.code === ConnectionCloseReason.CODES.STALE_COMMIT_ID) {
          void this.reloadIfCommitIdMismatch()
        }
      },

      onConnectionOpen: () => {
        this.eventBus.publish<WebsocketStatusChangedPayload>({
          type: WebsocketConnectionEvent.StatusChanged,
          payload: {
            status: WebsocketConnectionStatus.Connected,
          },
        })

        /**
         * @TODO Remove this timeout DRVDOC-240
         */
        setTimeout(() => {
          const requestPresenceMessage = CreateClientEventMessage({
            type: EventTypeEnum.RequestPresenceState,
            content: stringToUint8Array(JSON.stringify(true)),
            authorAddress: keys.userOwnAddress,
            timestamp: Date.now(),
            version: ClientEventVersion.V1,
          })
          this.connection!.broadcastMessage(requestPresenceMessage, this, 'RequestPresenceState on WS open').catch(
            console.error,
          )
        }, 250)

        if (!this.editorInvoker) {
          throw new Error('Editor invoker not initialized')
        }

        void this.editorInvoker.performOpeningCeremony()
        void this.editorInvoker.handleWSConnectionStatusChange(WebsocketConnectionStatus.Connected)
      },

      onConnectionMessage: (message) => {
        void this.handleConnectionMessage(message)
      },

      getLatestCommitId: () => this.commitId,

      getUrlAndToken: async () => {
        const result = await this._createRealtimeValetToken.execute(this.lookup, this.commitId)
        return result
      },
    }

    this.connection = new WebsocketConnection(this.keys, websocketCallbacks, this._encryptMessage, this.logger)

    this.connection.connect().catch(this.logger.error)

    this.initialized = true

    void this.loadDecryptedNode()

    return Result.ok({
      keys: this.keys,
      connection: this.connection,
    })
  }

  async acceptFailedVerificationCommit(commitId: string): Promise<void> {
    this.logger.info('Accepting failed verification commit', commitId)
  }

  get commitId(): string | undefined {
    return this.lastCommitIdReceivedFromRts ?? this.initialCommit?.commitId
  }

  private async reloadIfCommitIdMismatch() {
    const currentCommitId = this.commitId

    const result = await this._getDocumentMeta.execute(this.lookup)

    if (result.isFailed()) {
      console.error('Failed to get document meta', result.getError())
      return
    }

    const docMeta = result.getValue()

    const newCommitId = docMeta.commitIds[docMeta.commitIds.length - 1]

    if (currentCommitId !== newCommitId) {
      this.logger.debug('Reloading document due to commit id mismatch')
      window.location.reload()
    }
  }

  private setInitialCommit(decryptedCommit: DecryptedCommit | undefined): void {
    this.initialCommit = decryptedCommit

    if (decryptedCommit?.needsSquash()) {
      this.logger.info('Document needs squash')

      void this.squashDocument()
    }
  }

  public async debugGetUnrestrictedSharingUrl(): Promise<string> {
    const url = this.driveCompat.getDocumentUrl(this.lookup)
    return url.toString()
  }

  private async loadDecryptedNode(): Promise<void> {
    try {
      this.decryptedNode = await this.driveCompat.getNode(this.lookup)
      const newDoc = this.docMeta.copyWithNewValues({ name: this.decryptedNode.name })
      this.docMeta = newDoc
      this.changeObservers.forEach((observer) => observer(newDoc))
    } catch (error) {
      this.logger.error('Failed to get decrypted link', error)
    }
  }

  public onEditorReady(): void {
    if (!this.connection) {
      throw new Error('Connection not initialized')
    }

    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    this.logger.info('Editor ready')

    if (this.docMeta && this.initialCommit) {
      this.logger.info('Initializing connection with initial commit', this.initialCommit)
      void this.editorInvoker.receiveMessage({
        type: { wrapper: 'du' },
        content: this.initialCommit.squashedRepresentation(),
        origin: DocUpdateOrigin.InitialLoad,
      })
    }
  }

  async editorRequestsPropagationOfUpdate(
    message: RtsMessagePayload,
    originator: string,
    debugSource: string,
  ): Promise<void> {
    if (!this.connection || !this.keys) {
      throw new Error('Connection not initialized')
    }

    const wrappedMessage =
      message.type.wrapper === 'du'
        ? CreateDocumentUpdateMessage({
            content: message.content,
            authorAddress: this.keys.userOwnAddress,
            timestamp: Date.now(),
            version: DocumentUpdateVersion.V1,
          })
        : CreateClientEventMessage({
            type: message.type.eventType,
            content: message.content,
            authorAddress: this.keys.userOwnAddress,
            version: ClientEventVersion.V1,
            timestamp: Date.now(),
          })
    await this.connection.broadcastMessage(wrappedMessage, originator, debugSource)
  }

  public async debugSendCommitCommandToRTS(): Promise<void> {
    if (!this.connection || !this.keys) {
      throw new Error('Connection not initialized')
    }

    this.logger.info('Sending commit command to RTS')

    await this._sendCommitCommandToRTS.execute(this.connection, this.keys.userOwnAddress)
  }

  public async createInitialCommit(): Promise<void> {
    if (!this.keys) {
      throw new Error('Connection not initialized')
    }

    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    const state = await this.editorInvoker.getDocumentState()

    const result = await this._createInitialCommit.execute(this.docMeta, state, this.keys)

    if (result.isFailed()) {
      this.logger.error('Failed to create initial commit', result.getError())
    }
  }

  public async squashDocument(): Promise<void> {
    if (!this.docMeta || !this.keys) {
      throw new Error('Connection not initialized')
    }

    if (!this.initialCommit) {
      this.logger.info('No initial commit to squash')
      return
    }

    this.logger.info('Squashing document')

    const result = await this._squashDocument.execute(
      this.docMeta,
      this.lastCommitIdReceivedFromRts ?? this.initialCommit.commitId,
      this.keys,
    )

    if (result.isFailed()) {
      this.logger.error('Failed to squash document', result.getError())
    } else {
      this.logger.info('Squash result', result.getValue())
    }
  }

  public async duplicateDocument(): Promise<void> {
    if (!this.docMeta || !this.connection) {
      throw new Error('Attempting to duplicate document before it is initialized')
    }

    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    const newName = `${this.docMeta.name} (copy ${new Date().toLocaleString()})`

    const state = await this.editorInvoker.getDocumentState()

    const result = await this._duplicateDocument.execute(newName, this.lookup, state)

    if (result.isFailed()) {
      this.logger.error('Failed to duplicate document', result.getError())
      return
    }

    const shell = result.getValue()

    void this.driveCompat.openDocument(shell)
  }

  public async createNewDocument(): Promise<void> {
    if (!this.docMeta || !this.connection || !this.keys) {
      throw new Error('Attempting to create new document before controller is initialized')
    }

    const baseTitle = c('Title').t`Untitled document`

    const newName = `${baseTitle} ${new Date().toLocaleString()}`

    const result = await this._createNewDocument.execute(newName, this.lookup)

    if (result.isFailed()) {
      this.logger.error('Failed to create new document', result.getError())
      return
    }

    const shell = result.getValue()

    void this.driveCompat.openDocument(shell)
  }

  public async getDocumentClientId(): Promise<number> {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }
    return this.editorInvoker.getClientId()
  }

  public async renameDocument(newName: string): Promise<Result<void>> {
    try {
      await this.driveCompat.renameDocument(this.lookup, newName)
      return Result.ok()
    } catch (e) {
      return Result.fail(getErrorString(e) ?? 'Failed to rename document')
    }
  }

  private async handleRelayedClientEvents(events: Event[], keys: DocumentKeys) {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    for (const event of events) {
      const type = EventType.create(event.type)

      this.logger.debug('Handling relayed event from RTS:', EventTypeEnum[event.type], event.content)

      const content = event.content

      if (type.value === EventTypeEnum.WebsocketConnectionResponded) {
        continue
      }

      if (type.value === EventTypeEnum.RequestPresenceState) {
        this.editorInvoker.broadcastPresenceState().catch(console.error)
        continue
      }

      if (type.value === EventTypeEnum.RefreshPresenceState) {
        this.editorInvoker.refreshPresenceState().catch(console.error)
        continue
      }

      if (type.value === EventTypeEnum.DocumentCommitUpdated) {
        const decodedContent = uint8ArrayToString(content)
        const parsedMessage = JSON.parse(decodedContent)
        this.lastCommitIdReceivedFromRts = parsedMessage.commitId
        continue
      }

      const decryptionResult = await this._decryptMessage.execute({ message: event, keys: keys, verify: true })
      if (decryptionResult.isFailed()) {
        throw new Error(`Failed to decrypt relayed event: ${decryptionResult.getError()}`)
      }

      const decryptedUpdate = decryptionResult.getValue()

      if (type.isPresenceChange()) {
        void this.editorInvoker.receiveMessage({
          type: {
            wrapper: 'events',
            eventType: type.value,
          },
          content: decryptedUpdate.content,
        })
      }

      this.eventBus.publish({
        type: WebsocketConnectionEvent.SocketClientRelayEventReceived,
        payload: { type: type, data: decryptedUpdate },
      })
    }
  }

  private async handleDocumentUpdatesMessage(message: ServerMessageWithDocumentUpdates, keys: DocumentKeys) {
    this.logger.debug('Received message with document updates:', message)

    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    for (const update of message.updates.documentUpdates) {
      const decryptionResult = await this._decryptMessage.execute({ message: update, keys: keys, verify: true })
      if (decryptionResult.isFailed()) {
        throw new Error(`Failed to decrypt document update: ${decryptionResult.getError()}`)
      }

      const decrypted = decryptionResult.getValue()

      void this.editorInvoker.receiveMessage({
        type: { wrapper: 'du' },
        content: decrypted.content,
      })
    }
  }

  private async handleConnectionMessage(buf: Uint8Array): Promise<encoding.Encoder> {
    if (!this.keys) {
      throw new Error('Keys not initialized')
    }

    this.logger.debug('Received connection message:', buf)

    const message = ServerMessage.deserializeBinary(buf)
    const type = ServerMessageType.create(message.type)

    if (type.hasDocumentUpdates()) {
      await this.handleDocumentUpdatesMessage(message.documentUpdatesMessage, this.keys)
    } else if (type.hasEvents()) {
      await this.handleRelayedClientEvents(message.eventsMessage.events, this.keys)
    } else {
      throw new Error('Unknown message type')
    }

    const encoder = encoding.createEncoder()
    return encoder
  }

  async handleAwarenessStateUpdate(states: UserState[]): Promise<void> {
    this.eventBus.publish<DocsAwarenessStateChangeData>({
      type: DocAwarenessEvent.AwarenessStateChange,
      payload: {
        states,
      },
    })
  }

  deinit() {}
}
