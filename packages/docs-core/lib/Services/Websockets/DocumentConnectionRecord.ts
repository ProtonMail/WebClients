import { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { WebsocketConnectionInterface } from '@proton/docs-shared'
import { UpdateDebouncer } from './Debouncer/UpdateDebouncer'

export type DocumentConnectionRecord = {
  document: NodeMeta
  connection: WebsocketConnectionInterface
  keys: DocumentKeys
  debouncer: UpdateDebouncer
}
