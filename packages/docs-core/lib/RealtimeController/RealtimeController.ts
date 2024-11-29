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
import { utf8ArrayToString } from '@proton/crypto/lib/utils'
import { DocSizeTracker } from '../SizeTracker/SizeTracker'
import { PostApplicationError } from '../Application/ApplicationEvent'
import type { RealtimeControllerInterface } from './RealtimeControllerInterface'
import type { DocumentState, PublicDocumentState } from '../State/DocumentState'
import type { LoggerInterface } from '@proton/utils/logs'
import metrics from '@proton/metrics'
import type { DocControllerEventPayloads } from '../AuthenticatedDocController/AuthenticatedDocControllerEvent'
import { DocControllerEvent } from '../AuthenticatedDocController/AuthenticatedDocControllerEvent'
import type { GetDocumentMeta } from '../UseCase/GetDocumentMeta'
import type { LoadCommit } from '../UseCase/LoadCommit'

/**
 * @TODO DRVDOC-802
 * This should be an upper bound we should not expect to hit, because we expect the RTS to tell us it has given us all updates
 * in a timely manner. However, due to DRVDOC-802, this event is not currently received, so we have lowered this value to something
 * nominal as a temporary workaround.
 */
export const MAX_MS_TO_WAIT_FOR_RTS_SYNC_AFTER_CONNECT = 100
export const MAX_MS_TO_WAIT_FOR_RTS_CONNECTION_BEFORE_DISPLAYING_EDITOR = 3_000

export class RealtimeController implements InternalEventHandlerInterface, RealtimeControllerInterface {
  initialSyncTimer: ReturnType<typeof setTimeout> | null = null
  initialConnectionTimer: ReturnType<typeof setTimeout> | null = null

  isDestroyed = false
  abortWebsocketConnectionAttempt = false
  sizeTracker: DocSizeTracker = new DocSizeTracker()
  isRefetchingStaleCommit = false

  readonly updatesReceivedWhileParentNotReady: (DecryptedMessage | ProcessedIncomingRealtimeEventMessage)[] = []

