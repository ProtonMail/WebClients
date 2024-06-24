export const LockedSessionError = () => {
    const error = new Error('Session locked');
    error.name = 'LockedSession';
    return error;
};

export enum PassErrorCode {
    DISABLED_SHARE = 300004,
    INVALID_SIGNATURE = 300003,
    INVALID_VALUE = 2001,
    MISSING_KEYS = 300006,
    MISSING_SCOPE = 9100,
    NOT_ALLOWED = 2011,
    NOT_EXIST_SHARE = 2501,
    NOT_LATEST_KEYS = 300001,
    NOT_LATEST_REVISION = 300002,
    RESOURCE_LIMIT_EXCEEDED = 300007,
    ROTATION_PAYLOAD_INCOMPLETE = 300005,
    SERVICE_NETWORK_ERROR = 399999,
    SESSION_LOCKED = 300008,
}
