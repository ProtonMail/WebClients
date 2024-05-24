import { ValueObject } from '@standardnotes/domain-core'
import { ClientEventTypeEnum } from './ClientEventTypeEnum'
import { ClientEventTypeProps } from './ClientEventTypeProps'

export class ClientEventType extends ValueObject<ClientEventTypeProps> {
  static TYPES = ClientEventTypeEnum

  static create(type: ClientEventTypeEnum): ClientEventType {
    if (!Object.values(ClientEventType.TYPES).includes(type)) {
      throw new Error('Invalid message type')
    }

    if (typeof type !== 'number') {
      throw new Error('Type must be a number')
    }

    return new ClientEventType({ type })
  }

  isUnknownPresenceChange(): boolean {
    return this.props.type === ClientEventType.TYPES.PresenceChangeUnknown
  }

  isEnterDocument(): boolean {
    return this.props.type === ClientEventType.TYPES.PresenceChangeEnteredDocument
  }

  isPresenceChange(): boolean {
    return [
      ClientEventTypeEnum.PresenceChangeUnknown,
      ClientEventTypeEnum.PresenceChangeBlurredDocument,
      ClientEventTypeEnum.PresenceChangeEnteredDocument,
      ClientEventTypeEnum.PresenceChangeExitedDocument,
    ].includes(this.props.type)
  }

  isCommitRequest(): boolean {
    return this.props.type === ClientEventType.TYPES.DebugRequestCommit
  }

  get name(): string {
    const keys = Object.keys(ClientEventType.TYPES)
    const values = Object.values(ClientEventType.TYPES)

    const index = values.indexOf(this.props.type)

    return keys[index]
  }

  get value(): number {
    return this.props.type
  }
}
