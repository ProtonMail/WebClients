import { ValueObject } from '@standardnotes/domain-core'
import { EventTypeEnum } from './EventTypeEnum'
import type { EventTypeProps } from './EventTypeProps'

export class EventType extends ValueObject<EventTypeProps> {
  static TYPES = EventTypeEnum

  static create(type: number): EventType {
    if (!Object.values(EventType.TYPES).includes(type)) {
      throw new Error(`Invalid message type: ${type}`)
    }

    if (typeof type !== 'number') {
      throw new Error(`Type must be a number: ${type}`)
    }

    return new EventType({ type })
  }

  isCommitRequest(): boolean {
    return this.props.type === EventType.TYPES.ClientIsDebugRequestingServerToPerformCommit
  }

  get name(): string {
    const keys = Object.keys(EventType.TYPES)
    const values = Object.values(EventType.TYPES)

    const index = values.indexOf(this.props.type)

    return keys[index]
  }

  get value(): EventTypeEnum {
    return this.props.type
  }
}
