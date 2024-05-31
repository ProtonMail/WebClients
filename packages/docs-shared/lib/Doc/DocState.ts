import { Observable } from 'lib0/observable'
import { Doc } from 'yjs'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import * as syncProtocol from 'y-protocols/sync'
import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import { DocsAwareness } from './DocsAwareness'
import { Logger, LoggerInterface } from '@standardnotes/utils'
import { DocStateInterface } from './DocStateInterface'
import { DocStateCallbacks } from './DocStateCallbacks'
import { RtsMessagePayload } from './RtsMessagePayload'
import { EventTypeEnum } from '@proton/docs-proto'
import { wrapRawYjsMessage } from './wrapRawYjsMessage'

export enum DocUpdateOrigin {
  DocState = 'DocState',
  InitialLoad = 'InitialLoad',
}

const UpdateOriginsToIgnore = [DocUpdateOrigin.DocState, DocUpdateOrigin.InitialLoad]

export class DocState extends Observable<string> implements DocStateInterface {
  public readonly doc: Doc
  public readonly awareness: DocsAwareness
  public canBeEditable = false

  private resyncInterval: ReturnType<typeof setInterval> | null = null
  private readonly logger: LoggerInterface
  private isEditorReady = false
  private messageQueue: RtsMessagePayload[] = []

  constructor(private readonly callbacks: DocStateCallbacks) {
    super()

    this.doc = new Doc()
    this.doc.on('update', this.handleDocBeingUpdatedByLexical)

    this.awareness = new DocsAwareness(this.doc)
    this.awareness.on('update', this.handleAwarenessBeingUpdatedByLexical)
    this.awareness.on('change', this.handleAwarenessChangeByUnknownSource)

    this.logger = new Logger('DocState')

    window.addEventListener('unload', this.handleWindowUnloadEvent)
  }

  destroy(): void {
    this.doc.off('update', this.handleDocBeingUpdatedByLexical)
    this.awareness.off('update', this.handleAwarenessBeingUpdatedByLexical)
    this.awareness.off('change', this.handleAwarenessChangeByUnknownSource)
    window.removeEventListener('unload', this.handleWindowUnloadEvent)
    if (this.resyncInterval) {
      clearInterval(this.resyncInterval)
    }
  }

  public getDoc(): Doc {
    return this.doc
  }

  public getClientId(): number {
    return this.doc.clientID
  }

  public performOpeningCeremony(): void {
    this.broadcastInitialAwarenessState()
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
    const queueLength = this.messageQueue.length

    for (let i = 0; i < queueLength; i++) {
      const message = this.messageQueue.shift()
      if (!message) {
        return
      }

      this.receiveMessage(message)
    }
  }

  public onEditorReady(): void {
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
      if (
        [
          EventTypeEnum.ClientHasDetectedAPresenceChange,
          EventTypeEnum.ClientIsBroadcastingItsPresenceState,
          EventTypeEnum.PresenceChangeBlurredDocument,
          EventTypeEnum.PresenceChangeEnteredDocument,
          EventTypeEnum.PresenceChangeExitedDocument,
        ].includes(message.type.eventType)
      ) {
        awarenessProtocol.applyAwarenessUpdate(this.awareness, message.content, this)
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

  private broadcastInitialAwarenessState(): void {
    const message = this.createChangedClientsAwarenessMessage(
      Array.from(this.awareness.getStates().keys()),
      EventTypeEnum.PresenceChangeEnteredDocument,
    )
    void this.callbacks.docStateRequestsPropagationOfUpdate(message, DocUpdateOrigin.DocState, 'Awareness - On WS Open')
  }

  private handleWindowUnloadEvent = () => {
    awarenessProtocol.removeAwarenessStates(this.awareness, [this.doc.clientID], this)
    this.awareness.setLocalState(null)
  }

  private handleAwarenessChangeByUnknownSource = () => {
    const values = Array.from(this.awareness.getStates().values())
    this.logger.debug('Awareness on change | States:', values)

    for (const state of values) {
      const statePreviousClientId = state.awarenessData.previousClientId
      const isClientConnected = this.awareness.states.has(statePreviousClientId)
      if (statePreviousClientId && !isClientConnected) {
        this.logger.debug('Removing awareness state for client:', parseInt(statePreviousClientId))
        awarenessProtocol.removeAwarenessStates(this.awareness, [parseInt(statePreviousClientId)], this)
      }
    }

    this.callbacks.handleAwarenessStateUpdate(Array.from(this.awareness.getStates().values()))
  }

  private handleDocBeingUpdatedByLexical = (update: Uint8Array, origin: any) => {
    if (origin === this || UpdateOriginsToIgnore.includes(origin)) {
      return
    }

    const updateMessage = this.createSyncMessagePayload(update)
    this.callbacks.docStateRequestsPropagationOfUpdate(
      updateMessage,
      DocUpdateOrigin.DocState,
      'HandleDocBeingUpdatedByLexical',
    )
  }

  private handleAwarenessBeingUpdatedByLexical = (
    update: { added: number[]; updated: number[]; removed: number[] },
    origin: any,
  ) => {
    if (origin === this) {
      return
    }

    const messageType = update.removed.includes(this.doc.clientID)
      ? EventTypeEnum.PresenceChangeExitedDocument
      : EventTypeEnum.ClientHasDetectedAPresenceChange

    const changedClients = update.added.concat(update.updated).concat(update.removed)
    const message = this.createChangedClientsAwarenessMessage(changedClients, messageType)

    this.callbacks.docStateRequestsPropagationOfUpdate(message, DocUpdateOrigin.DocState, 'Awareness Update Handler')
    this.callbacks.handleAwarenessStateUpdate(Array.from(this.awareness.getStates().values()))
  }

  private createChangedClientsAwarenessMessage(
    changedClients: number[],
    messageType: EventTypeEnum,
    states?: Map<number, any>,
  ): RtsMessagePayload {
    return {
      type: { wrapper: 'events', eventType: messageType },
      content: awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients, states),
    }
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

  broadcastPresenceState() {
    this.awareness.refreshPresenceState(0)

    const message = this.createChangedClientsAwarenessMessage(
      Array.from(this.awareness.getStates().keys()),
      EventTypeEnum.ClientIsBroadcastingItsPresenceState,
    )

    void this.callbacks.docStateRequestsPropagationOfUpdate(
      message,
      DocUpdateOrigin.DocState,
      'Awareness - On RequestPresenceState',
    )
  }
}
