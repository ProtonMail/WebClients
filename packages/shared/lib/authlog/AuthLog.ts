import { c } from 'ttag';

export enum AUTH_LOG_EVENTS {
    LOGIN_FAILURE_PASSWORD = 0,
    LOGIN_SUCCESS = 1,
    LOGOUT = 2,
    LOGIN_FAILURE_2FA = 3,
    LOGIN_SUCCESS_AWAIT_2FA = 4,
    LOGIN_SUCCESS_FORBIDDEN = 5,
    LOGIN_SUCCESS_MNEMONIC = 6,
    LOGIN_FAILURE_MNEMONIC = 7,
    LOGIN_SUCCESS_ADMIN = 8,
    LOGIN_BLOCKED = 9,
    LOGIN_SUCCESS_AWAIT_VERIFY = 80,
    LOGIN_ATTEMPT = 81,

    REAUTH_FAILURE_PASSWORD = 10,
    REAUTH_FAILURE_2FA = 11,
    REAUTH_SUCCESS = 12,

    CHANGE_ACCOUNT_PASSWORD = 20,
    CHANGE_MAILBOX_PASSWORD = 21,
    RESET_ACCOUNT = 22,
    CHANGE_MNEMONIC = 23,
    RESET_ACCOUNT_MNEMONIC = 24,
    CHANGE_EMAIL = 25,
    CHANGE_PHONE = 26,
    ENABLE_HIGH_SECURITY = 27,
    DISABLE_HIGH_SECURITY = 28,

    ENABLE_MAILBOX_PASSWORD = 30,
    DISABLE_MAILBOX_PASSWORD = 31,
    ENABLE_TOTP = 32,
    DISABLE_TOTP = 33,
    ADD_U2F = 34,
    REMOVE_U2F = 35,
    DISABLE_MNEMONIC = 36,
    RESET_BACKUP_SECRET = 37,

    USER_KEY_CREATION = 40,
    USER_KEY_DELETION = 41,
    USER_KEY_REACTIVATION = 42,

    ADDRESS_KEY_CREATION = 50,
    ADDRESS_KEY_DELETION = 51,
    ADDRESS_KEY_REACTIVATION = 52,

    ENABLE_EMAIL_RECOVERY = 60,
    ENABLE_PHONE_RECOVERY = 61,
    DISABLE_EMAIL_RECOVERY = 62,
    DISABLE_PHONE_RECOVERY = 63,

    REVOKE_ALL_SESSIONS = 70,
    REVOKE_SINGLE_SESSION = 71,
}

export enum AuthLogStatus {
    // Success = 'success',
    Attempt = 'attempt',
    Failure = 'failure',
}

export enum ProtectionType {
    // BLOCKED = 1,
    // CAPTCHA = 2,
    // OWNERSHIP_VERIFICATION = 3,
    // DEVICE_VERIFICATION = 4,
    /**
     * AuthLog action was protected by anti-abuse systems
     * and was evaluated as safe.
     */
    OK = 5,
}

export interface AuthLog {
    UserID: number;
    AppVersion: string | null;
    Description: string;
    Device: string;
    Event: AUTH_LOG_EVENTS;
    IP: string;
    InternetProvider: string | null;
    Location: string | null;
    ProtectionDesc: string | null;
    Protection: ProtectionType | null;
    Status: AuthLogStatus;
    Time: number;
}

export interface B2BAuthLog extends AuthLog {
    User: {
        Email: string;
        Name?: string;
    };
}

export const getAuthLogEventsI18N = (type: AUTH_LOG_EVENTS): string => {
    switch (type) {
        case AUTH_LOG_EVENTS.LOGIN_FAILURE_PASSWORD:
            return c('Log event').t`Sign in failure (wrong password)`;
        case AUTH_LOG_EVENTS.LOGIN_SUCCESS:
            return c('Log event').t`Sign in success`;
        case AUTH_LOG_EVENTS.LOGOUT:
            return c('Log event').t`Sign out`;
        case AUTH_LOG_EVENTS.LOGIN_FAILURE_2FA:
            return c('Log event').t`Sign in failure (second factor failed)`;
        case AUTH_LOG_EVENTS.LOGIN_FAILURE_MNEMONIC:
            return c('Log event').t`Sign in failure (mnemonic failed)`;
        case AUTH_LOG_EVENTS.LOGIN_SUCCESS_AWAIT_2FA:
            return c('Log event').t`Sign in success (awaiting second factor)`;
        case AUTH_LOG_EVENTS.LOGIN_SUCCESS_FORBIDDEN:
            return c('Log event').t`Sign in forbidden (due to abuse)`;
        case AUTH_LOG_EVENTS.LOGIN_SUCCESS_MNEMONIC:
            return c('Log event').t`Sign in success (awaiting mnemonic)`;
        case AUTH_LOG_EVENTS.LOGIN_BLOCKED:
            return c('Log event').t`Sign in blocked (due to abuse)`;
        case AUTH_LOG_EVENTS.LOGIN_SUCCESS_AWAIT_VERIFY:
            return c('Log event').t`Sign in success (awaiting verification)`;
        case AUTH_LOG_EVENTS.REAUTH_FAILURE_PASSWORD:
            return c('Log event').t`Authentication failure (wrong password)`;
        case AUTH_LOG_EVENTS.REAUTH_FAILURE_2FA:
            return c('Log event').t`Authentication failure (second factor failed)`;
        case AUTH_LOG_EVENTS.REAUTH_SUCCESS:
            return c('Log event').t`Authentication success`;
        case AUTH_LOG_EVENTS.CHANGE_ACCOUNT_PASSWORD:
            return c('Log event').t`Account password change`;
        case AUTH_LOG_EVENTS.CHANGE_MAILBOX_PASSWORD:
            return c('Log event').t`Mailbox password change`;
        case AUTH_LOG_EVENTS.RESET_ACCOUNT:
            return c('Log event').t`Password reset`;
        case AUTH_LOG_EVENTS.ENABLE_MAILBOX_PASSWORD:
            return c('Log event').t`Two password mode enabled`;
        case AUTH_LOG_EVENTS.DISABLE_MAILBOX_PASSWORD:
            return c('Log event').t`Two password mode disabled`;
        case AUTH_LOG_EVENTS.ENABLE_TOTP:
            return c('Log event').t`Second factor enabled (authenticator app)`;
        case AUTH_LOG_EVENTS.DISABLE_TOTP:
            return c('Log event').t`Second factor disabled (authenticator app)`;
        case AUTH_LOG_EVENTS.ADD_U2F:
            return c('Log event').t`Second factor enabled (security key)`;
        case AUTH_LOG_EVENTS.REMOVE_U2F:
            return c('Log event').t`Second factor disabled (security key)`;
        default:
            return c('Log event').t`Unknown`;
    }
};
