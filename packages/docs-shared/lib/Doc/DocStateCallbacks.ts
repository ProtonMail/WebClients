import type { RtsMessagePayload } from './RtsMessagePayload'
import type { BroadcastSource } from '../Bridge/BroadcastSource'
import type { DocsUserState } from './DocsAwareness'

export type DocStateCallbacks = {
  docStateRequestsPropagationOfUpdate: (message: RtsMessagePayload, debugSource: BroadcastSource) => void
  handleAwarenessStateUpdate: (states: DocsUserState[]) => void
}
