import type { Awareness } from 'y-protocols/awareness'
import type { Doc } from 'yjs'

type DocumentUpdateGuardContext = {
  update: Uint8Array<ArrayBuffer>
  origin: unknown
}

type DocumentUpdateGuard = (context: DocumentUpdateGuardContext) => boolean

export interface SheetsDocumentAdapter {
  getDoc(): Doc
  getDocState(): Uint8Array<ArrayBuffer>
  runWithDocumentUpdateGuard<T>(guard: DocumentUpdateGuard, callback: () => T): T
  addUpdatePropagationListener(listener: (update: Uint8Array<ArrayBuffer>) => void): void
  removeUpdatePropagationListener(listener: (update: Uint8Array<ArrayBuffer>) => void): void
  startSheetsExcelImport(): void
  endSheetsExcelImport(): void
  waitForImportSuccess(): Promise<void>
  consumeIsInConversionFromOtherFormat(): boolean
  awareness: Awareness
}
