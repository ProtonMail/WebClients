import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding'
import { WebsocketConnectionInterface } from '@proton/docs-shared'
import { EventTypeEnum, CreateClientEventMessage, ClientEventVersion } from '@proton/docs-proto'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

/**
 * This is a debug utility exposed in development by the Debug menu and allows the client to force the RTS to commit immediately
 * (rather than waiting for the next scheduled commit cycle)
 */
export class DebugSendCommitCommandToRTS implements UseCaseInterface<boolean> {
  async execute(connection: WebsocketConnectionInterface, authorAddress: string): Promise<Result<boolean>> {
    const content = new Uint8Array(stringToUint8Array(JSON.stringify({ authorAddress })))

    const message = CreateClientEventMessage({
      type: EventTypeEnum.ClientIsDebugRequestingServerToPerformCommit,
      content: content,
      authorAddress: authorAddress,
      version: ClientEventVersion.V1,
      timestamp: Date.now(),
    })

    void connection.broadcastMessage(message, 'CommitDocumentUseCase')

    return Result.ok(true)
  }
}
