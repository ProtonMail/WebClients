import type { LoggerInterface } from '@proton/utils/logs'
import { stringToUtf8Array } from '@proton/crypto/lib/utils'
import { Observable } from 'lib0/observable'
import { Doc, decodeUpdate, encodeStateAsUpdate, mergeUpdates } from 'yjs'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import type { SafeDocsUserState } from './DocsAwareness'
import { DocsAwareness } from './DocsAwareness'
import type { DocStateInterface } from './DocStateInterface'
import type { DocStateCallbacks } from './DocStateCallbacks'
import type { RtsMessagePayload } from './RtsMessagePayload'
import { EventTypeEnum } from '@proton/docs-proto'
import { wrapRawYjsMessage } from './wrapRawYjsMessage'
import { BroadcastSource } from '../Bridge/BroadcastSource'
import { DocWillInitializeWithEmptyNodeEvent } from '../DocWillInitializeWithEmptyNodeEvent'

export enum DocUpdateOrigin {
  InitialLoad = 'InitialLoad',
}

/** How often to check if a presence broadcast is needed */
export const PRESENCE_UPDATE_REPEAT_INTERVAL = 75

export class DocState extends Observable<string> implements DocStateInterface {
  public readonly doc: Doc
  public readonly awareness: DocsAwareness
  lastEmittedMyState?: SafeDocsUserState = undefined
  lastEmittedClients?: number[] = undefined

  private resyncInterval: ReturnType<typeof setInterval> | null = null
  private isEditorReady = false
  isInConversionFromOtherFormatFlow = false
  didEnterIntoConversionFlowAtLeastOnce = false
  private messageQueue: RtsMessagePayload[] = []

  docWasInitializedWithEmptyNode = false
  emptyNodeInitializationUpdate?: Uint8Array<ArrayBuffer> = undefined

  broadcastPresenceInterval: ReturnType<typeof setInterval>
  needsPresenceBroadcast?: BroadcastSource = undefined

  constructor(
    readonly callbacks: DocStateCallbacks,
    private logger: LoggerInterface,
  ) {
    super()

    this.doc = new Doc()
    this.doc.on('update', this.handleDocBeingUpdatedByLexical)
    this.doc.on(DocWillInitializeWithEmptyNodeEvent, () => {
      this.docWasInitializedWithEmptyNode = true
    })

    this.awareness = new DocsAwareness(this.doc)
    this.awareness.on('update', this.handleAwarenessUpdateOrChange)
    this.awareness.on('change', this.handleAwarenessUpdateOrChange)

    this.broadcastPresenceInterval = setInterval(() => {
      if (this.needsPresenceBroadcast != undefined) {
        this.needsPresenceBroadcast = undefined
        this.broadcastCurrentAwarenessState(BroadcastSource.AwarenessInterval)
      }
    }, PRESENCE_UPDATE_REPEAT_INTERVAL)

    window.addEventListener('unload', this.handleWindowUnloadEvent)
  }

  setIsInConversionFromOtherFormat() {
    if (this.didEnterIntoConversionFlowAtLeastOnce) {
      throw new Error('setIsInConversionFromOtherFormat has been called more than once. This should not happen.')
    }

    this.isInConversionFromOtherFormatFlow = true
    this.didEnterIntoConversionFlowAtLeastOnce = true
  }

  consumeIsInConversionFromOtherFormat(): boolean {
    const isInConversion = this.isInConversionFromOtherFormatFlow

    this.isInConversionFromOtherFormatFlow = false

    return isInConversion
  }

  destroy(): void {
    this.doc.off('update', this.handleDocBeingUpdatedByLexical)
    this.awareness.off('update', this.handleAwarenessUpdateOrChange)
    this.awareness.off('change', this.handleAwarenessUpdateOrChange)
    window.removeEventListener('unload', this.handleWindowUnloadEvent)
    clearInterval(this.broadcastPresenceInterval)
    if (this.resyncInterval) {
      clearInterval(this.resyncInterval)
    }
    this.awareness.destroy()
  }

