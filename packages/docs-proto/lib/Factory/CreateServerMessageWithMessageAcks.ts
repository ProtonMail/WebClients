import { ServerMessageWithMessageAcks, type ClientMessageWithDocumentUpdates } from '../Generated'
import { CreateMessageAck } from './CreateMessageAck'

export function CreateServerMessageWithMessageAcks(
  clientMessageWithDocumentUpdates: ClientMessageWithDocumentUpdates,
): ServerMessageWithMessageAcks {
  const messageAcks = clientMessageWithDocumentUpdates.updates.documentUpdates.map((documentUpdate) =>
    CreateMessageAck({ uuid: documentUpdate.uuid }),
  )

  const message = new ServerMessageWithMessageAcks({
    acks: messageAcks,
  })

  return message
}
