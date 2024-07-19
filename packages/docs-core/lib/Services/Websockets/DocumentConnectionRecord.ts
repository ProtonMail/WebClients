import type { DocumentKeys, NodeMeta } from '@proton/drive-store'
import type { WebsocketConnectionInterface } from '@proton/docs-shared'
import type { UpdateDebouncer } from './Debouncer/UpdateDebouncer'

export type DocumentConnectionRecord = {
  document: NodeMeta
  connection: WebsocketConnectionInterface
  keys: DocumentKeys
  debouncer: UpdateDebouncer
}
