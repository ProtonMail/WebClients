export const MAIN_USER_KEY = 'USER_KEYS';
export const SECURE_SESSION_STORAGE_KEY = 'SECURE';
export const MAILBOX_PASSWORD_KEY = 'proton:mailbox_pwd';
export const UID_KEY = 'proton:UID';
export const INTERVAL_EVENT_TIMER = 30 * 1000;
export const EVENT_ACTIONS = {
    DELETE: 0,
    CREATE: 1,
    UPDATE: 2,
    UPDATE_DRAFT: 2,
    UPDATE_FLAGS: 3
};
export const USER_ROLES = {
    FREE_ROLE: 0,
    MEMBER_ROLE: 1,
    ADMIN_ROLE: 2
};
export const ELEMENTS_PER_PAGE = 10;
export const INVOICE_OWNER = {
    USER: 0,
    ORGANIZATION: 1
};
export const AUTH_LOG_EVENTS = {
    LOGIN_FAILURE_PASSWORD: 0,
    LOGIN_SUCCESS: 1,
    LOGOUT: 2,
    LOGIN_FAILURE_2FA: 3,
    LOGIN_SUCCESS_AWAIT_2FA: 4
};
export const INVOICE_TYPE = {
    OTHER: 0,
    SUBSCRIPTION: 1,
    CANCELLATION: 2,
    CREDIT: 3,
    DONATION: 4
};
export const INVOICE_STATE = {
    UNPAID: 0,
    PAID: 1,
    VOID: 2,
    BILLED: 3
};

export const BASE_SIZE = 1024;
export const GIGA = BASE_SIZE ** 3;

export const LOGS_STATE = {
    DISABLE: 0,
    BASIC: 1,
    ADVANCED: 2
};

export const MEMBER_TYPE = {
    MEMBER: 0,
    SUB_MEMBER: 1
};

export const DOMAIN_STATE = {
    DOMAIN_STATE_DEFAULT: 0, // Domain's State before verify or after deactivation
    DOMAIN_STATE_ACTIVE: 1, // active once verified
    DOMAIN_STATE_WARN: 2 // detected backward DNS change after ACTIVE
};

export const VERIFY_STATE = {
    VERIFY_STATE_DEFAULT: 0, // 0 is default, no good
    VERIFY_STATE_EXIST: 1, // 1 is has code but doesn't match DB's, no good
    VERIFY_STATE_GOOD: 2 // 2 is has code and matches DB's, good!
};

export const MX_STATE = {
    MX_STATE_DEFAULT: 0, // 0 is default, no good
    MX_STATE_NO_US: 1, // 1 is set but does not have us
    MX_STATE_INC_US: 2, // 2 is includes our MX but priority no good
    MX_STATE_GOOD: 3 // 3 is includes our MX and we are highest and pri is legit, good!
};

export const SPF_STATE = {
    SPF_STATE_DEFAULT: 0, // 0 is default, no spf record
    SPF_STATE_ONE: 1, // 1 is has spf record but not us
    SPF_STATE_MULT: 2, // 2 is has multiple spf records, no good
    SPF_STATE_GOOD: 3 // 3 is has spf record and includes us, good!
};

export const DKIM_STATE = {
    DKIM_STATE_DEFAULT: 0, // 0 is default, no dkim record
    DKIM_STATE_ONE: 1, // 1 is found entries but format wrong
    DKIM_STATE_MULT: 2, // 2 is multiple dkim records, no good
    DKIM_STATE_CHECK: 3, // 3 is proper entry, but did not check or did not match DB's public key
    DKIM_STATE_GOOD: 4, // 4 is proper entry and matches DB's public key, good!
    DKIM_STATE_OFF: 5 // 5 is User wants to stop signing with dkim
};

export const DMARC_STATE = {
    DMARC_STATE_DEFAULT: 0, // 0 is default, no dmarc record
    DMARC_STATE_ONE: 1, // 1 is found entries but format wrong
    DMARC_STATE_MULT: 2, // 2 is multiple dmarc records, no good
    DMARC_STATE_GOOD: 3 // 3 is good!
};

export const ADDRESS_STATUS = {
    STATUS_DISABLED: 0,
    STATUS_ENABLED: 1
};

export const ADDRESS_TYPE = {
    TYPE_ORIGINAL: 1,
    TYPE_ALIAS: 2,
    TYPE_CUSTOM_DOMAIN: 3,
    TYPE_PREMIUM: 4
};

export const RECEIVE_ADDRESS = {
    RECEIVE_YES: 1,
    RECEIVE_NO: 0
};

export const SEND_ADDRESS = {
    SEND_YES: 1,
    SEND_NO: 0
};

export const MEMBER_PRIVATE = {
    READABLE: 0,
    UNREADABLE: 1
};

export const MEMBER_ROLE = {
    ORGANIZATION_NONE: 0,
    ORGANIZATION_MEMBER: 1,
    ORGANIZATION_OWNER: 2
};

export const PACKAGE_TYPE = {
    SEND_PM: 1,
    SEND_EO: 2,
    SEND_CLEAR: 4,
    SEND_PGP_INLINE: 8,
    SEND_PGP_MIME: 16
};

export const SHOW_IMAGES = {
    REMOTE: 1,
    EMBEDDED: 2
};
