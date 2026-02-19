import { c } from 'ttag'
import type { WebsocketConnectionInterface } from '@proton/docs-shared'
import {
  assertUnreachableAndLog,
  DecryptedMessage,
  ProcessedIncomingRealtimeEventMessage,
  Result,
  type BroadcastSource,
  type InternalEventBusInterface,
  type InternalEventHandlerInterface,
  type InternalEventInterface,
  type RtsMessagePayload,
} from '@proton/docs-shared'
import type { WebsocketServiceInterface } from '../Services/Websockets/WebsocketServiceInterface'
import type { DocumentEntitlements } from '../Types/DocumentEntitlements'
import { WebsocketConnectionEvent } from '../Realtime/WebsocketEvent/WebsocketConnectionEvent'
import type { WebsocketConnectionEventPayloads } from '../Realtime/WebsocketEvent/WebsocketConnectionEventPayloads'
import { ConnectionCloseReason, EventTypeEnum } from '@proton/docs-proto'
import { uint8ArrayToUtf8String } from '@proton/crypto/lib/utils'
import type { DocSizeTrackerEventPayload, DocSizeTracker } from '../SizeTracker/SizeTracker'
import { DocSizeTrackerEvent } from '../SizeTracker/SizeTracker'
import { PostApplicationError } from '../Application/ApplicationEvent'
import type { RealtimeControllerInterface } from './RealtimeControllerInterface'
import type { DocumentState, PublicDocumentState } from '../State/DocumentState'
import type { LoggerInterface } from '@proton/utils/logs'
import metrics from '@proton/metrics'
import type { DocControllerEventPayloads } from '../AuthenticatedDocController/AuthenticatedDocControllerEvent'
import { DocControllerEvent } from '../AuthenticatedDocController/AuthenticatedDocControllerEvent'
import type { GetDocumentMeta } from '../UseCase/GetDocumentMeta'
import type { FetchDecryptedCommit } from '../UseCase/FetchDecryptedCommit'
import { isDocumentUpdateChunkingEnabled } from '../utils/document-update-chunking'
import type { UnleashClient } from '@proton/unleash'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import { SquashErrorEvent } from '../UseCase/SquashDocument'

/**
 * @TODO DRVDOC-802
 * This should be an upper bound we should not expect to hit, because we expect the RTS to tell us it has given us all updates
 * in a timely manner. However, due to DRVDOC-802, this event is not currently received, so we have lowered this value to something
 * nominal as a temporary workaround.
 */
export const MAX_MS_TO_WAIT_FOR_RTS_SYNC_AFTER_CONNECT = 100

export class RealtimeController implements InternalEventHandlerInterface, RealtimeControllerInterface {
  initialSyncTimer: ReturnType<typeof setTimeout> | null = null

  isDestroyed = false
  abortWebsocketConnectionAttempt = false
  isRefetchingStaleCommit = false

  readonly updatesReceivedWhileParentNotReady: (DecryptedMessage | ProcessedIncomingRealtimeEventMessage)[] = []

