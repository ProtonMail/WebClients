import type { NodeMeta, PublicNodeMeta } from '@proton/docs-shared/BasicTypes'
import type { DocumentKeys, PublicDocumentKeys } from '@proton/docs-shared/CryptoTypes'
import type { WebsocketConnectionInterface } from '@proton/docs-shared/Realtime/WebsocketConnectionInterface'
import type { UpdateDebouncer } from './Debouncer/UpdateDebouncer'

export type DocumentConnectionRecord = {
  document: NodeMeta | PublicNodeMeta
  connection: WebsocketConnectionInterface
  keys: DocumentKeys | PublicDocumentKeys
  debouncer: UpdateDebouncer
}
