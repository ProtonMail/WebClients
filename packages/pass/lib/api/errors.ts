export const LockedSessionError = () => {
    const error = new Error('Session locked');
    error.name = 'LockedSession';
    return error;
};

export enum PassErrorCode {
    NOT_LATEST_KEYS = 300001,
    NOT_LATEST_REVISION = 300002,
    INVALID_SIGNATURE = 300003,
    DISABLED_SHARE = 300004,
    ROTATION_PAYLOAD_INCOMPLETE = 300005,
    MISSING_KEYS = 300006,
    RESOURCE_LIMIT_EXCEEDED = 300007,
    SESSION_LOCKED = 300008,
    SERVICE_NETWORK_ERROR = 399999,
    INVALID_VALUE = 2001,
    NOT_ALLOWED = 2011,
    NOT_EXIST_SHARE = 2501,
}
