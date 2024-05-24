import { ValueObject } from '@standardnotes/domain-core'
import { EventTypeEnum } from './EventTypeEnum'
import { EventTypeProps } from './EventTypeProps'

export class EventType extends ValueObject<EventTypeProps> {
  static TYPES = EventTypeEnum

  static create(type: number): EventType {
    if (!Object.values(EventType.TYPES).includes(type)) {
      throw new Error('Invalid message type')
    }

    if (typeof type !== 'number') {
      throw new Error('Type must be a number')
    }

    return new EventType({ type })
  }

  isUnknownPresenceChange(): boolean {
    return this.props.type === EventType.TYPES.PresenceChangeUnknown
  }

  isEnterDocument(): boolean {
    return this.props.type === EventType.TYPES.PresenceChangeEnteredDocument
  }

  isPresenceChange(): boolean {
    return [
      EventTypeEnum.PresenceChangeUnknown,
      EventTypeEnum.PresenceChangeBlurredDocument,
      EventTypeEnum.PresenceChangeEnteredDocument,
      EventTypeEnum.PresenceChangeExitedDocument,
    ].includes(this.props.type)
  }

  isCommitRequest(): boolean {
    return this.props.type === EventType.TYPES.DebugRequestCommit
  }

  get name(): string {
    const keys = Object.keys(EventType.TYPES)
    const values = Object.values(EventType.TYPES)

    const index = values.indexOf(this.props.type)

    return keys[index]
  }

  get value(): number {
    return this.props.type
  }
}
