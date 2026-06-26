import type { Observable } from 'lib0/observable'
import type { Doc } from 'yjs'
import type { DocsAwareness } from './DocsAwareness'
import type { RtsMessagePayload } from './RtsMessagePayload'

export type DocumentUpdateGuardContext = {
  update: Uint8Array<ArrayBuffer>
  origin: unknown
}

export type DocumentUpdateGuard = (context: DocumentUpdateGuardContext) => boolean

export interface DocStateInterface extends Observable<string> {
  receiveMessage(message: RtsMessagePayload): void
  getDocState(): Uint8Array<ArrayBuffer>
  performOpeningCeremony(): void
  performClosingCeremony(): void
  getClientId(): number
  getDoc(): Doc
  runWithDocumentUpdateGuard<T>(guard: DocumentUpdateGuard, callback: () => T): T

  awareness: DocsAwareness

  startSheetsExcelImport(): void
  endSheetsExcelImport(): void
  markImportUpdateAsSuccessful(uuid: string): void
  waitForImportSuccess(): Promise<void>
  consumeIsInConversionFromOtherFormat(): boolean

  addUpdatePropagationListener(listener: (update: Uint8Array<ArrayBuffer>) => void): void
  removeUpdatePropagationListener(listener: (update: Uint8Array<ArrayBuffer>) => void): void
}
