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
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding'
import { BroadcastSource } from '../Bridge/BroadcastSource'

export enum DocUpdateOrigin {
  InitialLoad = 'InitialLoad',
}

export class DocState extends Observable<string> implements DocStateInterface {
  public readonly doc: Doc
  public readonly awareness: DocsAwareness
  public canBeEditable = false
  lastEmittedMyState?: DocsUserState = undefined
  lastEmittedClients?: number[] = undefined

  private resyncInterval: ReturnType<typeof setInterval> | null = null
  private isEditorReady = false
  private messageQueue: RtsMessagePayload[] = []

  constructor(readonly callbacks: DocStateCallbacks) {
    super()

    this.doc = new Doc()
    this.doc.on('update', this.handleDocBeingUpdatedByLexical)

    this.awareness = new DocsAwareness(this.doc)
    this.awareness.on('update', this.handleAwarenessUpdateOrChange)
    this.awareness.on('change', this.handleAwarenessUpdateOrChange)

    window.addEventListener('unload', this.handleWindowUnloadEvent)
  }

  destroy(): void {
    this.doc.off('update', this.handleDocBeingUpdatedByLexical)
    this.awareness.off('update', this.handleAwarenessUpdateOrChange)
    this.awareness.off('change', this.handleAwarenessUpdateOrChange)
    window.removeEventListener('unload', this.handleWindowUnloadEvent)
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
      content: stringToUint8Array(JSON.stringify(true)),
    }

    void this.callbacks.docStateRequestsPropagationOfUpdate(message, BroadcastSource.AwarenessWebSocketOpen)

    this.broadcastCurrentAwarenessState(BroadcastSource.AwarenessWebSocketOpen)
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
  handleAwarenessUpdateOrChange = (_changes: unknown, origin: unknown) => {
    const isYjsRefreshingOwnStateToKeepCurrentClientLookingAlive = origin === 'local'

    this.awareness.removeDuplicateClients()

    const states = this.awareness.getStates()
    this.callbacks.handleAwarenessStateUpdate(Array.from(states.values()))

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

    this.broadcastCurrentAwarenessState(BroadcastSource.AwarenessUpdateHandler)
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

  broadcastCurrentAwarenessState(source: BroadcastSource): void {
    const message: RtsMessagePayload = {
      type: { wrapper: 'events', eventType: EventTypeEnum.ClientIsBroadcastingItsPresenceState },
      content: awarenessProtocol.encodeAwarenessUpdate(this.awareness, this.awareness.getClientIds()),
    }

    void this.callbacks.docStateRequestsPropagationOfUpdate(message, source)
  }

  /** Invoked externally when a caller wants us to broadcast our state */
  broadcastPresenceState() {
    this.broadcastCurrentAwarenessState(BroadcastSource.DocPresenceState)
  }
}
