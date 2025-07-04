import type { RtsMessagePayload } from './RtsMessagePayload'
import type { BroadcastSource } from '../Bridge/BroadcastSource'
import type { SafeDocsUserState } from './DocsAwareness'

export type DocStateCallbacks = {
  docStateRequestsPropagationOfUpdate: (message: RtsMessagePayload, debugSource: BroadcastSource) => void
  handleAwarenessStateUpdate: (states: SafeDocsUserState[]) => void
  handleErrorWhenReceivingDocumentUpdate: (error: unknown) => void
}
