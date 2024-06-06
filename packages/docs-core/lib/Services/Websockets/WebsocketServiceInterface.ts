import { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { BroadcastSources, WebsocketConnectionInterface } from '@proton/docs-shared'
import { ClientMessageWithDocumentUpdates, ClientMessageWithEvents } from '@proton/docs-proto'

export interface WebsocketServiceInterface {
  createConnection(
    nodeMeta: NodeMeta,
    keys: DocumentKeys,
    options: { commitId: () => string | undefined; isStressTestor?: boolean },
  ): WebsocketConnectionInterface

  sendMessageToDocument(
    document: NodeMeta,
    message: ClientMessageWithDocumentUpdates | ClientMessageWithEvents,
    source: BroadcastSources,
  ): void

  debugSendCommitCommandToRTS(document: NodeMeta, keys: DocumentKeys): Promise<void>

  createStressTestConnections(count: number): void
}
