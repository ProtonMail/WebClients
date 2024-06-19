import { Observable } from 'lib0/observable'
import { Doc } from 'yjs'
import { DocsAwareness } from './DocsAwareness'
import { RtsMessagePayload } from './RtsMessagePayload'

export interface DocStateInterface extends Observable<string> {
  receiveMessage(message: RtsMessagePayload): void
  getDocState(): Uint8Array
  performOpeningCeremony(): void
  performClosingCeremony(): void
  getClientId(): number
  getDoc(): Doc

  awareness: DocsAwareness
}
