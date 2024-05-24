import { Broadcaster } from './Broadcaster'
import { RealtimeUrlAndToken } from './RealtimeUrlAndToken'
import { Result } from '@standardnotes/domain-core'

export interface WebsocketConnectionInterface extends Broadcaster {
  connect(getUrlAndToken: () => Promise<Result<RealtimeUrlAndToken>>): Promise<void>
  destroy(): void
}
