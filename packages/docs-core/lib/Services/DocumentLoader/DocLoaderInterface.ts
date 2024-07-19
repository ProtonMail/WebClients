import type { NodeMeta } from '@proton/drive-store'
import type { StatusObserver } from './DocLoader'
import type { DocControllerInterface } from '../../Controller/Document/DocControllerInterface'

export interface DocLoaderInterface {
  initialize(lookup: NodeMeta): Promise<void>
  getDocController(): DocControllerInterface
  addStatusObserver(observer: StatusObserver): () => void
}
