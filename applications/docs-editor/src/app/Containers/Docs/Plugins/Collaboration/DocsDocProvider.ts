import type { Provider, ProviderAwareness } from '@lexical/yjs'
import type { Awareness } from 'y-protocols/awareness'
import type { UnsafeDocsUserState } from '../../contract/Awareness'

type LexicalAwareness = Awareness & {
  getLocalState(): UnsafeDocsUserState | null
  getStates(): Map<number, UnsafeDocsUserState>
}

/**
 * Lexical's Yjs provider. Proton syncs the Y.Doc separately; this only forwards awareness.
 */
export class DocsDocProvider implements Provider {
  constructor(private awarenessState: Awareness) {}

  connect(): void {
    // no-op to satisfy Lexical Provider interface
  }

  disconnect(): void {
    // no-op to satisfy Lexical Provider interface
  }

  on(): void {
    // Lexical's collaboration code only reads awareness, so it never subscribes to provider events.
  }

  off(): void {
    // No provider event listener is ever registered.
  }

  get awareness(): ProviderAwareness {
    return this.awarenessState as LexicalAwareness
  }
}
