import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { DocLoaderStatusObserver } from './StatusObserver'
import type { DocumentState, PublicDocumentState } from '../../State/DocumentState'

export interface DocLoaderInterface<S extends DocumentState | PublicDocumentState> {
  initialize(lookup: NodeMeta | PublicNodeMeta): Promise<void>
  addStatusObserver(observer: DocLoaderStatusObserver<S>): () => void
  destroy(): void
}
