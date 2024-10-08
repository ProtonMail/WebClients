import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { StatusObserver } from './DocLoader'
import type { DocControllerInterface } from '../../Controller/Document/DocControllerInterface'
import type { PublicDocControllerInterface } from '../../Controller/Document/PublicDocControllerInterface'

export interface DocLoaderInterface {
  initialize(lookup: NodeMeta | PublicNodeMeta): Promise<void>
  getDocController(): DocControllerInterface | PublicDocControllerInterface
  addStatusObserver(observer: StatusObserver): () => void
  destroy(): void
}
