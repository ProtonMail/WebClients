import { UserState } from '@lexical/yjs'
import { RtsMessagePayload } from './RtsMessagePayload'
import { BroadcastSource } from '../Bridge/BroadcastSource'

export type DocStateCallbacks = {
  docStateRequestsPropagationOfUpdate: (
    message: RtsMessagePayload,
    originator: string,
    debugSource: BroadcastSource,
  ) => void
  handleAwarenessStateUpdate: (states: UserState[]) => void
}
