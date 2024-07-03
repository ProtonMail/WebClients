import { LoggerInterface } from '@proton/utils/logs'
import { stringToUtf8Array } from '@proton/crypto/lib/utils'
import { Observable } from 'lib0/observable'
import { Doc } from 'yjs'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import * as syncProtocol from 'y-protocols/sync'
import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import { DocsAwareness, DocsUserState } from './DocsAwareness'
import { DocStateInterface } from './DocStateInterface'
import { DocStateCallbacks } from './DocStateCallbacks'
import { RtsMessagePayload } from './RtsMessagePayload'
import { EventTypeEnum } from '@proton/docs-proto'
import { wrapRawYjsMessage } from './wrapRawYjsMessage'
import { BroadcastSource } from '../Bridge/BroadcastSource'

export enum DocUpdateOrigin {
  InitialLoad = 'InitialLoad',
}

/** How often to check if a presence broadcast is needed */
export const PRESENCE_UPDATE_REPEAT_INTERVAL = 350

export class DocState extends Observable<string> implements DocStateInterface {
  public readonly doc: Doc
  public readonly awareness: DocsAwareness
  lastEmittedMyState?: DocsUserState = undefined
  lastEmittedClients?: number[] = undefined

  private resyncInterval: ReturnType<typeof setInterval> | null = null
  private isEditorReady = false
  private messageQueue: RtsMessagePayload[] = []

  broadcastPresenceInterval: ReturnType<typeof setInterval>
  needsPresenceBroadcast?: BroadcastSource = undefined

  constructor(
    readonly callbacks: DocStateCallbacks,
    private logger: LoggerInterface,
  ) {
    super()

    this.doc = new Doc()
    this.doc.on('update', this.handleDocBeingUpdatedByLexical)

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
      this.handleRawSyncMessage(message.content, message.origin)
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

  public getDocState(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc)
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
      this.logger.debug('Not broadcasting our awareness state because was not our state that was changed')
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
      return
    }

    this.lastEmittedMyState = myState
    this.lastEmittedClients = latestClientIds

    this.setNeedsBroadcastCurrentAwarenessState(BroadcastSource.AwarenessUpdateHandler)
  }

  handleDocBeingUpdatedByLexical = (update: Uint8Array, origin: any) => {
    const isNonUserInitiatedChange = origin === this || origin === DocUpdateOrigin.InitialLoad
    if (isNonUserInitiatedChange) {
      return
    }

    const updateMessage = this.createSyncMessagePayload(update)
    this.callbacks.docStateRequestsPropagationOfUpdate(updateMessage, BroadcastSource.HandleDocBeingUpdatedByLexical)
  }

  private handleRawSyncMessage(update: Uint8Array, origin?: any): void {
    const unusedReply = encoding.createEncoder()
    encoding.writeVarUint(unusedReply, 0)

    const decoder = decoding.createDecoder(wrapRawYjsMessage(update, syncProtocol.messageYjsUpdate))
    syncProtocol.readSyncMessage(decoder, unusedReply, this.doc, origin ?? this)
  }

  private createSyncMessagePayload(update: Uint8Array): RtsMessagePayload {
    return {
      type: { wrapper: 'du' },
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
      content: awarenessProtocol.encodeAwarenessUpdate(this.awareness, this.awareness.getClientIds()),
    }

    void this.callbacks.docStateRequestsPropagationOfUpdate(message, source)
  }

  /** Invoked externally when a caller wants us to broadcast our state */
  broadcastPresenceState() {
    this.setNeedsBroadcastCurrentAwarenessState(BroadcastSource.ExternalCallerRequestingUsToBroadcastOurState)
  }
}
