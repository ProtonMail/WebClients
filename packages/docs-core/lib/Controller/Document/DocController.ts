import { c } from 'ttag'
import { LoggerInterface, assertUnreachable } from '@standardnotes/utils'
import { SquashDocument } from '../../UseCase/SquashDocument'
import { UserService } from '../../Services/User/UserService'
import * as encoding from 'lib0/encoding'
import { DecryptMessage } from '../../UseCase/DecryptMessage'
import { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import { DecryptedNode, DriveCompat, NodeMeta } from '@proton/drive-store'
import {
  DocChangeObserver,
  WebsocketConnectionEvent,
  InternalEventBusInterface,
  ClientRequiresEditorMethods,
  RtsMessagePayload,
  DocumentMetaInterface,
  DocAwarenessEvent,
  DocsAwarenessStateChangeData,
  DocUpdateOrigin,
  InternalEventHandlerInterface,
  InternalEventInterface,
  WebsocketDisconnectedPayload,
  BaseWebsocketPayload,
  WebsocketMessagePayload,
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
import { PROTON_DOC_FILE_EXTENSION } from '@proton/docs-shared'
import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding'
import { LoadDocument } from '../../UseCase/LoadDocument'
import { DecryptedCommit } from '../../Models/DecryptedCommit'
import { DocControllerInterface } from './DocControllerInterface'
import { DocumentKeys } from '@proton/drive-store'
import { DebugCreateInitialCommit } from '../../UseCase/CreateInitialCommit'
import { Result } from '@standardnotes/domain-core'
import { DocLoadSuccessResult } from './DocLoadSuccessResult'
import { UserState } from '@lexical/yjs'
import { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import { getErrorString } from '../../Util/GetErrorString'
import { NativeVersionHistory } from '../../VersionHistory'
import { WebsocketServiceInterface } from '../../Services/Websockets/WebsocketServiceInterface'
import { DecryptedMessage } from '../../Models/DecryptedMessage'
import { DocControllerEvent, RealtimeCommentMessageReceivedPayload } from './DocControllerEvent'

const MAX_MS_TO_WAIT_FOR_RTS_SYNC_AFTER_CONNECT = 1_000
const MAX_MS_TO_WAIT_FOR_RTS_CONNECTION_BEFORE_DISPLAYING_EDITOR = 3_000

/**
 * Controls the lifecycle of a single document.
 */
export class DocController implements DocControllerInterface, InternalEventHandlerInterface {
  private keys: DocumentKeys | null = null
  private decryptedNode?: DecryptedNode
  private changeObservers: DocChangeObserver[] = []
  private editorInvoker?: ClientRequiresEditorMethods
  private docMeta!: DocumentMetaInterface
  private initialCommit?: DecryptedCommit
  private lastCommitIdReceivedFromRts?: string
  private initialSyncTimer: NodeJS.Timeout | null = null
  private initialConnectionTimer: NodeJS.Timeout | null = null
  private editorReady = false

  public readonly username: string
  public initialized = false

  constructor(
    private readonly nodeMeta: NodeMeta,
    userService: UserService,
    private driveCompat: DriveCompat,
    private _squashDocument: SquashDocument,
    private _createInitialCommit: DebugCreateInitialCommit,
    private _loadDocument: LoadDocument,
    private _decryptMessage: DecryptMessage,
    private _duplicateDocument: DuplicateDocument,
    private _createNewDocument: CreateNewDocument,
    private _getDocumentMeta: GetDocumentMeta,
    private websocketService: WebsocketServiceInterface,
    private eventBus: InternalEventBusInterface,
    private logger: LoggerInterface,
  ) {
    this.username = userService.user.Email || userService.getUserId()

    eventBus.addEventHandler(this, WebsocketConnectionEvent.Disconnected)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.Connected)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.Connecting)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.Message)
  }

  private handleWebsocketConnectingEvent(): void {
    if (this.editorInvoker) {
      this.editorInvoker.handleWSConnectionStatusChange(WebsocketConnectionEvent.Connecting).catch(console.error)
    }
  }

  private handleWebsocketConnectedEvent(): void {
    this.beginInitialSyncTimer()

    if (this.initialConnectionTimer) {
      clearTimeout(this.initialConnectionTimer)
    }

    if (!this.keys) {
      throw new Error('Keys not initialized')
    }

    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    void this.editorInvoker.performOpeningCeremony()
    void this.editorInvoker.handleWSConnectionStatusChange(WebsocketConnectionEvent.Connected)
  }

  private handleWebsocketDisconnectedEvent(payload: WebsocketDisconnectedPayload): void {
    if (this.editorInvoker) {
      void this.editorInvoker.performClosingCeremony()
      void this.editorInvoker.handleWSConnectionStatusChange(WebsocketConnectionEvent.Disconnected)
    }

    if (payload.serverReason.props.code === ConnectionCloseReason.CODES.STALE_COMMIT_ID) {
      void this.reloadIfCommitIdMismatch()
    }
  }

  async handleEvent(event: InternalEventInterface<unknown>): Promise<void> {
    const { document } = event.payload as BaseWebsocketPayload

    if (document.linkId !== this.nodeMeta.linkId || document.volumeId !== this.nodeMeta.volumeId) {
      return
    }

    if (event.type === WebsocketConnectionEvent.Disconnected) {
      this.handleWebsocketDisconnectedEvent(event.payload as WebsocketDisconnectedPayload)
    } else if (event.type === WebsocketConnectionEvent.Connected) {
      this.handleWebsocketConnectedEvent()
    } else if (event.type === WebsocketConnectionEvent.Connecting) {
      this.handleWebsocketConnectingEvent()
    } else if (event.type === WebsocketConnectionEvent.Message) {
      const { message } = event.payload as WebsocketMessagePayload
      void this.handleConnectionMessage(message)
    }
  }

  private beginInitialSyncTimer(): void {
    this.initialSyncTimer = setTimeout(() => {
      this.logger.warn('Initial sync with RTS timed out')
      this.handleCompletingInitialSyncWithRts()
    }, MAX_MS_TO_WAIT_FOR_RTS_SYNC_AFTER_CONNECT)
  }

  private handleCompletingInitialSyncWithRts(): void {
    if (this.initialSyncTimer) {
      clearTimeout(this.initialSyncTimer)
      this.initialSyncTimer = null
    }

    void this.editorInvoker?.showEditor()
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
    const loadResult = await this._loadDocument.execute(this.nodeMeta)
    if (loadResult.isFailed()) {
      this.logger.error('Failed to load document', loadResult.getError())
      return Result.fail(loadResult.getError())
    }

    const { keys, docMeta, decryptedCommit } = loadResult.getValue()

    this.logger.info(`Loaded commit with ${decryptedCommit?.numberOfUpdates()} updates`)

    this.keys = keys
    this.docMeta = docMeta
    this.setInitialCommit(decryptedCommit)

    this.logger.info(`Loaded document with last commit id ${decryptedCommit?.commitId}`)

    const connection = this.websocketService.createConnection(this.nodeMeta, keys, { commitId: () => this.commitId })

    connection.connect().catch(this.logger.error)

    this.beginInitialConnectionTimer()

    this.initialized = true

    void this.loadDecryptedNode()

    return Result.ok({
      keys: this.keys,
    })
  }

  private beginInitialConnectionTimer(): void {
    this.initialConnectionTimer = setTimeout(() => {
      this.logger.warn('Initial connection with RTS timed out')
      void this.editorInvoker?.showEditor()
    }, MAX_MS_TO_WAIT_FOR_RTS_CONNECTION_BEFORE_DISPLAYING_EDITOR)
  }

  async acceptFailedVerificationCommit(commitId: string): Promise<void> {
    this.logger.info('Accepting failed verification commit', commitId)
  }

  get commitId(): string | undefined {
    return this.lastCommitIdReceivedFromRts ?? this.initialCommit?.commitId
  }

  private async reloadIfCommitIdMismatch() {
    const currentCommitId = this.commitId

    const result = await this._getDocumentMeta.execute(this.nodeMeta)

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

    if (!decryptedCommit) {
      return
    }

    if (decryptedCommit.needsSquash()) {
      this.logger.info('Document needs squash')

      void this.squashDocument()
    }
  }

  public getVersionHistory(): NativeVersionHistory | undefined {
    if (!this.initialCommit) {
      return
    }
    return new NativeVersionHistory(this.initialCommit)
  }

  public async debugGetUnrestrictedSharingUrl(): Promise<string> {
    const url = this.driveCompat.getDocumentUrl(this.nodeMeta)
    return url.toString()
  }

  private async loadDecryptedNode(): Promise<void> {
    try {
      this.decryptedNode = await this.driveCompat.getNode(this.nodeMeta)
      const newDoc = this.docMeta.copyWithNewValues({ name: this.decryptedNode.name })
      this.docMeta = newDoc
      this.changeObservers.forEach((observer) => observer(newDoc))
    } catch (error) {
      this.logger.error('Failed to get decrypted link', error)
    }
  }

  public onEditorReady(): void {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    if (this.editorReady) {
      this.logger.warn('Received duplicate onEditorReady event')
      return
    }

    this.editorReady = true

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
    if (!this.keys) {
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

    await this.websocketService.sendMessageToDocument(this.nodeMeta, wrappedMessage, debugSource)
  }

  public async debugSendCommitCommandToRTS(): Promise<void> {
    if (!this.keys) {
      throw new Error('Connection not initialized')
    }

    await this.websocketService.debugSendCommitCommandToRTS(this.nodeMeta, this.keys)
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
      throw new Error('Cannot squash document before document and keys are available')
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
    if (!this.docMeta) {
      throw new Error('Attempting to duplicate document before it is initialized')
    }

    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    const newName = `${this.docMeta.name} (copy ${new Date().toLocaleString()})`

    const state = await this.editorInvoker.getDocumentState()

    const result = await this._duplicateDocument.execute(newName, this.nodeMeta, state)

    if (result.isFailed()) {
      this.logger.error('Failed to duplicate document', result.getError())
      return
    }

    const shell = result.getValue()

    void this.driveCompat.openDocument(shell)
  }

  public async createNewDocument(): Promise<void> {
    if (!this.docMeta || !this.keys) {
      throw new Error('Attempting to create new document before controller is initialized')
    }

    const date = new Date().toLocaleDateString()
    // translator: Default title for a new Proton Document (example: Untitled document 2024-04-23)
    const baseTitle = c('Title').t`Untitled document ${date}`
    const newName = `${baseTitle}.${PROTON_DOC_FILE_EXTENSION}`

    const result = await this._createNewDocument.execute(newName, this.nodeMeta)

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
      if (!this.decryptedNode) {
        return Result.fail('Decrypted node not loaded when renaming document')
      }

      const name = await this.driveCompat.findAvailableNodeName(
        {
          volumeId: this.decryptedNode.volumeId,
          linkId: this.decryptedNode.parentNodeId,
        },
        newName,
      )
      await this.driveCompat.renameDocument(this.nodeMeta, name)
      return Result.ok()
    } catch (e) {
      return Result.fail(getErrorString(e) ?? 'Failed to rename document')
    }
  }

  public async openDocumentSharingModal(): Promise<void> {
    await this.driveCompat.openDocumentSharingModal(this.nodeMeta)
  }

  private async handleRealtimeServerEvent(events: Event[], keys: DocumentKeys) {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    const editorInvoker = this.editorInvoker

    const decryptPayload = async (event: Event): Promise<DecryptedMessage | undefined> => {
      const decryptionResult = await this._decryptMessage.execute({ message: event, keys: keys, verify: true })
      if (decryptionResult.isFailed()) {
        this.logger.error(`Failed to decrypt event: ${decryptionResult.getError()}`)
        return undefined
      }

      return decryptionResult.getValue()
    }

    for (const event of events) {
      const type = EventType.create(event.type)

      this.logger.debug('Handling event from RTS:', EventTypeEnum[event.type])

      switch (type.value) {
        case EventTypeEnum.ClientIsRequestingOtherClientsToBroadcastTheirState:
        case EventTypeEnum.ServerIsRequestingClientToBroadcastItsState:
          await editorInvoker.broadcastPresenceState()
          break
        case EventTypeEnum.ServerIsInformingClientThatTheDocumentCommitHasBeenUpdated:
          const decodedContent = uint8ArrayToString(event.content)
          const parsedMessage = JSON.parse(decodedContent)
          this.lastCommitIdReceivedFromRts = parsedMessage.commitId
          break
        case EventTypeEnum.ClientHasSentACommentMessage: {
          const decrypted = await decryptPayload(event)
          if (decrypted) {
            this.eventBus.publish({
              type: DocControllerEvent.RealtimeCommentMessageReceived,
              payload: <RealtimeCommentMessageReceivedPayload>{ message: decrypted },
            })
          }
          break
        }
        case EventTypeEnum.ClientIsBroadcastingItsPresenceState: {
          const decrypted = await decryptPayload(event)
          if (decrypted) {
            void editorInvoker.receiveMessage({
              type: { wrapper: 'events', eventType: EventType.create(event.type).value },
              content: decrypted.content,
            })
          }
          break
        }
        case EventTypeEnum.ServerHasMoreOrLessGivenTheClientEverythingItHas:
          this.handleCompletingInitialSyncWithRts()
          break
        case EventTypeEnum.ServerIsPlacingEmptyActivityIndicatorInStreamToIndicateTheStreamIsStillActive:
        case EventTypeEnum.ClientIsDebugRequestingServerToPerformCommit:
          break
        default:
          assertUnreachable(type.value)
      }
    }
  }

  private async handleDocumentUpdatesMessage(message: ServerMessageWithDocumentUpdates, keys: DocumentKeys) {
    this.logger.debug('Received message with document updates')

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

  private async handleConnectionMessage(data: Uint8Array): Promise<encoding.Encoder> {
    if (!this.keys) {
      throw new Error('Keys not initialized')
    }

    const message = ServerMessage.deserializeBinary(data)
    const type = ServerMessageType.create(message.type)

    if (type.hasDocumentUpdates()) {
      await this.handleDocumentUpdatesMessage(message.documentUpdatesMessage, this.keys)
    } else if (type.hasEvents()) {
      await this.handleRealtimeServerEvent(message.eventsMessage.events, this.keys)
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

  showCommentsPanel() {
    if (!this.editorInvoker) {
      return
    }
    void this.editorInvoker.showCommentsPanel()
  }

  deinit() {}
}