  public getDoc(): Doc {
    return this.doc
  }

  public getClientId(): number {
    return this.doc.clientID
  }

  public performOpeningCeremony(): void {
    const message: RtsMessagePayload = {
      type: { wrapper: 'events', eventType: EventTypeEnum.ClientIsRequestingOtherClientsToBroadcastTheirState },
      content: stringToUtf8Array(JSON.stringify(true)),
    }

    void this.callbacks.docStateRequestsPropagationOfUpdate(message, BroadcastSource.AwarenessWebSocketOpen)

    this.setNeedsBroadcastCurrentAwarenessState(BroadcastSource.AwarenessWebSocketOpen)
  }

  public performClosingCeremony(): void {
    awarenessProtocol.removeAwarenessStates(
      this.awareness,
      /**
       * We remove all clients except the current one because we're esseentially implying we can't know
       * the state of other peers since we our websocket connection is now disconnected.
       */
      Array.from(this.awareness.getStates().keys()).filter((client) => client !== this.doc.clientID),
      this,
    )
  }

  private flushMessagesQueue(): void {
    for (const message of this.messageQueue) {
      this.receiveMessage(message)
    }

    this.messageQueue.length = 0
  }

  public onEditorReadyToReceiveUpdates(): void {
    this.isEditorReady = true

    this.flushMessagesQueue()
  }

  public receiveMessage(message: RtsMessagePayload): void {
    if (!this.isEditorReady) {
      this.messageQueue.push(message)
      return
    }

    if (message.type.wrapper === 'du') {
      try {
        this.handleRawSyncMessage(message.content, message.origin)
      } catch (error) {
        this.callbacks.handleErrorWhenReceivingDocumentUpdate(error)
      }
    } else if (message.type.wrapper === 'events') {
      if (message.type.eventType === EventTypeEnum.ClientIsBroadcastingItsPresenceState) {
        awarenessProtocol.applyAwarenessUpdate(this.awareness, message.content, message.origin)
      } else {
        throw new Error(`Unable to handle message type: ${message.type}`)
      }
    } else {
      throw new Error(`Unable to handle message type: ${message.type}`)
    }
  }

  public getDocState(): Uint8Array<ArrayBuffer> {
    return encodeStateAsUpdate(this.doc) as Uint8Array<ArrayBuffer>
  }

  private handleWindowUnloadEvent = () => {
    awarenessProtocol.removeAwarenessStates(this.awareness, [this.doc.clientID], this)
    this.awareness.setLocalState(null)
  }

  /**
   * Based on the yjs source code, an `update` event is triggered regardless of whether during an event the result
   * resulted in a change, and a `change` event is triggered only when the result of the event resulted in a change.
   */
  handleAwarenessUpdateOrChange = (
    changes: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ) => {
    const isYjsRefreshingOwnStateToKeepCurrentClientLookingAlive = origin === 'local'

    this.awareness.removeDuplicateClients()

    const states = this.awareness.getStates()
    const statesArray = Array.from(states.values())

    this.callbacks.handleAwarenessStateUpdate(statesArray)

    if (changes.added.length === 0 && changes.removed.length === 0 && !changes.updated.includes(this.doc.clientID)) {
      this.logger.info('Not broadcasting our awareness state because was not our state that was changed')
      return
    }

    const latestClientIds = this.awareness.getClientIds()

    const noChangeInClientIds =
      latestClientIds.length === this.lastEmittedClients?.length &&
      latestClientIds.every((clientId) => this.lastEmittedClients?.includes(clientId))

    const myState = states.get(this.doc.clientID)

    const noChangeInState =
      this.lastEmittedMyState && JSON.stringify(myState) === JSON.stringify(this.lastEmittedMyState)

    if (!isYjsRefreshingOwnStateToKeepCurrentClientLookingAlive && noChangeInClientIds && noChangeInState) {
      this.logger.info('Not broadcasting our awareness state because no change in state or client ids')
      return
    }

    this.lastEmittedMyState = myState
    this.lastEmittedClients = latestClientIds

    this.setNeedsBroadcastCurrentAwarenessState(BroadcastSource.AwarenessUpdateHandler)
  }

