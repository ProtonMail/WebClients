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
