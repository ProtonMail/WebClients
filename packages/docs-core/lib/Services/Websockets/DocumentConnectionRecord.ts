import type { DocumentKeys, NodeMeta, PublicNodeMeta, PublicDocumentKeys } from '@proton/drive-store'
import type { WebsocketConnectionInterface } from '@proton/docs-shared'
import type { UpdateDebouncer } from './Debouncer/UpdateDebouncer'

export type DocumentConnectionRecord = {
  document: NodeMeta | PublicNodeMeta
  connection: WebsocketConnectionInterface
  keys: DocumentKeys | PublicDocumentKeys
  debouncer: UpdateDebouncer
}
