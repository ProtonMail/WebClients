import type { UserState } from '@lexical/yjs'
import type { RtsMessagePayload } from './RtsMessagePayload'
import type { BroadcastSource } from '../Bridge/BroadcastSource'

export type DocStateCallbacks = {
  docStateRequestsPropagationOfUpdate: (message: RtsMessagePayload, debugSource: BroadcastSource) => void
  handleAwarenessStateUpdate: (states: UserState[]) => void
}
