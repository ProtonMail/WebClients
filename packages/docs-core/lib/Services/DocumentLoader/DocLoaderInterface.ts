import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { DocLoaderStatusObserver } from './StatusObserver'
import type { DocumentState, PublicDocumentState } from '../../State/DocumentState'
import type { DocumentType } from '@proton/drive-store/store/_documents'

export interface DocLoaderInterface<S extends DocumentState | PublicDocumentState> {
  initialize(lookup: NodeMeta | PublicNodeMeta, documentType: DocumentType): Promise<void>
  addStatusObserver(observer: DocLoaderStatusObserver<S>): () => void
  destroy(): void
}