  constructor(
    readonly websocketService: WebsocketServiceInterface,
    private readonly eventBus: InternalEventBusInterface,
    readonly documentState: DocumentState | PublicDocumentState,
    readonly _loadCommit: LoadCommit,
    readonly _getDocumentMeta: GetDocumentMeta,
    readonly logger: LoggerInterface,
  ) {
    eventBus.addEventHandler(this, WebsocketConnectionEvent.Connecting)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.FailedToConnect)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.ConnectedAndReady)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.Disconnected)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.DocumentUpdateMessage)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.EventMessage)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.AckStatusChange)
    eventBus.addEventHandler(this, WebsocketConnectionEvent.FailedToGetTokenCommitIdOutOfSync)

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
      if (payload.message.type.wrapper !== 'conversion') {
        this.propagateUpdate(payload.message, payload.debugSource)
      }
    })

    documentState.subscribeToEvent('DriveFileConversionToDocBegan', () => {
      this.abortWebsocketConnectionAttempt = true
      this.closeConnection()
    })

    documentState.subscribeToEvent('DriveFileConversionToDocSucceeded', () => {
      this.abortWebsocketConnectionAttempt = false
      void this.reconnect()
    })

    documentState.subscribeToEvent('DebugMenuRequestingCommitWithRTS', (payload) => {
      void this.debugSendCommitCommandToRTS(payload)
    })

    documentState.subscribeToProperty('currentCommitId', (value, previousValue) => {
      const commitIdUpgraded = value && previousValue && value !== previousValue
      if (
        commitIdUpgraded &&
        !this.websocketService.isConnected(this.documentState.getProperty('documentMeta').nodeMeta)
      ) {
        this.logger.info('Reconnecting to RTS because currentCommitId changed and we are not connected')
        void this.reconnect()
      }
    })

    documentState.subscribeToProperty('documentTrashState', (value, previousValue) => {
      if (
        value === 'not_trashed' &&
        previousValue === 'trashed' &&
        !this.websocketService.isConnected(this.documentState.getProperty('documentMeta').nodeMeta)
      ) {
        this.logger.info('Reconnecting to RTS because document was untrashed')
        void this.reconnect()
      }
    })
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

  public resetSizeTracker(size: number): void {
    this.sizeTracker.resetWithSize(size)
  }

  public closeConnection(): void {
    this.websocketService.closeConnection(this.documentState.getProperty('documentMeta').nodeMeta)
  }

  public async reconnect(): Promise<void> {
    await this.websocketService.reconnectToDocumentWithoutDelay(this.documentState.getProperty('documentMeta').nodeMeta)
  }

  public async debugSendCommitCommandToRTS(entitlements: DocumentEntitlements): Promise<void> {
    await this.websocketService.debugSendCommitCommandToRTS(
      this.documentState.getProperty('documentMeta').nodeMeta,
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
    } else if (event.type === WebsocketConnectionEvent.ConnectedAndReady) {
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
      /**
       * The client was unable to get a token from the Docs API because the Commit ID the client had did not match
       * what the server was expecting.
       */
      void this.refetchCommitDueToStaleContents('token-fail')
    } else {
      return
    }
  }

  async handleDocumentUpdatesMessage(message: DecryptedMessage) {
    if (!this.documentState.getProperty('editorReady')) {
      this.updatesReceivedWhileParentNotReady.push(message)

      return
    }

    this.sizeTracker.incrementSize(message.byteSize())

    this.documentState.emitEvent({ name: 'RealtimeReceivedDocumentUpdate', payload: message })
  }

  beginInitialConnectionTimer(): void {
    this.initialConnectionTimer = setTimeout(() => {
      this.logger.warn('Initial connection with RTS cannot seem to be formed in a reasonable time')
      this.documentState.setProperty('realtimeConnectionTimedOut', true)
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

    if (this.initialConnectionTimer) {
      clearTimeout(this.initialConnectionTimer)
    }
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
    const entitlements = this.documentState.getProperty('entitlements')

    const connection = this.websocketService.createConnection(
      this.documentState.getProperty('documentMeta').nodeMeta,
      entitlements.keys,
      {
        commitId: () => this.documentState.getProperty('currentCommitId'),
      },
    )

    connection
      .connect(() => {
        return this.abortWebsocketConnectionAttempt
      })
      .catch((e) => {
        this.logger.error(e)
      })

    this.beginInitialConnectionTimer()

    return connection
  }

  public propagateUpdate(message: RtsMessagePayload, debugSource: BroadcastSource): void {
    if (message.type.wrapper === 'du') {
      if (!this.sizeTracker.canPostUpdateOfSize(message.content.byteLength)) {
        this.handleAttemptingToBroadcastUpdateThatIsTooLarge()
      } else {
        this.sizeTracker.incrementSize(message.content.byteLength)

        void this.websocketService.sendDocumentUpdateMessage(
          this.documentState.getProperty('documentMeta').nodeMeta,
          message.content,
          debugSource,
        )
      }
    } else if (message.type.wrapper === 'events') {
      void this.websocketService.sendEventMessage(
        this.documentState.getProperty('documentMeta').nodeMeta,
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
          const decodedContent = utf8ArrayToString(event.props.content)
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

    const nodeMeta = this.documentState.getProperty('documentMeta').nodeMeta

    const result = await this._getDocumentMeta.execute(nodeMeta)
    if (result.isFailed()) {
      fail(`Failed to reload document meta: ${result.getError()}`)

      return
    }

    const latestCommitId = result.getValue().latestCommitId()

    if (!latestCommitId || latestCommitId === this.documentState.getProperty('currentCommitId')) {
      fail(!latestCommitId ? 'Reloaded commit but commit id was null' : 'Reloaded commit id is the same as current')

      return
    }

    const entitlements = this.documentState.getProperty('entitlements')

    const decryptResult = await this._loadCommit.execute(nodeMeta, latestCommitId, entitlements.keys.documentContentKey)
    if (decryptResult.isFailed()) {
      fail(`Failed to reload or decrypt commit: ${decryptResult.getError()}`)

      return Result.fail(decryptResult.getError())
    }

    const decryptedCommit = decryptResult.getValue()

    this.logger.info(
      `Reownloaded and decrypted commit id ${decryptedCommit.commitId} with ${decryptedCommit?.numberOfUpdates()} updates`,
    )

    this.documentState.setProperty('baseCommit', decryptedCommit)
    this.documentState.setProperty('currentCommitId', decryptedCommit.commitId)

    this.isRefetchingStaleCommit = false
  }
}
