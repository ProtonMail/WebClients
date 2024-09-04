import { utf8ArrayToString } from '@proton/crypto/lib/utils'
import { c } from 'ttag'
import type { LoggerInterface } from '@proton/utils/logs'
import type { SquashDocument } from '../../UseCase/SquashDocument'
import type { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import type { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import type { DecryptedNode, DriveCompat, NodeMeta } from '@proton/drive-store'
import type {
  InternalEventBusInterface,
  ClientRequiresEditorMethods,
  RtsMessagePayload,
  DocumentMetaInterface,
  DocsAwarenessStateChangeData,
  InternalEventHandlerInterface,
  InternalEventInterface,
  BroadcastSource,
  DataTypesThatDocumentCanBeExportedAs,
  DocTrashState,
} from '@proton/docs-shared'
import {
  DocAwarenessEvent,
  DocUpdateOrigin,
  DecryptedMessage,
  ProcessedIncomingRealtimeEventMessage,
  DocumentRole,
  assertUnreachableAndLog,
} from '@proton/docs-shared'
import { EventType, EventTypeEnum, ConnectionCloseReason } from '@proton/docs-proto'
import type { LoadDocument } from '../../UseCase/LoadDocument'
import type { DecryptedCommit } from '../../Models/DecryptedCommit'
import type { DocControllerInterface } from './DocControllerInterface'
import type { SeedInitialCommit } from '../../UseCase/SeedInitialCommit'
import type { DocLoadSuccessResult } from './DocLoadSuccessResult'
import type { UserState } from '@lexical/yjs'
import type { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import { getErrorString } from '../../Util/GetErrorString'
import { NativeVersionHistory } from '../../VersionHistory'
import type { WebsocketServiceInterface } from '../../Services/Websockets/WebsocketServiceInterface'
import type { DocControllerEventPayloads } from './DocControllerEvent'
import { DocControllerEvent } from './DocControllerEvent'
import metrics from '@proton/metrics'
import type { DocsClientSquashVerificationObjectionMadePayload } from '../../Application/ApplicationEvent'
import { ApplicationEvent, PostApplicationError } from '../../Application/ApplicationEvent'
import type { SquashVerificationObjectionCallback } from '../../Types/SquashVerificationObjection'
import type { LoadCommit } from '../../UseCase/LoadCommit'
import { TranslatedResult } from '../../Domain/Result/TranslatedResult'
import { Result } from '../../Domain/Result/Result'
import type { ExportAndDownload } from '../../UseCase/ExportAndDownload'
import type { DocumentEntitlements } from '../../Types/DocumentEntitlements'
import type { WebsocketConnectionEventPayloads } from '../../Realtime/WebsocketEvent/WebsocketConnectionEventPayloads'
import { WebsocketConnectionEvent } from '../../Realtime/WebsocketEvent/WebsocketConnectionEvent'
import { DocSizeTracker } from './SizeTracker'
import { getPlatformFriendlyDateForFileName } from '../../Util/PlatformFriendlyFileNameDate'
import { DocParticipantTracker, ParticipantTrackerEvent } from './DocParticipantTracker'
import type { SerializedEditorState } from 'lexical'
import { metricsBucketNumberForUpdateCount } from '../../Util/bucketNumberForUpdateCount'
import { MAX_DOC_SIZE } from '../../Models/Constants'
import type { HttpsProtonMeDocsReadonlyModeDocumentsTotalV1SchemaJson } from '@proton/metrics/types/docs_readonly_mode_documents_total_v1.schema'

/**
 * @TODO DRVDOC-802
 * This should be an upper bound we should not expect to hit, because we expect the RTS to tell us it has given us all updates
 * in a timely manner. However, due to DRVDOC-802, this event is not currently received, so we have lowered this value to something
 * nominal as a temporary workaround.
 */
const MAX_MS_TO_WAIT_FOR_RTS_SYNC_AFTER_CONNECT = 100
const MAX_MS_TO_WAIT_FOR_RTS_CONNECTION_BEFORE_DISPLAYING_EDITOR = 3_000

/**
 * Controls the lifecycle of a single document.
 */
export class DocController implements DocControllerInterface, InternalEventHandlerInterface {
  entitlements: DocumentEntitlements | null = null
  private decryptedNode?: DecryptedNode
  editorInvoker?: ClientRequiresEditorMethods
  docMeta!: DocumentMetaInterface
  private initialCommit?: DecryptedCommit
  lastCommitIdReceivedFromRtsOrApi?: string
  private initialSyncTimer: ReturnType<typeof setTimeout> | null = null
  private initialConnectionTimer: ReturnType<typeof setTimeout> | null = null
  isExperiencingErroredSync = false
  isLockedDueToSizeContraint = false
  realtimeConnectionReady = false
  docsServerConnectionReady = false
  didAlreadyReceiveEditorReadyEvent = false
  isRefetchingStaleCommit = false
  hasEditorRenderingIssue = false
  readonly updatesReceivedWhileEditorInvokerWasNotReady: (DecryptedMessage | ProcessedIncomingRealtimeEventMessage)[] =
    []
  websocketStatus: 'connected' | 'connecting' | 'disconnected' = 'disconnected'
  sizeTracker: DocSizeTracker = new DocSizeTracker()
  abortWebsocketConnectionAttempt = false
  isDestroyed = false
  trashState?: DocTrashState

  public userAddress?: string
  readonly participantTracker = new DocParticipantTracker(this.eventBus)

  constructor(
    private readonly nodeMeta: NodeMeta,
    private driveCompat: DriveCompat,
    private _squashDocument: SquashDocument,
    readonly _createInitialCommit: SeedInitialCommit,
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
    eventBus.addEventHandler(this, ParticipantTrackerEvent.DocumentLimitBreached)
    eventBus.addEventHandler(this, ParticipantTrackerEvent.DocumentLimitUnbreached)
  }

  destroy(): void {
    this.isDestroyed = true

    if (this.initialSyncTimer) {
      clearTimeout(this.initialSyncTimer)
    }
    if (this.initialConnectionTimer) {
      clearTimeout(this.initialConnectionTimer)
    }
  }

  public get role(): DocumentRole {
    if (!this.entitlements) {
      return new DocumentRole('Viewer')
    }

    return this.entitlements.role
  }

  handleParticipationLimitReachedEvent(): void {
    this.reloadEditingLockedState()
  }

  handleParticipationLimitUnreachedEvent(): void {
    this.reloadEditingLockedState()
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

    await this.sendInitialCommitToEditor()

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

  public getSureDocument(): DocumentMetaInterface {
    if (!this.docMeta) {
      throw new Error('Attempting to access document before it is initialized')
    }

    return this.docMeta
  }

  public async initialize(): Promise<Result<DocLoadSuccessResult>> {
    const startTime = Date.now()

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

    connection
      .connect(() => {
        return this.abortWebsocketConnectionAttempt
      })
      .catch((e) => {
        this.logger.error(e)
      })

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

      void this.setInitialCommit(decryptedCommit)
    }

    this.handleDocsServerConnectionReady()

    void this.loadDecryptedNode()

    const endTime = Date.now()
    const timeToLoadInSeconds = (endTime - startTime) / 1000
    metrics.docs_time_load_document_histogram.observe({
      Labels: {
        updates: metricsBucketNumberForUpdateCount(this.initialCommit?.numberOfUpdates() ?? 0),
      },
      Value: timeToLoadInSeconds,
    })

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
      this.logger.warn('Client did not receive ServerHasMoreOrLessGivenTheClientEverythingItHas event in time')
      this.handleRealtimeConnectionReady()
    }, MAX_MS_TO_WAIT_FOR_RTS_SYNC_AFTER_CONNECT)
  }

  handleRealtimeConnectionReady(): void {
    if (this.isDestroyed) {
      return
    }

    if (this.initialSyncTimer) {
      clearTimeout(this.initialSyncTimer)
      this.initialSyncTimer = null
    }

    if (this.realtimeConnectionReady) {
      return
    }

    this.realtimeConnectionReady = true
    this.showEditorIfAllConnectionsReady()

    this.eventBus.publish({
      type: DocControllerEvent.DidLoadInitialEditorContent,
      payload: undefined,
    })
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

    if (this.participantTracker.isParticipantLimitReached() && !this.doesUserOwnDocument()) {
      this.logger.info('Max users. Changing editing locked to true')
      void this.editorInvoker.changeLockedState(true)

      return
    }

    if (
      this.doesUserHaveEditingPermissions() &&
      !this.isExperiencingErroredSync &&
      !this.isLockedDueToSizeContraint &&
      !this.hasEditorRenderingIssue &&
      this.websocketStatus === 'connected' &&
      this.trashState !== 'trashed'
    ) {
      this.logger.info('Changing editing locked to false')
      void this.editorInvoker.changeLockedState(false)
    } else {
      this.logger.info('Changing editing locked to true')
      void this.editorInvoker.changeLockedState(true)
      this.incrementMetricsReadonlyState()
    }
  }

  incrementMetricsReadonlyState(): void {
    let reason: HttpsProtonMeDocsReadonlyModeDocumentsTotalV1SchemaJson['Labels']['reason'] = 'unknown'

    if (this.participantTracker.isParticipantLimitReached()) {
      reason = 'user_limit_reached'
    } else if (!this.doesUserHaveEditingPermissions()) {
      reason = 'no_editing_permissions'
    } else if (this.isExperiencingErroredSync) {
      reason = 'errored_sync'
    } else if (this.isLockedDueToSizeContraint) {
      reason = 'size_limit'
    } else if (this.websocketStatus !== 'connected') {
      reason = 'not_connected'
    }

    metrics.docs_readonly_mode_documents_total.increment({
      reason: reason,
    })
  }

  doesUserHaveEditingPermissions(): boolean {
    if (!this.entitlements) {
      return false
    }

    return this.entitlements.role.canEdit()
  }

  doesUserOwnDocument(): boolean {
    if (!this.entitlements) {
      return false
    }

    return this.entitlements.role.isAdmin()
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

    void this.setInitialCommit(decryptedCommit)

    void this.websocketService.reconnectToDocumentWithoutDelay(this.nodeMeta)

    this.isRefetchingStaleCommit = false
  }

  async setInitialCommit(decryptedCommit: DecryptedCommit | undefined): Promise<void> {
    this.initialCommit = decryptedCommit

    if (!decryptedCommit) {
      return
    }

    this.sizeTracker.resetWithSize(decryptedCommit.byteSize)

    this.lastCommitIdReceivedFromRtsOrApi = decryptedCommit.commitId

    await this.sendInitialCommitToEditor()

    if (decryptedCommit.needsSquash()) {
      this.logger.info('Document needs squash')

      void this.squashDocument()
    }
  }

  async sendInitialCommitToEditor(): Promise<void> {
    if (this.docMeta && this.initialCommit && this.editorInvoker) {
      const squashedContent = this.initialCommit.squashedRepresentation()

      this.logger.info(`Sending initial commit to editor with size ${squashedContent.byteLength} bytes`)

      await this.editorInvoker.receiveMessage({
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

  async refreshNodeAndDocMeta(): Promise<void> {
    this.decryptedNode = await this.driveCompat.getNode(this.nodeMeta)
    const newDoc = this.docMeta.copyWithNewValues({ name: this.decryptedNode.name })
    this.docMeta = newDoc
  }

  async loadDecryptedNode(): Promise<void> {
    try {
      await this.refreshNodeAndDocMeta()
      this.setTrashState(this.decryptedNode?.trashed ? 'trashed' : 'not_trashed')
      this.eventBus.publish<DocControllerEventPayloads['DidLoadDocumentTitle']>({
        type: DocControllerEvent.DidLoadDocumentTitle,
        payload: { title: this.docMeta.name },
      })
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

  editorIsRequestingToLockAfterRenderingIssue(): void {
    this.hasEditorRenderingIssue = true

    this.reloadEditingLockedState()
  }

  async editorRequestsPropagationOfUpdate(message: RtsMessagePayload, debugSource: BroadcastSource): Promise<void> {
    if (this.isDestroyed) {
      return
    }

    if (!this.entitlements) {
      throw new Error('Attempting to propagate update before entitlements are initialized')
    }

    if (message.type.wrapper === 'conversion') {
      await this.handleEditorProvidingInitialConversionContent(message.content)
      return
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

  async handleEditorProvidingInitialConversionContent(content: Uint8Array): Promise<void> {
    this.logger.info('Received conversion content from editor, seeding initial commit of size', content.byteLength)

    this.abortWebsocketConnectionAttempt = true
    this.websocketService.closeConnection(this.nodeMeta)

    if (content.byteLength >= MAX_DOC_SIZE) {
      PostApplicationError(this.eventBus, {
        translatedError: c('Error')
          .t`The document you are trying to convert is too large. This may occur if the document has a large number of images or other media. Please try again with a smaller document.`,
        irrecoverable: true,
      })
      this.logger.info('Initial conversion content is too large')
      return
    }

    const result = await this.createInitialCommit(content)

    this.abortWebsocketConnectionAttempt = false

    if (result.isFailed()) {
      PostApplicationError(this.eventBus, {
        translatedError: c('Error').t`An error occurred while attempting to convert the document. Please try again.`,
        irrecoverable: true,
      })

      this.logger.error('Failed to seed document', result.getError())
      return
    }

    void this.websocketService.reconnectToDocumentWithoutDelay(this.nodeMeta)
  }

  public async debugSendCommitCommandToRTS(): Promise<void> {
    if (!this.entitlements) {
      throw new Error('Attempting to send commit command before entitlements are initialized')
    }

    await this.websocketService.debugSendCommitCommandToRTS(this.nodeMeta, this.entitlements.keys)
  }

  public async createInitialCommit(content?: Uint8Array): Promise<Result<unknown>> {
    if (!this.entitlements) {
      throw new Error('Cannot create initial commit before entitlements are initialized')
    }

    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    const state = content ?? (await this.editorInvoker.getDocumentState())

    const result = await this._createInitialCommit.execute(this.docMeta, state, this.entitlements.keys)

    if (result.isFailed()) {
      this.logger.error('Failed to create initial commit', result.getError())
    } else {
      const resultValue = result.getValue()
      this.lastCommitIdReceivedFromRtsOrApi = resultValue.commitId
    }

    return result
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

    const state = await this.editorInvoker.exportData('yjs')
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
      await this.refreshNodeAndDocMeta()
      return TranslatedResult.ok()
    } catch (e) {
      this.logger.error(getErrorString(e) ?? 'Failed to rename document')

      return TranslatedResult.failWithTranslatedError(c('Error').t`Failed to rename document. Please try again later.`)
    }
  }

  publishDocumentTrashStateUpdated() {
    this.eventBus.publish({ type: DocControllerEvent.DocumentTrashStateUpdated, payload: undefined })
  }

  public async trashDocument(): Promise<void> {
    this.setTrashState('trashing')
    const node = await this.driveCompat.getNode(this.nodeMeta)
    const parentLinkId = node.parentNodeId || (await this.driveCompat.getMyFilesNodeMeta()).linkId
    await this.driveCompat.trashDocument(this.docMeta, parentLinkId)
    await this.refreshNodeAndDocMeta()
    this.setTrashState('trashed')
    this.reloadEditingLockedState()
  }

  public async restoreDocument(): Promise<void> {
    this.setTrashState('restoring')
    const node = await this.driveCompat.getNode(this.nodeMeta)
    const parentLinkId = node.parentNodeId || (await this.driveCompat.getMyFilesNodeMeta()).linkId
    await this.driveCompat.restoreDocument(this.docMeta, parentLinkId)
    await this.refreshNodeAndDocMeta()
    this.setTrashState('not_trashed')
    this.reloadEditingLockedState()
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
    this.participantTracker.updateParticipantsFromUserStates(states)

    this.eventBus.publish<DocsAwarenessStateChangeData>({
      type: DocAwarenessEvent.AwarenessStateChange,
      payload: {
        states,
      },
    })
  }

  showCommentsPanel(): void {
    if (!this.editorInvoker) {
      return
    }

    void this.editorInvoker.showCommentsPanel()
  }

  async exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void> {
    if (!this.editorInvoker || !this.decryptedNode) {
      throw new Error(`Attepting to export document before editor invoker or decrypted node is initialized`)
    }

    const data = await this.editorInvoker.exportData(format)

    await this._exportAndDownload.execute(data, this.decryptedNode?.name, format)
  }

  async printAsPDF(): Promise<void> {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    void this.editorInvoker.printAsPDF()
  }

  async getEditorJSON(): Promise<SerializedEditorState | undefined> {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    const json = await this.editorInvoker.getCurrentEditorState()
    return json
  }

  getTrashState(): DocTrashState | undefined {
    return this.trashState
  }

  setTrashState(newState: DocTrashState): void {
    this.trashState = newState
    this.publishDocumentTrashStateUpdated()
  }

  async toggleDebugTreeView(): Promise<void> {
    void this.editorInvoker?.toggleDebugTreeView()
  }

  deinit() {}
}
