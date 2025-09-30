/* Certain localized notifications triggered by sagas might require
 * JSX interpolations. In such cases, use distinct notification keys
 * to facilitate matching in the UI. Alternatively, there may be a need
 * to eliminate duplicate notifications for a particular "channel"
 * identified by its key. */
export enum NotificationKey {
    INACTIVE_SHARES = 'INACTIVE_SHARE',
    LOCK = 'LOCK',
    AUTH = 'AUTH',
    ORG_MISSING_2FA = 'ORG_MISSING_2FA',
    EXT_PERMISSIONS = 'EXT_PERMISSIONS',
}
