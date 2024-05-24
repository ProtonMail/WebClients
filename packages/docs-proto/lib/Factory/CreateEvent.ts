import { EventTypeEnum } from '../Event/EventTypeEnum'
import { Event } from '../Generated'
import { ClientEventVersion } from '../Version'

export function CreateEvent(dto: {
  type: EventTypeEnum
  content: Uint8Array
  authorId: string
  timestamp: number
  version: ClientEventVersion
}): Event {
  if (dto.content.length === 0) {
    throw new Error('Content cannot be empty')
  }

  const event = new Event({
    authorId: dto.authorId,
    content: dto.content,
    timestamp: dto.timestamp,
    type: dto.type,
    version: dto.version,
  })

  return event
}
