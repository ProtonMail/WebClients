import { c } from 'ttag';

export enum AUTH_LOG_EVENTS {
    LOGIN_FAILURE_PASSWORD = 0,
    LOGIN_SUCCESS,
    LOGOUT,
    LOGIN_FAILURE_2FA,
    LOGIN_SUCCESS_AWAIT_2FA,
    LOGIN_SUCCESS_FORBIDDEN,
    LOGIN_SUCCESS_MNEMONIC,
    LOGIN_FAILURE_MNEMONIC,
    LOGIN_SUCCESS_ADMIN,
    LOGIN_BLOCKED,
    LOGIN_SUCCESS_AWAIT_VERIFY = 80,
    LOGIN_ATTEMPT,

    REAUTH_FAILURE_PASSWORD = 10,
    REAUTH_FAILURE_2FA,
    REAUTH_SUCCESS,

    CHANGE_ACCOUNT_PASSWORD = 20,
    CHANGE_MAILBOX_PASSWORD,
    RESET_ACCOUNT,
    CHANGE_MNEMONIC,
    RESET_ACCOUNT_MNEMONIC,
    CHANGE_EMAIL,
    CHANGE_PHONE,
    ENABLE_HIGH_SECURITY,
    DISABLE_HIGH_SECURITY,

    ENABLE_MAILBOX_PASSWORD = 30,
    DISABLE_MAILBOX_PASSWORD,
    ENABLE_TOTP,
    DISABLE_TOTP,
    ADD_U2F,
    REMOVE_U2F,
    DISABLE_MNEMONIC,
    RESET_BACKUP_SECRET,

    USER_KEY_CREATION = 40,
    USER_KEY_DELETION,
    USER_KEY_REACTIVATION,

    ADDRESS_KEY_CREATION = 50,
    ADDRESS_KEY_DELETION,
    ADDRESS_KEY_REACTIVATION,

    ENABLE_EMAIL_RECOVERY = 60,
    ENABLE_PHONE_RECOVERY,
    DISABLE_EMAIL_RECOVERY,
    DISABLE_PHONE_RECOVERY,

    REVOKE_ALL_SESSIONS = 70,
    REVOKE_SINGLE_SESSION,
}

export enum AuthLogStatus {
    Success = 'success',
    Attempt = 'attempt',
    Failure = 'failure',
}

export enum ProtectionType {
    BLOCKED = 1,
    CAPTCHA = 2,
    OWNERSHIP_VERIFICATION = 3,
    DEVICE_VERIFICATION = 4,
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

export const getAuthLogProtectionI18N = (type: ProtectionType | null): string => {
    switch (type) {
        case ProtectionType.BLOCKED:
            return c('Protection type').t`Blocked`;
        case ProtectionType.CAPTCHA:
            return c('Protection type').t`CAPTCHA`;
        case ProtectionType.OWNERSHIP_VERIFICATION:
            return c('Protection type').t`Ownership verification`;
        case ProtectionType.DEVICE_VERIFICATION:
            return c('Protection type').t`Device verification`;
        case ProtectionType.OK:
            return c('Protection type').t`Ok`;
        default:
            return c('Protection type').t`Unknown`;
    }
};

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
            return c('Log event').t`Sign in success (awaiting verify)`;
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
