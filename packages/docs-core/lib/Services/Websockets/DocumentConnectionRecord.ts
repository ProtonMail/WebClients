import type {
  DocumentKeys,
  PublicDocumentKeys,
  NodeMeta,
  PublicNodeMeta,
  WebsocketConnectionInterface,
} from '@proton/docs-shared'
import type { UpdateDebouncer } from './Debouncer/UpdateDebouncer'

export type DocumentConnectionRecord = {
  document: NodeMeta | PublicNodeMeta
  connection: WebsocketConnectionInterface
  keys: DocumentKeys | PublicDocumentKeys
  debouncer: UpdateDebouncer
}
