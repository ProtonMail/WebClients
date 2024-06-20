import { ConnectionCloseReason } from '@proton/docs-proto'
import { HttpsProtonMeDocsRealtimeDisconnectErrorTotalV1SchemaJson } from '@proton/metrics/types/docs_realtime_disconnect_error_total_v1.schema'

export const ConnectionCloseMetrics: Record<
  number,
  HttpsProtonMeDocsRealtimeDisconnectErrorTotalV1SchemaJson['Labels']['type']
> = {
  [ConnectionCloseReason.CODES.NORMAL_CLOSURE]: 'normal_closure',
  [ConnectionCloseReason.CODES.GOING_AWAY]: 'going_away',
  [ConnectionCloseReason.CODES.PROTOCOL_ERROR]: 'protocol_error',
  [ConnectionCloseReason.CODES.UNSUPPORTED_DATA]: 'unsupported_data',
  [ConnectionCloseReason.CODES.NO_STATUS_RECEIVED]: 'no_status_received',
  [ConnectionCloseReason.CODES.ABNORMAL_CLOSURE]: 'abnormal_closure',
  [ConnectionCloseReason.CODES.INVALID_FRAME_PAYLOAD_DATA]: 'invalid_frame_payload_data',
  [ConnectionCloseReason.CODES.POLICY_VIOLATION]: 'policy_violation',
  [ConnectionCloseReason.CODES.MESSAGE_TOO_BIG]: 'message_too_big',
  [ConnectionCloseReason.CODES.MISSING_EXTENSION]: 'missing_extension',
  [ConnectionCloseReason.CODES.INTERNAL_ERROR]: 'internal_error',
  [ConnectionCloseReason.CODES.SERVICE_RESTART]: 'service_restart',
  [ConnectionCloseReason.CODES.TRY_AGAIN_LATER]: 'try_again_later',
  [ConnectionCloseReason.CODES.BAD_GATEWAY]: 'bad_gateway',
  [ConnectionCloseReason.CODES.TLS_HANDSHAKE]: 'tls_handshake',
  [ConnectionCloseReason.CODES.STALE_COMMIT_ID]: 'stale_commit_id',
  [ConnectionCloseReason.CODES.DOCUMENT_NOT_FOUND]: 'document_not_found',
  [ConnectionCloseReason.CODES.INVALID_PARAMETERS]: 'invalid_parameters',
  [ConnectionCloseReason.CODES.UNAUTHORIZED]: 'unauthorized',
  [ConnectionCloseReason.CODES.TIMEOUT]: 'timeout',
  [ConnectionCloseReason.CODES.DOCUMENT_TIMEOUT]: 'document_timeout',
  [ConnectionCloseReason.CODES.LEFT]: 'left',
  [ConnectionCloseReason.CODES.TRAFFIC_ABUSE_MAX_BANDWIDTH]: 'traffic_abuse_max_bandwidth',
  [ConnectionCloseReason.CODES.TRAFFIC_ABUSE_MAX_DU_SIZE]: 'traffic_abuse_max_du_size',
  [ConnectionCloseReason.CODES.KILL_SWITCH_ENABLED]: 'kill_switch_enabled',
  [ConnectionCloseReason.CODES.DOCUMENT_CAPACITY_REACHED]: 'document_capacity_reached',
  [ConnectionCloseReason.CODES.DOCUMENT_RECREATING]: 'document_recreating',
}
