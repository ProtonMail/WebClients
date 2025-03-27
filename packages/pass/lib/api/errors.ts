export const LockedSessionError = () => {
    const error = new Error('Session locked');
    error.name = 'LockedSession';
    return error;
};

export enum PassErrorCode {
    DISABLED_SHARE = 300004,
    INVALID_COOKIES_REFRESH = 10021,
    INVALID_SIGNATURE = 300003,
    INVALID_VALUE = 2001,
    MISSING_KEYS = 300006,
    MISSING_SCOPE = 9108,
    MISSING_ORG_2FA = 12100,
    NOT_ALLOWED = 2011,
    NOT_EXIST_SHARE = 2501,
    NOT_LATEST_KEYS = 300001,
    NOT_LATEST_REVISION = 300002,
    RESOURCE_LIMIT_EXCEEDED = 300007,
    ROTATION_PAYLOAD_INCOMPLETE = 300005,
    SERVICE_NETWORK_ERROR = 399999,
    SESSION_ERROR = 8002,
    SESSION_LOCKED = 300008,
    SRP_ERROR = 2026,

    /** Custom client-side error code overrides */
    UNVERIFIED_USER = 'UNVERIFIED_USER_DETECTED',
}

export class UnverifiedUserError extends Error {}

export const isAbortError = (error: unknown) => error instanceof Error && error.name === 'AbortError';
