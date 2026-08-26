import type { NodeMeta, PublicNodeMeta, DocumentType } from '@proton/docs-shared'
import type { DocLoaderStatusObserver } from './StatusObserver'
import type { DocumentState, PublicDocumentState } from '../../State/DocumentState'

export interface DocLoaderInterface<S extends DocumentState | PublicDocumentState> {
  initialize(lookup: NodeMeta | PublicNodeMeta, documentType: DocumentType): Promise<void>
  addStatusObserver(observer: DocLoaderStatusObserver<S>): () => void
  destroy(): void
}
