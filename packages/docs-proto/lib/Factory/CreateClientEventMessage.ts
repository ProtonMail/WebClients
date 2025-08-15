import { ClientMessageWithEvents } from '../Generated'
import type { EventTypeEnum } from '../Event/EventTypeEnum'
import type { ClientEventVersion } from '../Version'
import { CreateEvent } from './CreateEvent'

export function CreateClientEventMessage(dto: {
  type: EventTypeEnum
  content: Uint8Array<ArrayBuffer>
  authorAddress: string | undefined
  timestamp: number
  version: ClientEventVersion
}): ClientMessageWithEvents {
  const event = CreateEvent(dto)

  const message = new ClientMessageWithEvents({
    events: [event],
  })

  return message
}
