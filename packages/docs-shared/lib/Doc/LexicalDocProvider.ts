import { DocStateInterface } from './DocStateInterface'
import { Observable } from 'lib0/observable'
import { Provider, ProviderAwareness } from '@lexical/yjs'

export class LexicalDocProvider extends Observable<string> implements Provider {
  constructor(private docState: DocStateInterface) {
    super()
  }

  connect(): void | Promise<void> {
    // no-op to satisfy Lexical Provider interface
  }

  disconnect(): void {
    // no-op to satisfy Lexical Provider interface
  }

  get awareness(): ProviderAwareness {
    return this.docState.awareness
  }
}
