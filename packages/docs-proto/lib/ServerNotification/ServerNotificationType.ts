import { ValueObject } from '@standardnotes/domain-core'
import { ServerNotificationTypeEnum } from './ServerNotificationTypeEnum'
import { ServerNotificationTypeProps } from './ServerNotificationTypeProps'

export class ServerNotificationType extends ValueObject<ServerNotificationTypeProps> {
  static TYPES = ServerNotificationTypeEnum

  static create(type: number): ServerNotificationType {
    if (!Object.values(ServerNotificationType.TYPES).includes(type)) {
      throw new Error('Invalid message type')
    }

    if (typeof type !== 'number') {
      throw new Error('Type must be a number')
    }

    return new ServerNotificationType({ type })
  }

  get name(): string {
    const keys = Object.keys(ServerNotificationType.TYPES)
    const values = Object.values(ServerNotificationType.TYPES)

    const index = values.indexOf(this.props.type)

    return keys[index]
  }

  get value(): number {
    return this.props.type
  }
}