  constructor(
    readonly websocketService: WebsocketServiceInterface,
    private readonly eventBus: InternalEventBusInterface,
    readonly documentState: DocumentState | PublicDocumentState,
    readonly _fetchDecryptedCommit: FetchDecryptedCommit,
    readonly _getDocumentMeta: GetDocumentMeta,
    readonly logger: LoggerInterface,
    readonly unleashClient: UnleashClient,
    readonly documentType: DocumentType,
    readonly sizeTracker: DocSizeTracker,
    readonly visibility: 'public' | 'private',
  ) {
    eventBus.addEventHandler(this, WebsocketConnectionEvent.Connecting)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.FailedToConnect)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.ConnectedAndReady)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.Disconnected)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.DocumentUpdateMessage)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.EventMessage)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.AckStatusChange)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.FailedToGetTokenCommitIdOutOfSync)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.NeedsToBeInReadonlyMode)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.ImportUpdateSuccessful)
    eventBus.addEventHandler(this, DocSizeTrackerEvent)
    eventBus.addEventHandler(this, SquashErrorEvent)

    documentState.subscribeToProperty('editorReady', (value) => {
      if (value) {
        this.onEditorReadyEvent()
      }
    })

    documentState.subscribeToProperty('baseCommit', (value) => {
      if (value) {
        this.resetSizeTracker(value.byteSize)
      }
    })

    documentState.subscribeToEvent('EditorRequestsPropagationOfUpdate', (payload) => {
      this.propagateUpdate(payload.message, payload.debugSource)
    })

    documentState.subscribeToEvent('DriveFileConversionToDocBegan', () => {
      this.abortWebsocketConnectionAttempt = true
      this.closeConnection()
    })

    documentState.subscribeToEvent('DriveFileConversionToDocSucceeded', () => {
      this.abortWebsocketConnectionAttempt = false
      /** Token cache must be invalidated since a conversion entails seeding the initial commit, which changes our current commit id */
      void this.reconnect({ invalidateTokenCache: true })
    })

    documentState.subscribeToEvent('DebugMenuRequestingCommitWithRTS', (payload) => {
      void this.debugSendCommitCommandToRTS(payload)
    })

    documentState.subscribeToProperty('currentCommitId', (value, previousValue) => {
      const commitIdUpgraded = value && previousValue && value !== previousValue
      if (
        commitIdUpgraded &&
        !this.websocketService.isConnected(this.documentState.getProperty('entitlements').nodeMeta)
      ) {
        this.logger.info('Reconnecting to RTS because currentCommitId changed and we are not connected')
        /** Token cache must be invalidated since commit state changed */
        void this.reconnect({ invalidateTokenCache: true })
      }
    })

    documentState.subscribeToProperty('documentTrashState', (value, previousValue) => {
      if (
        value === 'not_trashed' &&
        previousValue === 'trashed' &&
        !this.websocketService.isConnected(this.documentState.getProperty('entitlements').nodeMeta)
      ) {
        this.logger.info('Reconnecting to RTS because document was untrashed')
        /** No need to invalidate token cache since no commit state changed */
        void this.reconnect({ invalidateTokenCache: false })
      }
    })

    websocketService.setDocumentType(documentType)
  }

  destroy(): void {
    this.isDestroyed = true

    if (this.initialSyncTimer) {
      clearTimeout(this.initialSyncTimer)
    }
  }

  public resetSizeTracker(size: number): void {
    this.sizeTracker.resetWithSize(size)
  }

  public closeConnection(): void {
    this.websocketService.closeConnection(this.documentState.getProperty('entitlements').nodeMeta)
  }

  public async reconnect(options: { invalidateTokenCache: boolean }): Promise<void> {
    await this.websocketService.reconnectToDocumentWithoutDelay(
      this.documentState.getProperty('entitlements').nodeMeta,
      options,
    )
  }

  public async debugSendCommitCommandToRTS(entitlements: DocumentEntitlements): Promise<void> {
    await this.websocketService.debugSendCommitCommandToRTS(
      this.documentState.getProperty('entitlements').nodeMeta,
      entitlements.keys,
    )
  }

  onEditorReadyEvent(): void {
    if (this.updatesReceivedWhileParentNotReady.length > 0) {
      this.logger.info(
        `Playing back ${this.updatesReceivedWhileParentNotReady.length} realtime updates received while editor was not ready`,
      )

      for (const message of this.updatesReceivedWhileParentNotReady) {
        if (message instanceof DecryptedMessage) {
          void this.handleDocumentUpdatesMessage(message)
        } else if (message instanceof ProcessedIncomingRealtimeEventMessage) {
          void this.handleRealtimeServerEvent([message])
        } else {
          throw new Error('Attempting to replay unknown message type')
        }
      }

      this.updatesReceivedWhileParentNotReady.length = 0
    }
  }

  async handleEvent(event: InternalEventInterface<unknown>): Promise<void> {
    if (event.type === WebsocketConnectionEvent.Disconnected) {
      this.handleWebsocketDisconnectedEvent(
        event.payload as WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected],
      )
    } else if (event.type === WebsocketConnectionEvent.FailedToConnect) {
      this.handleWebsocketFailedToConnectEvent()
    } else if (event.type === WebsocketConnectionEvent.DidNotReceiveReadyMessageInTime) {
      this.documentState.setProperty('realtimeConnectionTimedOut', true)
    } else if (event.type === WebsocketConnectionEvent.ConnectedAndReady) {
      this.handleWebsocketConnectedEvent()
    } else if (event.type === WebsocketConnectionEvent.Connecting) {
      this.handleWebsocketConnectingEvent()
    } else if (event.type === WebsocketConnectionEvent.ImportUpdateSuccessful) {
      this.handleImportUpdateSuccessfulEvent(
        event.payload as WebsocketConnectionEventPayloads[WebsocketConnectionEvent.ImportUpdateSuccessful],
      )
    } else if (event.type === WebsocketConnectionEvent.DocumentUpdateMessage) {
      const { message } =
        event.payload as WebsocketConnectionEventPayloads[WebsocketConnectionEvent.DocumentUpdateMessage]
      try {
        void this.handleDocumentUpdatesMessage(message)
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(error)
        }
        PostApplicationError(this.eventBus, {
          translatedError: c('Error')
            .t`There was an error processing updates to the document. Please reload the page and try again.`,
        })
        this.documentState.setProperty('editorHasRenderingIssue', true)
      }
    } else if (event.type === WebsocketConnectionEvent.EventMessage) {
      const { message } = event.payload as WebsocketConnectionEventPayloads[WebsocketConnectionEvent.EventMessage]
      void this.handleRealtimeServerEvent(message)
    } else if (event.type === WebsocketConnectionEvent.AckStatusChange) {
      this.handleWebsocketAckStatusChangeEvent(
        event.payload as WebsocketConnectionEventPayloads[WebsocketConnectionEvent.AckStatusChange],
      )
    } else if (event.type === WebsocketConnectionEvent.FailedToGetTokenCommitIdOutOfSync) {
      /**
       * The client was unable to get a token from the Docs API because the Commit ID the client had did not match
       * what the server was expecting.
       */
      void this.refetchCommitDueToStaleContents('token-fail')
    } else if (event.type === WebsocketConnectionEvent.NeedsToBeInReadonlyMode) {
      this.documentState.setProperty('realtimeShouldBeShownInReadonlyMode', true)
    } else if (event.type === SquashErrorEvent) {
      PostApplicationError(this.eventBus, {
        translatedError: c('Error').t`We are having trouble syncing your document. Please refresh the page.`,
      })
      this.documentState.setProperty('realtimeIsLockedDueToSquashError', true)
    } else if (event.type === DocSizeTrackerEvent) {
      this.documentState.setProperty('realtimeIsLockedDueToSizeContraint', true)
      if ((event.payload as DocSizeTrackerEventPayload).exceededMaxSize) {
        this.websocketService.destroy()
      }
    } else {
      return
    }
  }

  async handleDocumentUpdatesMessage(message: DecryptedMessage) {
    if (!this.documentState.getProperty('editorReady')) {
      this.updatesReceivedWhileParentNotReady.push(message)

      return
    }

    this.documentState.emitEvent({
      name: 'RealtimeReceivedDocumentUpdate',
      payload: message,
    })
  }

  handleImportUpdateSuccessfulEvent(
    event: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.ImportUpdateSuccessful],
  ) {
    void this.documentState.emitEvent({
      name: 'ImportUpdateSuccessful',
      payload: {
        uuid: event.uuid,
      },
    })
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

    this.documentState.setProperty('realtimeConnectionTimedOut', false)

    if (this.documentState.getProperty('realtimeReadyToBroadcast')) {
      return
    }

    this.documentState.setProperty('realtimeReadyToBroadcast', true)
  }

  handleWebsocketConnectingEvent(): void {
    this.documentState.setProperty('realtimeStatus', 'connecting')

    this.logger.info('Websocket connecting')
  }

  handleWebsocketConnectedEvent(): void {
    this.documentState.setProperty('realtimeStatus', 'connected')

    this.beginInitialSyncTimer()
  }

  handleWebsocketDisconnectedEvent(
    payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected],
  ): void {
    this.documentState.setProperty('realtimeStatus', 'disconnected')

    const reason = payload.serverReason

    this.documentState.emitEvent({ name: 'RealtimeConnectionClosed', payload: reason })

    if (reason.props.code === ConnectionCloseReason.CODES.STALE_COMMIT_ID) {
      void this.refetchCommitDueToStaleContents('rts-disconnect')
    }
    if (reason.props.code === ConnectionCloseReason.CODES.READ_ONLY_MODE_REQUIRED) {
      this.documentState.setProperty('realtimeShouldBeShownInReadonlyMode', true)
    }

    if (reason.props.code === ConnectionCloseReason.CODES.TRAFFIC_ABUSE_MAX_DU_SIZE) {
      metrics.docs_document_updates_save_error_total.increment({
        type: 'document_too_big',
      })
    } else if (reason.props.code === ConnectionCloseReason.CODES.MESSAGE_TOO_BIG) {
      metrics.docs_document_updates_save_error_total.increment({
        type: 'update_too_big',
      })
    }
  }

  handleWebsocketFailedToConnectEvent(): void {
    this.documentState.setProperty('realtimeStatus', 'disconnected')

    this.documentState.emitEvent({ name: 'RealtimeFailedToConnect', payload: undefined })
  }

  handleWebsocketAckStatusChangeEvent(
    event: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.AckStatusChange],
  ): void {
    this.documentState.setProperty('realtimeIsExperiencingErroredSync', event.ledger.hasErroredMessages())
  }

  initializeConnection(): WebsocketConnectionInterface {
    const connection = this.websocketService.createConnection(this.documentState)

    connection
      .connect(() => {
        return this.abortWebsocketConnectionAttempt
      })
      .catch((e) => {
        this.logger.error(e)
      })

    return connection
  }

  public propagateUpdate(message: RtsMessagePayload, debugSource: BroadcastSource): void {
    if (message.type.wrapper === 'du') {
      if (
        !isDocumentUpdateChunkingEnabled(this.unleashClient, this.documentType) &&
        !this.sizeTracker.canPostUpdateOfSize(message.content.byteLength)
      ) {
        this.handleAttemptingToBroadcastUpdateThatIsTooLarge()
      } else {
        void this.websocketService.sendDocumentUpdateMessage(
          this.documentState.getProperty('entitlements').nodeMeta,
          message.content,
          debugSource,
          message.type.uuid,
        )
      }
    } else if (message.type.wrapper === 'conversion') {
      this.logger.info('Received conversion message, handling initial conversion content')
      void this.websocketService.handleInitialConversionContent(
        this.documentState.getProperty('entitlements').nodeMeta,
        message.content,
        (content) => {
          this.logger.info('Creating initial commit from conversion content')
          this.documentState.emitEvent({
            name: 'CommitInitialConversionContent',
            payload: content,
          })
        },
      )
    } else if (message.type.wrapper === 'events') {
      void this.websocketService.sendEventMessage(
        this.documentState.getProperty('entitlements').nodeMeta,
        message.content,
        message.type.eventType,
        debugSource,
      )
    } else {
      throw new Error('Unknown message type')
    }
  }

  handleAttemptingToBroadcastUpdateThatIsTooLarge(): void {
    void this.websocketService.flushPendingUpdates()

    this.logger.error(new Error('Update Too Large'))

    this.documentState.setProperty('realtimeIsLockedDueToSizeContraint', true)

    PostApplicationError(this.eventBus, {
      translatedErrorTitle: c('Error').t`Update Too Large`,
      translatedError: c('Error')
        .t`The last update you made to the document is either too large, or would exceed the total document size limit. Editing has been temporarily disabled. Your change will not be saved. Please export a copy of your document and reload the page.`,
    })

    this.documentState.emitEvent({ name: 'RealtimeAttemptingToSendUpdateThatIsTooLarge', payload: undefined })
  }

  async handleRealtimeServerEvent(events: ProcessedIncomingRealtimeEventMessage[]) {
    if (!this.documentState.getProperty('editorReady')) {
      this.updatesReceivedWhileParentNotReady.push(...events)

      return
    }

    for (const event of events) {
      switch (event.props.type) {
        case EventTypeEnum.ClientIsRequestingOtherClientsToBroadcastTheirState:
        case EventTypeEnum.ServerIsRequestingClientToBroadcastItsState:
          this.documentState.emitEvent({ name: 'RealtimeRequestingClientToBroadcastItsState', payload: undefined })
          break
        case EventTypeEnum.ServerIsInformingClientThatTheDocumentCommitHasBeenUpdated:
          const decodedContent = uint8ArrayToUtf8String(event.props.content)
          const parsedMessage = JSON.parse(decodedContent)
          this.documentState.setProperty('currentCommitId', parsedMessage.commitId)
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
          this.documentState.emitEvent({
            name: 'RealtimeReceivedOtherClientPresenceState',
            payload: event.props.content,
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

  /**
   * If the RTS rejects or drops our connection due to our commit ID not being what it has, we will refetch the document
   * and its binary from the main API and update our content.
   */
  async refetchCommitDueToStaleContents(source: 'token-fail' | 'rts-disconnect') {
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

    const nodeMeta = this.documentState.getProperty('entitlements').nodeMeta

    const result = await this._getDocumentMeta.execute(nodeMeta)
    if (result.isFailed()) {
      fail(`Failed to reload document meta: ${result.getErrorObject()}`)

      return
    }

    const latestCommitId = result.getValue().latestCommitId()

    if (!latestCommitId) {
      fail('Reloaded commit but commit id was null')

      return
    }

    if (latestCommitId === this.documentState.getProperty('currentCommitId')) {
      fail(
        `Reloaded commit id ${latestCommitId} is the same as current commit id: ${this.documentState.getProperty('currentCommitId')}`,
      )

      return
    }

    const entitlements = this.documentState.getProperty('entitlements')

    const decryptResult = await this._fetchDecryptedCommit.execute(
      nodeMeta,
      latestCommitId,
      entitlements.keys.documentContentKey,
    )
    if (decryptResult.isFailed()) {
      fail(`Failed to reload or decrypt commit: ${decryptResult.getError()}`)

      return Result.fail(decryptResult.getError())
    }

    const decryptedCommit = decryptResult.getValue()

    this.logger.info(
      `Reownloaded and decrypted commit id ${decryptedCommit.commitId} with ${decryptedCommit?.numberOfMessages()} updates`,
    )

    this.documentState.setProperty('baseCommit', decryptedCommit)
    /**
     * This will trigger a reconnect since we observe the currentCommitId in this class and trigger a reconnect.
     * Note that we also explicitely clear the token cache, even though the websocket connection class also observers
     * this property and clears it own cache, just in case of a race condition where our observer is triggered first
     * before the websocket observer can trigger and clear its cache. So it will get cleared twice.
     * */
    this.documentState.setProperty('currentCommitId', decryptedCommit.commitId)

    this.isRefetchingStaleCommit = false
  }
}
