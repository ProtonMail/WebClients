import { EventTypeEnum } from '@proton/docs-proto'

export type RtsMessagePayload = {
  content: Uint8Array
  type: { wrapper: 'du' } | { wrapper: 'conversion' } | { wrapper: 'events'; eventType: EventTypeEnum }
  origin?: any
}
