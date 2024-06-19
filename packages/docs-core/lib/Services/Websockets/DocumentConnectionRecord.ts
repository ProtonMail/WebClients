import { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { WebsocketConnectionInterface } from '@proton/docs-shared'
import { DocumentUpdateBuffer } from './Buffer/DocumentUpdateBuffer'

export type DocumentConnectionRecord = {
  document: NodeMeta
  connection: WebsocketConnectionInterface
  keys: DocumentKeys
  buffer: DocumentUpdateBuffer
}
