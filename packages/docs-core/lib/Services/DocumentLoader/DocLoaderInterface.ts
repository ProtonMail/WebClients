import { NodeMeta } from '@proton/drive-store'
import { StatusObserver } from './DocLoader'
import { DocControllerInterface } from '../../Controller/Document/DocControllerInterface'

export interface DocLoaderInterface {
  initialize(lookup: NodeMeta): Promise<void>
  getDocController(): DocControllerInterface
  addStatusObserver(observer: StatusObserver): () => void
}