  // eslint-disable-next-line @protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer
  handleDocBeingUpdatedByLexical = (_update: Uint8Array<ArrayBufferLike>, origin: any) => {
    const update = _update as Uint8Array<ArrayBuffer> /* upcast Uint8Array<ArrayBuffer> to make TS happy */
    const isNonUserInitiatedChange = origin === this || origin === DocUpdateOrigin.InitialLoad
    if (isNonUserInitiatedChange) {
      return
    }

    const decodedUpdate = decodeUpdate(update)

    /**
     * If this update represents the empty node initialization update, don't propagate it up yet.
     * Otherwise, this will trigger a "Saving..." UI state which may be confusing since this is an internal change.
     * Instead, hold on to this update until the next non-initial update comes. When that second update comes,
     * merge it with this initial update, then propagate that up instead.
     */
    const isFirstUpdateInLifecycleOfDocument = decodedUpdate.structs[0]?.id?.clock === 0
    if (this.docWasInitializedWithEmptyNode && isFirstUpdateInLifecycleOfDocument) {
      this.emptyNodeInitializationUpdate = update
      return
    }

    const updateToPropagate = this.emptyNodeInitializationUpdate
      ? (mergeUpdates([this.emptyNodeInitializationUpdate, update]) as Uint8Array<ArrayBuffer>)
      : update

    /**
     * If we are in the conversion funnel, then the first update we receive from Lexical is in fact the conversion contents
     * and need to be specified as such. We then flip the flag back to false so that the next update is treated as a normal update.
     */
    const isInConversionFunnel = this.consumeIsInConversionFromOtherFormat()

    const updateMessage = this.createSyncMessagePayload(updateToPropagate, isInConversionFunnel ? 'conversion' : 'du')
    this.callbacks.docStateRequestsPropagationOfUpdate(updateMessage, BroadcastSource.HandleDocBeingUpdatedByLexical)

    this.emptyNodeInitializationUpdate = undefined
  }

  private handleRawSyncMessage(update: Uint8Array<ArrayBuffer>, origin?: any): void {
    const unusedReply = encoding.createEncoder()
    encoding.writeVarUint(unusedReply, 0)

    const decoder = decoding.createDecoder(wrapRawYjsMessage(update, syncProtocol.messageYjsUpdate))
    syncProtocol.readSyncMessage(decoder, unusedReply, this.doc, origin ?? this)
  }

  private createSyncMessagePayload(
    update: Uint8Array<ArrayBuffer>,
    wrapperType: 'du' | 'conversion',
  ): RtsMessagePayload {
    return {
      type: { wrapper: wrapperType },
      content: update,
    }
  }

  setNeedsBroadcastCurrentAwarenessState(source: BroadcastSource): void {
    const sourcesThatShouldBypassDebouncing = [BroadcastSource.ExternalCallerRequestingUsToBroadcastOurState]

    if (sourcesThatShouldBypassDebouncing.includes(source)) {
      this.broadcastCurrentAwarenessState(source)
    } else {
      if (this.needsPresenceBroadcast !== source) {
        this.logger.debug(`Setting needs presence broadcast from source ${BroadcastSource[source]}`)
      }
      this.needsPresenceBroadcast = source
    }
  }

  broadcastCurrentAwarenessState(source: BroadcastSource): void {
    const message: RtsMessagePayload = {
      type: { wrapper: 'events', eventType: EventTypeEnum.ClientIsBroadcastingItsPresenceState },
      content: awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        this.awareness.getClientIds(),
      ) as Uint8Array<ArrayBuffer>,
    }

    void this.callbacks.docStateRequestsPropagationOfUpdate(message, source)
  }

  /** Invoked externally when a caller wants us to broadcast our state */
  broadcastPresenceState() {
    this.setNeedsBroadcastCurrentAwarenessState(BroadcastSource.ExternalCallerRequestingUsToBroadcastOurState)
  }
}
