import { UserState } from '@lexical/yjs'
import { RtsMessagePayload } from './RtsMessagePayload'

export type DocStateCallbacks = {
  docStateRequestsPropagationOfUpdate: (message: RtsMessagePayload, originator: string, debugSource: string) => void
  handleAwarenessStateUpdate: (states: UserState[]) => void
}
