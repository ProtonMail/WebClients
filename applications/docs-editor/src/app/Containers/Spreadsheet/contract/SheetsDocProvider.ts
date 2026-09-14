import type { Awareness } from 'y-protocols/awareness'

/**
 * Minimal provider shape expected by @rowsncolumns/y-spreadsheet.
 * Proton syncs the Y.Doc separately; this only forwards awareness.
 */
type SheetsYjsProvider = {
  synced: boolean
  awareness: Awareness
  connect(): void | Promise<void>
  disconnect(): void
  on(...args: unknown[]): void
  off(...args: unknown[]): void
}

export class SheetsDocProvider implements SheetsYjsProvider {
  /** rowsncolumns expects this */
  synced = false

  constructor(private awarenessState: Awareness) {}

  connect(): void | Promise<void> {
    // no-op to satisfy y-spreadsheet provider interface
  }

  disconnect(): void {
    // no-op to satisfy y-spreadsheet provider interface
  }

  on(): void {
    // The provider is already synced, so no later sync event is needed.
  }

  off(): void {
    // No sync event listener is registered by this provider.
  }

  get awareness(): Awareness {
    return this.awarenessState
  }
}
