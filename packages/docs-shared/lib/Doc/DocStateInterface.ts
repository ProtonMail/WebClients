import type { Observable } from 'lib0/observable'
import type { Doc } from 'yjs'
import type { DocsAwareness } from './DocsAwareness'
import type { RtsMessagePayload } from './RtsMessagePayload'

export interface DocStateInterface extends Observable<string> {
  receiveMessage(message: RtsMessagePayload): void
  getDocState(): Uint8Array<ArrayBuffer>
  performOpeningCeremony(): void
  performClosingCeremony(): void
  getClientId(): number
  getDoc(): Doc

  awareness: DocsAwareness
}
