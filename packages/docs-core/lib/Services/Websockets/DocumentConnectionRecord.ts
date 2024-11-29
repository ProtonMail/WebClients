import type { DocumentKeys, NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { WebsocketConnectionInterface } from '@proton/docs-shared'
import type { UpdateDebouncer } from './Debouncer/UpdateDebouncer'
import type { PublicDocumentKeys } from '../../Types/DocumentEntitlements'

export type DocumentConnectionRecord = {
  document: NodeMeta | PublicNodeMeta
  connection: WebsocketConnectionInterface
  keys: DocumentKeys | PublicDocumentKeys
  debouncer: UpdateDebouncer
}
