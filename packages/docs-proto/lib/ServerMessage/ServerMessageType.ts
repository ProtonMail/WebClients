import { ValueObject } from '@standardnotes/domain-core'
import type { ServerMessageTypeProps } from './ServerMessageTypeProps'
import { ServerMessageTypeEnum } from './ServerMessageTypeEnum'

export class ServerMessageType extends ValueObject<ServerMessageTypeProps> {
  static TYPES = ServerMessageTypeEnum

  static create(type: number): ServerMessageType {
    if (!Object.values(ServerMessageType.TYPES).includes(type)) {
      throw new Error(`Invalid message type: ${type}`)
    }

    if (typeof type !== 'number') {
      throw new Error(`Type must be a number: ${type}`)
    }

    return new ServerMessageType({ type })
  }

  hasDocumentUpdates(): boolean {
    return this.props.type === ServerMessageType.TYPES.RelayDocumentUpdates
  }

  hasEvents(): boolean {
    return this.props.type === ServerMessageType.TYPES.RelayClientEvents
  }

  isMessageAck(): boolean {
    return this.props.type === ServerMessageType.TYPES.MessageAck
  }

  get name(): string {
    const keys = Object.keys(ServerMessageType.TYPES)
    const values = Object.values(ServerMessageType.TYPES)

    const index = values.indexOf(this.props.type)

    return keys[index]
  }

  get value(): number {
    return this.props.type
  }
}
