import { ValueObject } from '@standardnotes/domain-core'

import { ConnectionCloseReasonProps } from './ConnectionCloseReasonProps'

export class ConnectionCloseReason extends ValueObject<ConnectionCloseReasonProps> {
  static CODES = {
    NORMAL_CLOSURE: 1000,
    GOING_AWAY: 1001,
    PROTOCOL_ERROR: 1002,
    UNSUPPORTED_DATA: 1003,
    NO_STATUS_RECEIVED: 1005,
    ABNORMAL_CLOSURE: 1006,
    INVALID_FRAME_PAYLOAD_DATA: 1007,
    POLICY_VIOLATION: 1008,
    MESSAGE_TOO_BIG: 1009,
    MISSING_EXTENSION: 1010,
    INTERNAL_ERROR: 1011,
    SERVICE_RESTART: 1012,
    TRY_AGAIN_LATER: 1013,
    BAD_GATEWAY: 1014,
    TLS_HANDSHAKE: 1015,
    STALE_COMMIT_ID: 3000,
    DOCUMENT_NOT_FOUND: 3001,
    INVALID_PARAMETERS: 3002,
    UNAUTHORIZED: 3003,
    TIMEOUT: 3004,
    DOCUMENT_TIMEOUT: 3005,
    LEFT: 3006,
    TRAFFIC_ABUSE_MAX_BANDWIDTH: 3007,
    TRAFFIC_ABUSE_MAX_DU_SIZE: 3008,
  }

  static messages: Record<number, string> = {
    [ConnectionCloseReason.CODES.NORMAL_CLOSURE]: 'Normal closure',
    [ConnectionCloseReason.CODES.GOING_AWAY]: 'Going away',
    [ConnectionCloseReason.CODES.PROTOCOL_ERROR]: 'Protocol error',
    [ConnectionCloseReason.CODES.UNSUPPORTED_DATA]: 'Unsupported data',
    [ConnectionCloseReason.CODES.NO_STATUS_RECEIVED]: 'No status received',
    [ConnectionCloseReason.CODES.ABNORMAL_CLOSURE]: 'Abnormal closure',
    [ConnectionCloseReason.CODES.INVALID_FRAME_PAYLOAD_DATA]: 'Invalid frame payload data',
    [ConnectionCloseReason.CODES.POLICY_VIOLATION]: 'Policy violation',
    [ConnectionCloseReason.CODES.MESSAGE_TOO_BIG]: 'Message too big',
    [ConnectionCloseReason.CODES.MISSING_EXTENSION]: 'Missing extension',
    [ConnectionCloseReason.CODES.INTERNAL_ERROR]: 'Internal error',
    [ConnectionCloseReason.CODES.SERVICE_RESTART]: 'Service restart',
    [ConnectionCloseReason.CODES.TRY_AGAIN_LATER]: 'Try again later',
    [ConnectionCloseReason.CODES.BAD_GATEWAY]: 'Bad gateway',
    [ConnectionCloseReason.CODES.TLS_HANDSHAKE]: 'TLS handshake',
    [ConnectionCloseReason.CODES.STALE_COMMIT_ID]: 'Stale commit ID',
    [ConnectionCloseReason.CODES.DOCUMENT_NOT_FOUND]: 'Document not found',
    [ConnectionCloseReason.CODES.INVALID_PARAMETERS]: 'Invalid parameters to establish connection',
    [ConnectionCloseReason.CODES.UNAUTHORIZED]: 'Unauthorized',
    [ConnectionCloseReason.CODES.TIMEOUT]: 'Connection timed out',
    [ConnectionCloseReason.CODES.DOCUMENT_TIMEOUT]: 'Document timed out',
    [ConnectionCloseReason.CODES.LEFT]: 'User left the room',
    [ConnectionCloseReason.CODES.TRAFFIC_ABUSE_MAX_BANDWIDTH]: 'Traffic abuse: max bandwidth exceeded',
    [ConnectionCloseReason.CODES.TRAFFIC_ABUSE_MAX_DU_SIZE]: 'Traffic abuse: max DU size exceeded',
  }

  static create(props: ConnectionCloseReasonProps): ConnectionCloseReason {
    if (Object.values(ConnectionCloseReason.CODES).indexOf(props.code) === -1) {
      throw new Error('Invalid close code')
    }

    if (!props.message) {
      props.message = this.messages[props.code]
    }

    return new ConnectionCloseReason(props)
  }
}
