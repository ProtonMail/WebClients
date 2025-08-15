import type { EventTypeEnum } from '@proton/docs-proto'

export type RtsMessagePayload = {
  content: Uint8Array<ArrayBuffer>
  type: { wrapper: 'du' } | { wrapper: 'conversion' } | { wrapper: 'events'; eventType: EventTypeEnum }
  origin?: any
}
