import { ClientMessageWithEvents } from '../Generated'
import { EventTypeEnum } from '../Event/EventTypeEnum'
import { ClientEventVersion } from '../Version'
import { CreateEvent } from './CreateEvent'

export function CreateClientEventMessage(dto: {
  type: EventTypeEnum
  content: Uint8Array
  authorAddress: string
  timestamp: number
  version: ClientEventVersion
}): ClientMessageWithEvents {
  const event = CreateEvent(dto)

  const message = new ClientMessageWithEvents({
    events: [event],
  })

  return message
}
