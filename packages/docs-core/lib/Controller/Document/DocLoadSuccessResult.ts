import { WebsocketConnectionInterface } from '@proton/docs-shared'
import { DocumentKeys } from '@proton/drive-store'

export type DocLoadSuccessResult = {
  keys: DocumentKeys
  connection: WebsocketConnectionInterface
}
