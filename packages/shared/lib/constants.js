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

export const LOGS_STATE = {
    DISABLE: 0,
    BASIC: 1,
    ADVANCED: 2
};

export const MEMBER_TYPE = {
    MEMBER: 0,
    SUB_MEMBER: 1
};
