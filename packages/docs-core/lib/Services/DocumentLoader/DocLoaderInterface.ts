import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { DocLoaderStatusObserver } from './StatusObserver'
import type { DocumentState, PublicDocumentState } from '../../State/DocumentState'
import type { AnyDocControllerInterface } from '../../Controller/Document/AnyDocControllerInterface'

export interface DocLoaderInterface<
  S extends DocumentState | PublicDocumentState,
  D extends AnyDocControllerInterface = AnyDocControllerInterface,
> {
  initialize(lookup: NodeMeta | PublicNodeMeta): Promise<void>
  addStatusObserver(observer: DocLoaderStatusObserver<S, D>): () => void
  destroy(): void
}
