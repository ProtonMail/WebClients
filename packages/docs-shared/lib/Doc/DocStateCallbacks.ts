import { UserState } from '@lexical/yjs'
import { RtsMessagePayload } from './RtsMessagePayload'
import { BroadcastSources } from '../Bridge/BroadcastSources'

export type DocStateCallbacks = {
  docStateRequestsPropagationOfUpdate: (
    message: RtsMessagePayload,
    originator: string,
    debugSource: BroadcastSources,
  ) => void
  handleAwarenessStateUpdate: (states: UserState[]) => void
}
