import { c } from 'ttag';

export const MAX_RETRY_AFTER_TIMEOUT = 10; // seconds
export const MAX_RETRY_AFTER_ATTEMPT = 5; // how many times to try the same request

export const MAIN_USER_KEY = 'USER_KEYS';
export const SECURE_SESSION_STORAGE_KEY = 'SECURE';
export const MAILBOX_PASSWORD_KEY = 'proton:mailbox_pwd';
export const UID_KEY = 'proton:oauth:UID';
export const INTERVAL_EVENT_TIMER = 30 * 1000;
export const MAX_SIZE_SCREENSHOT = 500 * 1000;
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
export const PM_SIGNATURE = 'Sent with <a href="https://protonmail.com" target="_blank">ProtonMail</a> Secure Email.';
export const DEFAULT_CURRENCY = 'EUR';
export const CURRENCIES = ['EUR', 'USD', 'CHF'];
export const MIN_BITCOIN_AMOUNT = 500;
export const DEFAULT_CREDITS_AMOUNT = 5000;
export const DEFAULT_DONATION_AMOUNT = 5000;
export const BTC_DONATION_ADDRESS = '1Q1nhq1NbxPYAbw1BppwKbCqg58ZqMb9A8';
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

export const COMPOSER_MODE = {
    POPUP: 0,
    MAXIMIZED: 1
};

export const VIEW_LAYOUT = {
    COLUMN: 0,
    ROW: 1
};

export const STICKY_LABELS = {
    OFF: 0,
    ON: 1
};

export const VIEW_MODE = {
    GROUP: 0,
    SINGLE: 1
};

export const SHOW_MOVED = {
    NONE: 0,
    DRAFTS: 1,
    SENT: 2,
    DRAFTS_AND_SENT: 3
};

export const DRAFT_TYPE = {
    NORMAL: 'text/html',
    PLAIN_TEXT: 'text/plain'
};

export const RIGHT_TO_LEFT = {
    OFF: 0,
    ON: 1
};

export const THEMES = {
    DARK: {
        label: c('Theme').t`Dark (Default)`,
        identifier: '/* dark-theme */'
    },
    LIGHT: {
        label: c('Theme').t`Light`,
        identifier: '/* light-theme */'
    },
    BLUE: {
        label: c('Theme').t`Blue`,
        identifier: '/* blue-theme */'
    },
    CUSTOM: {
        label: c('Theme').t`Custom theme`,
        identifier: '/* custom-theme */'
    }
};

export const DEFAULT_CYCLE = 12;

export const CYCLE = {
    MONTHLY: 1,
    YEARLY: 12,
    TWO_YEARS: 24
};

const BLACK_FRIDAY_YEAR = 2018;
export const BLACK_FRIDAY = {
    YEAR: BLACK_FRIDAY_YEAR,
    COUPON_CODE: 'TWO4ONE2018',
    CYCLE: CYCLE.TWO_YEARS,
    BETWEEN: {
        START: `${BLACK_FRIDAY_YEAR}-11-23`,
        END: `${BLACK_FRIDAY_YEAR}-11-26`
    },
    INTERVAL: 10 * 60 * 1000
};
export const MIN_PAYPAL_AMOUNT = 500;
export const MAX_PAYPAL_AMOUNT = 99999900;
export const NEWS = {
    ANNOUNCEMENTS: 1,
    FEATURES: 2,
    NEWSLETTER: 4,
    BETA: 8
};

export const CONTACT_EMAILS_LIMIT = 1000;
export const CONTACTS_LIMIT = 1000;
export const EXPORT_CONTACTS_LIMIT = 50; // Maximum page size for export is 50 from API
export const CONTACTS_REQUESTS_PER_SECOND = 10;
export const ALL_MEMBERS_ID = 'ALL';

export const LABEL_TYPES = {
    FOLDER: 1,
    LABEL: 0
};

export const LABEL_COLORS = [
    '#7272a7',
    '#8989ac',

    '#cf5858',
    '#cf7e7e',

    '#c26cc7',
    '#c793ca',

    '#7569d1',
    '#9b94d1',

    '#69a9d1',
    '#a8c4d5',

    '#5ec7b7',
    '#97c9c1',

    '#72bb75',
    '#9db99f',

    '#c3d261',
    '#c6cd97',

    '#e6c04c',
    '#e7d292',

    '#e6984c',
    '#dfb286'
];
export const REGEX_IMAGE_EXTENSION = /\.(gif|jpe?g|tiff|png)$/i;

export const LINK_WARNING = {
    KEY: 'link_warning',
    VALUE: 'dontAsk'
};

export const ADDON_NAMES = {
    ADDRESS: '5address',
    MEMBER: '1member',
    DOMAIN: '1domain',
    SPACE: '1gb',
    VPN: '1vpn'
};

export const PLAN_TYPES = {
    PLAN: 1,
    ADDON: 0
};

export const PLAN_SERVICES = {
    MAIL: 1,
    VPN: 4
};

export const FREE_SUBSCRIPTION = {}; // You don't need more, use `user.isPaid`

export const PLAN_NAMES = {
    plus: 'Plus',
    professional: 'Professional',
    visionary: 'Visionary',
    vpnbasic: 'Basic',
    vpnplus: 'Plus'
};

export const COUPON_CODES = {
    BUNDLE: 'BUNDLE',
    PMTEAM: 'PMTEAM',
    BLACK_FRIDAY_2018: 'TWO4ONE2018'
};

export const GIFT_CODE_LENGTH = 16;

export const PERMISSIONS = {
    ADMIN: 'admin',
    MEMBER: 'member',
    FREE: 'free',
    UPGRADER: 'upgrader',
    MULTI_USERS: 'multi-users',
    PAID: 'paid',
    PAID_MAIL: 'paid-mail',
    PAID_VPN: 'paid-vpn'
};
