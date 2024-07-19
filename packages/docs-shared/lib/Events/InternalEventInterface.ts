import type { InternalEventType } from './InternalEventType'

export interface InternalEventInterface<Payload = unknown> {
  type: InternalEventType
  payload: Payload
}
