import { MessageAck } from '../Generated/MessageAck'

export function CreateMessageAck(dto: { uuid: string }): MessageAck {
  const messageAck = new MessageAck({
    uuid: dto.uuid,
  })

  return messageAck
}
