import type { EventTypeEnum } from '../Event/EventTypeEnum'
import { ServerMessageWithEvents } from '../Generated'
import { ServerEventVersion } from '../Version'
import { CreateEvent } from './CreateEvent'

export function CreateServerMessageWithEvents(dto: {
  type: EventTypeEnum
  content: Uint8Array<ArrayBuffer>
}): ServerMessageWithEvents {
  const event = CreateEvent({
    type: dto.type,
    content: dto.content,
    authorAddress: 'docs-rts-server',
    version: ServerEventVersion.V1,
    timestamp: Date.now(),
  })

  const message = new ServerMessageWithEvents({
    events: [event],
  })

  return message
}
