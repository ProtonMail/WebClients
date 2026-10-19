import type { EventTypeEnum } from '@proton/docs-proto/Event/EventTypeEnum'

export type RtsMessagePayload = {
  content: Uint8Array<ArrayBuffer>
  type: { wrapper: 'du'; uuid?: string } | { wrapper: 'conversion' } | { wrapper: 'events'; eventType: EventTypeEnum }
  origin?: any
}
