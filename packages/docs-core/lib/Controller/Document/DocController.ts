import { utf8ArrayToString } from '@proton/crypto/lib/utils'
import { c } from 'ttag'
import { LoggerInterface } from '@proton/utils/logs'
import { SquashDocument } from '../../UseCase/SquashDocument'
import { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import { DecryptedNode, DriveCompat, NodeMeta } from '@proton/drive-store'
import {
  DocChangeObserver,
  InternalEventBusInterface,
  ClientRequiresEditorMethods,
  RtsMessagePayload,
  DocumentMetaInterface,
  DocAwarenessEvent,
  DocsAwarenessStateChangeData,
  DocUpdateOrigin,
  InternalEventHandlerInterface,
  InternalEventInterface,
  BroadcastSource,
  DecryptedMessage,
  ProcessedIncomingRealtimeEventMessage,
  DataTypesThatDocumentCanBeExportedAs,
  DocumentRole,
  assertUnreachableAndLog,
} from '@proton/docs-shared'
import { EventType, EventTypeEnum, ConnectionCloseReason } from '@proton/docs-proto'
import { LoadDocument } from '../../UseCase/LoadDocument'
import { DecryptedCommit } from '../../Models/DecryptedCommit'
import { DocControllerInterface } from './DocControllerInterface'
import { SeedInitialCommit } from '../../UseCase/SeedInitialCommit'
import { DocLoadSuccessResult } from './DocLoadSuccessResult'
import { UserState } from '@lexical/yjs'
import { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import { getErrorString } from '../../Util/GetErrorString'
import { NativeVersionHistory } from '../../VersionHistory'
import { WebsocketServiceInterface } from '../../Services/Websockets/WebsocketServiceInterface'
import { DocControllerEvent, DocControllerEventPayloads } from './DocControllerEvent'
import metrics from '@proton/metrics'
import {
  ApplicationEvent,
  DocsClientSquashVerificationObjectionMadePayload,
  PostApplicationError,
} from '../../Application/ApplicationEvent'
import { SquashVerificationObjectionCallback } from '../../Types/SquashVerificationObjection'
import { LoadCommit } from '../../UseCase/LoadCommit'
import { TranslatedResult } from '../../Domain/Result/TranslatedResult'
import { Result } from '../../Domain/Result/Result'
import { ExportAndDownload } from '../../UseCase/ExportAndDownload'
import { DocumentEntitlements } from '../../Types/DocumentEntitlements'
import { WebsocketConnectionEventPayloads } from '../../Realtime/WebsocketEvent/WebsocketConnectionEventPayloads'
import { WebsocketConnectionEvent } from '../../Realtime/WebsocketEvent/WebsocketConnectionEvent'
import { DocSizeTracker } from './SizeTracker'
import { getPlatformFriendlyDateForFileName } from '../../Util/PlatformFriendlyFileNameDate'

const MAX_MS_TO_WAIT_FOR_RTS_SYNC_AFTER_CONNECT = 1_000
const MAX_MS_TO_WAIT_FOR_RTS_CONNECTION_BEFORE_DISPLAYING_EDITOR = 3_000

/**
 * Controls the lifecycle of a single document.
 */
export class DocController implements DocControllerInterface, InternalEventHandlerInterface {
  entitlements: DocumentEntitlements | null = null
  private decryptedNode?: DecryptedNode
  private changeObservers: DocChangeObserver[] = []
  editorInvoker?: ClientRequiresEditorMethods
  private docMeta!: DocumentMetaInterface
  private initialCommit?: DecryptedCommit
  lastCommitIdReceivedFromRtsOrApi?: string
  private initialSyncTimer: NodeJS.Timeout | null = null
  private initialConnectionTimer: NodeJS.Timeout | null = null
  isExperiencingErroredSync = false
  isLockedDueToSizeContraint = false
  realtimeConnectionReady = false
  docsServerConnectionReady = false
  didAlreadyReceiveEditorReadyEvent = false
  isRefetchingStaleCommit = false
  readonly updatesReceivedWhileEditorInvokerWasNotReady: (DecryptedMessage | ProcessedIncomingRealtimeEventMessage)[] =
    []
  websocketStatus: 'connected' | 'connecting' | 'disconnected' = 'disconnected'
  sizeTracker: DocSizeTracker = new DocSizeTracker()

  public userAddress?: string

  constructor(
    private readonly nodeMeta: NodeMeta,
    private driveCompat: DriveCompat,
    private _squashDocument: SquashDocument,
    private _createInitialCommit: SeedInitialCommit,
    private _loadDocument: LoadDocument,
    readonly _loadCommit: LoadCommit,
    private _duplicateDocument: DuplicateDocument,
    private _createNewDocument: CreateNewDocument,
    readonly _getDocumentMeta: GetDocumentMeta,
    private _exportAndDownload: ExportAndDownload,
    readonly websocketService: WebsocketServiceInterface,
    readonly eventBus: InternalEventBusInterface,
    private logger: LoggerInterface,
  ) {
    eventBus.addEventHandler(this, WebsocketConnectionEvent.Connecting)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.FailedToConnect)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.Connected)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.Disconnected)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.DocumentUpdateMessage)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.EventMessage)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.AckStatusChange)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.FailedToGetTokenCommitIdOutOfSync)
  }

  public get role(): DocumentRole {
    if (!this.entitlements) {
      return new DocumentRole('Viewer')
    }

    return this.entitlements.role
  }

  handleWebsocketConnectingEvent(): void {
    this.logger.info('Changing editing allowance to false while connecting to RTS')

    this.websocketStatus = 'connecting'

    this.reloadEditingLockedState()
  }

  handleWebsocketConnectedEvent(): void {
    this.websocketStatus = 'connected'

    this.beginInitialSyncTimer()

    if (this.initialConnectionTimer) {
      clearTimeout(this.initialConnectionTimer)
    }

    this.reloadEditingLockedState()
  }

  handleWebsocketDisconnectedEvent(
    payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected],
  ): void {
    this.websocketStatus = 'disconnected'

    if (this.editorInvoker) {
      this.logger.info('Changing editing allowance to false after RTS disconnect')

      void this.editorInvoker.performClosingCeremony()
      this.reloadEditingLockedState()
    }

    if (payload.serverReason.props.code === ConnectionCloseReason.CODES.STALE_COMMIT_ID) {
      void this.refetchCommitDueToStaleContents('rts-disconnect')
    }

    if (payload.serverReason.props.code === ConnectionCloseReason.CODES.TRAFFIC_ABUSE_MAX_DU_SIZE) {
      metrics.docs_document_updates_save_error_total.increment({
        type: 'document_too_big',
      })
    } else if (payload.serverReason.props.code === ConnectionCloseReason.CODES.MESSAGE_TOO_BIG) {
      metrics.docs_document_updates_save_error_total.increment({
        type: 'update_too_big',
      })
    }
  }

  handleWebsocketFailedToConnectEvent(): void {
    this.websocketStatus = 'disconnected'

    this.reloadEditingLockedState()
  }

  async handleEvent(event: InternalEventInterface<unknown>): Promise<void> {
    if (event.type === WebsocketConnectionEvent.Disconnected) {
      this.handleWebsocketDisconnectedEvent(
        event.payload as WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected],
      )
    } else if (event.type === WebsocketConnectionEvent.FailedToConnect) {
      this.handleWebsocketFailedToConnectEvent()
    } else if (event.type === WebsocketConnectionEvent.Connected) {
      this.handleWebsocketConnectedEvent()
    } else if (event.type === WebsocketConnectionEvent.Connecting) {
      this.handleWebsocketConnectingEvent()
    } else if (event.type === WebsocketConnectionEvent.DocumentUpdateMessage) {
      const { message } =
        event.payload as WebsocketConnectionEventPayloads[WebsocketConnectionEvent.DocumentUpdateMessage]
      void this.handleDocumentUpdatesMessage(message)
    } else if (event.type === WebsocketConnectionEvent.EventMessage) {
      const { message } = event.payload as WebsocketConnectionEventPayloads[WebsocketConnectionEvent.EventMessage]
      void this.handleRealtimeServerEvent(message)
    } else if (event.type === WebsocketConnectionEvent.AckStatusChange) {
      this.handleWebsocketAckStatusChangeEvent(
        event.payload as WebsocketConnectionEventPayloads[WebsocketConnectionEvent.AckStatusChange],
      )
    } else if (event.type === WebsocketConnectionEvent.FailedToGetTokenCommitIdOutOfSync) {
      this.handleFailedToGetTokenDueToCommitIdOutOfSyncEvent()
    }
  }

  /**
   * The client was unable to get a token from the Docs API because the Commit ID the client had did not match
   * what the server was expecting.
   */
  handleFailedToGetTokenDueToCommitIdOutOfSyncEvent(): void {
    void this.refetchCommitDueToStaleContents('token-fail')
  }

  handleWebsocketAckStatusChangeEvent(
    event: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.AckStatusChange],
  ): void {
    this.isExperiencingErroredSync = event.ledger.hasErroredMessages()

    this.reloadEditingLockedState()
  }

  async editorIsReadyToReceiveInvocations(editorInvoker: ClientRequiresEditorMethods): Promise<void> {
    if (this.editorInvoker) {
      throw new Error('Editor invoker already set')
    }

    this.editorInvoker = editorInvoker

    this.logger.info('Editor is ready to receive invocations')

    this.sendInitialCommitToEditor()

    this.showEditorIfAllConnectionsReady()

    if (this.updatesReceivedWhileEditorInvokerWasNotReady.length > 0) {
      if (!this.entitlements) {
        throw new Error('Attepting to play back pending updates before keys are initialized')
      }

      this.logger.info(
        `Playing back ${this.updatesReceivedWhileEditorInvokerWasNotReady.length} realtime updates received while editor was not ready`,
      )

      for (const message of this.updatesReceivedWhileEditorInvokerWasNotReady) {
        if (message instanceof DecryptedMessage) {
          void this.handleDocumentUpdatesMessage(message)
        } else if (message instanceof ProcessedIncomingRealtimeEventMessage) {
          void this.handleRealtimeServerEvent([message])
        } else {
          throw new Error('Attempting to replay unknown message type')
        }
      }

      this.updatesReceivedWhileEditorInvokerWasNotReady.length = 0
    }
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

    const { entitlements, meta, lastCommitId } = loadResult.getValue()
    this.logger.info(`Loaded document meta with last commit id ${lastCommitId}`)

    this.entitlements = entitlements
    this.docMeta = meta
    this.userAddress = this.entitlements.keys.userOwnAddress

    const connection = this.websocketService.createConnection(this.nodeMeta, entitlements.keys, {
      commitId: () => this.commitId ?? lastCommitId,
    })

    connection.connect().catch(this.logger.error)

    this.beginInitialConnectionTimer()

    if (lastCommitId) {
      const decryptResult = await this._loadCommit.execute(this.nodeMeta, lastCommitId, entitlements.keys)
      if (decryptResult.isFailed()) {
        this.logger.error('Failed to load commit', decryptResult.getError())
        connection.destroy()

        return Result.fail(decryptResult.getError())
      }

      const decryptedCommit = decryptResult.getValue()
      this.logger.info(`Downloaded and decrypted commit with ${decryptedCommit?.numberOfUpdates()} updates`)

      this.setInitialCommit(decryptedCommit)
    }

    this.handleDocsServerConnectionReady()

    void this.loadDecryptedNode()

    return Result.ok({
      entitlements: this.entitlements,
    })
  }

  beginInitialConnectionTimer(): void {
    this.initialConnectionTimer = setTimeout(() => {
      this.logger.warn('Initial connection with RTS cannot seem to be formed in a reasonable time')
      void this.editorInvoker?.showEditor()
    }, MAX_MS_TO_WAIT_FOR_RTS_CONNECTION_BEFORE_DISPLAYING_EDITOR)
  }

  beginInitialSyncTimer(): void {
    this.initialSyncTimer = setTimeout(() => {
      this.logger.warn('Initial sync with RTS timed out')
      this.handleRealtimeConnectionReady()
    }, MAX_MS_TO_WAIT_FOR_RTS_SYNC_AFTER_CONNECT)
  }

  handleRealtimeConnectionReady(): void {
    if (this.initialSyncTimer) {
      clearTimeout(this.initialSyncTimer)
      this.initialSyncTimer = null
    }

    if (this.realtimeConnectionReady) {
      return
    }

    this.realtimeConnectionReady = true
    this.showEditorIfAllConnectionsReady()
  }

  private handleDocsServerConnectionReady(): void {
    this.docsServerConnectionReady = true
    this.showEditorIfAllConnectionsReady()
  }

  showEditorIfAllConnectionsReady(): void {
    if (!this.realtimeConnectionReady || !this.docsServerConnectionReady || !this.editorInvoker) {
      return
    }

    this.showEditor()
  }

  showEditor(): void {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    this.logger.info('Showing editor and allowing editing')

    void this.editorInvoker.showEditor()
    void this.editorInvoker.performOpeningCeremony()

    this.reloadEditingLockedState()
  }

  reloadEditingLockedState(): void {
    if (!this.editorInvoker) {
      return
    }

    if (
      this.doesUserHaveEditingPermissions() &&
      !this.isExperiencingErroredSync &&
      !this.isLockedDueToSizeContraint &&
      this.websocketStatus === 'connected'
    ) {
      this.logger.info('Changing editing locked to false')
      void this.editorInvoker.changeLockedState(false)
    } else {
      this.logger.info('Changing editing locked to true')
      void this.editorInvoker.changeLockedState(true)
    }
  }

  doesUserHaveEditingPermissions(): boolean {
    if (!this.entitlements) {
      return false
    }

    return this.entitlements.role.canEdit()
  }

  get commitId(): string | undefined {
    return this.lastCommitIdReceivedFromRtsOrApi ?? this.initialCommit?.commitId
  }

  /**
   * If the RTS rejects or drops our connection due to our commit ID not being what it has, we will refetch the document
   * and its binary from the main API and update our content.
   */
  async refetchCommitDueToStaleContents(source: 'token-fail' | 'rts-disconnect') {
    if (!this.entitlements) {
      throw new Error('Attempting to reload document before entitlements are initialized')
    }

    if (this.isRefetchingStaleCommit) {
      this.logger.info('Attempting to refetch stale commit but refetch already in progress')
      return
    }

    this.isRefetchingStaleCommit = true

    this.logger.info('Refetching document due to stale commit ID from source', source)

    const fail = (error: string) => {
      this.isRefetchingStaleCommit = false
      this.logger.error(error)
      this.eventBus.publish({
        type: DocControllerEvent.UnableToResolveCommitIdConflict,
        payload: undefined,
      })
    }

    const result = await this._getDocumentMeta.execute(this.nodeMeta)
    if (result.isFailed()) {
      fail(`Failed to reload document meta: ${result.getError()}`)

      return
    }

    const latestCommitId = result.getValue().latestCommitId()

    if (!latestCommitId || latestCommitId === this.commitId) {
      fail(!latestCommitId ? 'Reloaded commit but commit id was null' : 'Reloaded commit id is the same as current')

      return
    }

    const decryptResult = await this._loadCommit.execute(this.nodeMeta, latestCommitId, this.entitlements.keys)
    if (decryptResult.isFailed()) {
      fail(`Failed to reload or decrypt commit: ${decryptResult.getError()}`)

      return Result.fail(decryptResult.getError())
    }

    const decryptedCommit = decryptResult.getValue()
    this.logger.info(
      `Reownloaded and decrypted commit id ${decryptedCommit.commitId} with ${decryptedCommit?.numberOfUpdates()} updates`,
    )

    this.setInitialCommit(decryptedCommit)

    void this.websocketService.reconnectToDocumentWithoutDelay(this.nodeMeta)

    this.isRefetchingStaleCommit = false
  }

  setInitialCommit(decryptedCommit: DecryptedCommit | undefined): void {
    this.initialCommit = decryptedCommit

    if (!decryptedCommit) {
      return
    }

    this.sizeTracker.resetWithSize(decryptedCommit.byteSize)

    this.lastCommitIdReceivedFromRtsOrApi = decryptedCommit.commitId

    this.sendInitialCommitToEditor()

    if (decryptedCommit.needsSquash()) {
      this.logger.info('Document needs squash')

      void this.squashDocument()
    }
  }

  sendInitialCommitToEditor(): void {
    if (this.docMeta && this.initialCommit && this.editorInvoker) {
      const squashedContent = this.initialCommit.squashedRepresentation()

      this.logger.info(`Sending initial commit to editor with size ${squashedContent.byteLength} bytes`)

      void this.editorInvoker.receiveMessage({
        type: { wrapper: 'du' },
        content: squashedContent,
        origin: DocUpdateOrigin.InitialLoad,
      })
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
      this.logger.error('Failed to get decrypted link', String(error))
    }
  }

  handleAttemptingToBroadcastUpdateThatIsTooLarge(): void {
    void this.websocketService.flushPendingUpdates()

    this.logger.error(new Error('Update Too Large'))

    this.isLockedDueToSizeContraint = true

    this.reloadEditingLockedState()

    PostApplicationError(this.eventBus, {
      translatedErrorTitle: c('Error').t`Update Too Large`,
      translatedError: c('Error')
        .t`The last update you made to the document is either too large, or would exceed the total document size limit. Editing has been temporarily disabled. Your change will not be saved. Please export a copy of your document and reload the page.`,
    })
  }

  async editorRequestsPropagationOfUpdate(message: RtsMessagePayload, debugSource: BroadcastSource): Promise<void> {
    if (!this.entitlements) {
      throw new Error('Attempting to propagate update before entitlements are initialized')
    }

    if (message.type.wrapper === 'du') {
      if (!this.sizeTracker.canPostUpdateOfSize(message.content.byteLength)) {
        this.handleAttemptingToBroadcastUpdateThatIsTooLarge()
      } else {
        this.sizeTracker.incrementSize(message.content.byteLength)
        void this.websocketService.sendDocumentUpdateMessage(this.nodeMeta, message.content, debugSource)
      }
    } else if (message.type.wrapper === 'events') {
      void this.websocketService.sendEventMessage(this.nodeMeta, message.content, message.type.eventType, debugSource)
    } else {
      throw new Error('Unknown message type')
    }
  }

  public async debugSendCommitCommandToRTS(): Promise<void> {
    if (!this.entitlements) {
      throw new Error('Attempting to send commit command before entitlements are initialized')
    }

    await this.websocketService.debugSendCommitCommandToRTS(this.nodeMeta, this.entitlements.keys)
  }

  public async createInitialCommit(): Promise<void> {
    if (!this.entitlements) {
      throw new Error('Cannot create initial commit before entitlements are initialized')
    }

    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    const state = await this.editorInvoker.getDocumentState()

    const result = await this._createInitialCommit.execute(this.docMeta, state, this.entitlements.keys)

    if (result.isFailed()) {
      this.logger.error('Failed to create initial commit', result.getError())
    }
  }

  public async squashDocument(): Promise<void> {
    if (!this.docMeta || !this.entitlements) {
      throw new Error('Cannot squash document before document and entitlements are available')
    }

    if (!this.initialCommit) {
      this.logger.info('No initial commit to squash')
      return
    }

    this.logger.info('Squashing document')

    const handleVerificationObjection: SquashVerificationObjectionCallback = async () => {
      this.eventBus.publish({
        type: DocControllerEvent.SquashVerificationObjectionDecisionRequired,
        payload: undefined,
      })

      return new Promise((resolve) => {
        const disposer = this.eventBus.addEventCallback((data: DocsClientSquashVerificationObjectionMadePayload) => {
          disposer()
          resolve(data.decision)
        }, ApplicationEvent.SquashVerificationObjectionDecisionMade)
      })
    }

    const result = await this._squashDocument.execute({
      docMeta: this.docMeta,
      commitId: this.initialCommit.commitId,
      keys: this.entitlements.keys,
      handleVerificationObjection,
    })

    if (result.isFailed()) {
      this.logger.error('Failed to squash document', result.getError())
    } else {
      metrics.docs_squashes_total.increment({})
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

    const date = getPlatformFriendlyDateForFileName()
    const newName = `${this.docMeta.name} (copy ${date})`
    const state = await this.editorInvoker.getDocumentState()
    const result = await this._duplicateDocument.execute(newName, this.nodeMeta, state)

    if (result.isFailed()) {
      PostApplicationError(this.eventBus, {
        translatedError: c('Error').t`An error occurred while attempting to duplicate the document. Please try again.`,
      })

      this.logger.error('Failed to duplicate document', result.getError())
      return
    }

    const shell = result.getValue()

    void this.driveCompat.openDocument(shell)
  }

  public async createNewDocument(): Promise<void> {
    if (!this.docMeta || !this.entitlements) {
      throw new Error('Attempting to create new document before controller is initialized')
    }

    if (!this.decryptedNode) {
      throw new Error('Decrypted node not loaded when creating new document')
    }

    const date = getPlatformFriendlyDateForFileName()
    // translator: Default title for a new Proton Document (example: Untitled document 2024-04-23)
    const baseTitle = c('Title').t`Untitled document ${date}`
    const newName = `${baseTitle}`

    const result = await this._createNewDocument.execute(newName, this.nodeMeta, this.decryptedNode)

    if (result.isFailed()) {
      PostApplicationError(this.eventBus, {
        translatedError: c('Error').t`An error occurred while creating a new document. Please try again.`,
      })

      this.logger.error('Failed to create new document', result.getError())
      return
    }

    const shell = result.getValue()

    void this.driveCompat.openDocument(shell)
  }

  public async getDocumentClientId(): Promise<number | undefined> {
    if (this.editorInvoker) {
      return this.editorInvoker.getClientId()
    }

    return undefined
  }

  public async renameDocument(newName: string): Promise<TranslatedResult<void>> {
    try {
      if (!this.decryptedNode) {
        throw new Error('Decrypted node not loaded when renaming document')
      }

      if (!this.decryptedNode.parentNodeId) {
        throw new Error('Cannot rename document')
      }

      const name = await this.driveCompat.findAvailableNodeName(
        {
          volumeId: this.decryptedNode.volumeId,
          linkId: this.decryptedNode.parentNodeId,
        },
        newName,
      )
      await this.driveCompat.renameDocument(this.nodeMeta, name)
      return TranslatedResult.ok()
    } catch (e) {
      this.logger.error(getErrorString(e) ?? 'Failed to rename document')

      return TranslatedResult.failWithTranslatedError(c('Error').t`Failed to rename document. Please try again later.`)
    }
  }

  public openDocumentSharingModal(): void {
    void this.driveCompat.openDocumentSharingModal(this.nodeMeta)
  }

  private async handleRealtimeServerEvent(events: ProcessedIncomingRealtimeEventMessage[]) {
    if (!this.editorInvoker) {
      this.updatesReceivedWhileEditorInvokerWasNotReady.push(...events)

      return
    }

    const editorInvoker = this.editorInvoker

    for (const event of events) {
      switch (event.props.type) {
        case EventTypeEnum.ClientIsRequestingOtherClientsToBroadcastTheirState:
        case EventTypeEnum.ServerIsRequestingClientToBroadcastItsState:
          await editorInvoker.broadcastPresenceState()
          break
        case EventTypeEnum.ServerIsInformingClientThatTheDocumentCommitHasBeenUpdated:
          const decodedContent = utf8ArrayToString(event.props.content)
          const parsedMessage = JSON.parse(decodedContent)
          this.lastCommitIdReceivedFromRtsOrApi = parsedMessage.commitId
          break
        case EventTypeEnum.ClientHasSentACommentMessage: {
          this.eventBus.publish({
            type: DocControllerEvent.RealtimeCommentMessageReceived,
            payload: <DocControllerEventPayloads[DocControllerEvent.RealtimeCommentMessageReceived]>{
              message: event.props.content,
            },
          })

          break
        }
        case EventTypeEnum.ClientIsBroadcastingItsPresenceState: {
          void editorInvoker.receiveMessage({
            type: { wrapper: 'events', eventType: EventType.create(event.props.type).value },
            content: event.props.content,
          })

          break
        }
        case EventTypeEnum.ServerHasMoreOrLessGivenTheClientEverythingItHas:
          this.handleRealtimeConnectionReady()
          break
        case EventTypeEnum.ServerIsPlacingEmptyActivityIndicatorInStreamToIndicateTheStreamIsStillActive:
        case EventTypeEnum.ClientIsDebugRequestingServerToPerformCommit:
        case EventTypeEnum.ServerIsReadyToAcceptClientMessages:
        case EventTypeEnum.ServerIsNotifyingOtherServersToDisconnectAllClientsFromTheStream:
          break
        default:
          assertUnreachableAndLog(event.props)
      }
    }
  }

  async handleDocumentUpdatesMessage(message: DecryptedMessage) {
    if (!this.editorInvoker) {
      this.updatesReceivedWhileEditorInvokerWasNotReady.push(message)

      return
    }

    this.sizeTracker.incrementSize(message.byteSize())

    void this.editorInvoker.receiveMessage({
      type: { wrapper: 'du' },
      content: message.content,
    })
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

  async exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs) {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    void this._exportAndDownload.execute(this.editorInvoker, this.getSureDocument(), format)
  }

  async printAsPDF() {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    void this.editorInvoker.printAsPDF()
  }

  deinit() {}
}
