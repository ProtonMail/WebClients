import { c } from 'ttag';

export const RETRY_DELAY_MAX = 10; // seconds
export const RETRY_ATTEMPTS_MAX = 5; // how many times to try the same request
export const OFFLINE_RETRY_DELAY = 2000; // how much time in ms to wait before retrying an offline request
export const OFFLINE_RETRY_ATTEMPTS_MAX = 3; // how many times to try the same request when offline
export const APPS = {
    PROTONMAIL: 'proton-mail',
    PROTONMAIL_SETTINGS: 'proton-mail-settings',
    PROTONCONTACTS: 'proton-contacts',
    PROTONDRIVE: 'proton-drive',
    PROTONCALENDAR: 'proton-calendar',
    PROTONWALLET: 'proton-wallet',
    PROTONVPN_SETTINGS: 'proton-vpn-settings',
    PROTONADMIN: 'proton-admin'
};
export const MAIN_USER_KEY = 'USER_KEYS';
export const SECURE_SESSION_STORAGE_KEY = 'SECURE';
export const MAILBOX_PASSWORD_KEY = 'proton:mailbox_pwd';
export const UID_KEY = 'proton:oauth:UID';
export const INTERVAL_EVENT_TIMER = 30 * 1000;
export const MAX_SIZE_SCREENSHOT = 500 * 1000;
export const FILTER_VERSION = 2;
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
export const MIN_DONATION_AMOUNT = 50;
export const MIN_CREDIT_AMOUNT = 500;
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
    DONATION: 4,
    CHARGEBACK: 5,
    RENEWAL: 6,
    REFUND: 7,
    MODIFICATION: 8,
    ADDITION: 9
};
export const INVOICE_STATE = {
    UNPAID: 0,
    PAID: 1,
    VOID: 2,
    BILLED: 3,
    WRITEOFF: 4
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

export const MIME_TYPES = {
    MIME: 'multipart/mixed',
    PLAINTEXT: 'text/plain',
    DEFAULT: 'text/html'
};

export const RECIPIENT_TYPE = {
    TYPE_INTERNAL: 1,
    TYPE_EXTERNAL: 2,
    TYPE_NO_RECEIVE: 3
};

export const KEY_FLAGS = {
    DISABLED: 0,
    ENABLE_VERIFICATION: 1,
    ENABLE_ENCRYPTION: 2
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
    BETA: 8,
    BUSINESS: 16
};

export const CONTACT_EMAILS_LIMIT = 1000;
export const CONTACTS_LIMIT = 1000;
export const EXPORT_CONTACTS_LIMIT = 50; // Maximum page size for export is 50 from API
export const CONTACTS_REQUESTS_PER_SECOND = 10;
export const ALL_MEMBERS_ID = -100;

export const LABEL_EXCLUSIVE = {
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
export const FREE_ORGANIZATION = {}; // You don't need more, use `user.isPaid`

export const PLANS = {
    PLUS: 'plus',
    PROFESSIONAL: 'professional',
    VISIONARY: 'visionary',
    VPNBASIC: 'vpnbasic',
    VPNPLUS: 'vpnplus'
};

export const PLAN_NAMES = {
    [PLANS.PLUS]: 'Plus',
    [PLANS.PROFESSIONAL]: 'Professional',
    [PLANS.VISIONARY]: 'Visionary',
    [PLANS.VPNBASIC]: 'Basic',
    [PLANS.VPNPLUS]: 'Plus'
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

export const MESSAGE_BUTTONS = {
    READ_UNREAD: 0,
    UNREAD_READ: 1
};

export const KEY_FILE_EXTENSION = '.asc';

export const ENCRYPTION_TYPES = {
    RSA2048: 'RSA2048',
    RSA4096: 'RSA4096',
    X25519: 'X25519'
};

export const DEFAULT_ENCRYPTION_CONFIG = ENCRYPTION_TYPES.RSA2048;

export const ENCRYPTION_CONFIGS = {
    [ENCRYPTION_TYPES.X25519]: { curve: 'ed25519' },
    [ENCRYPTION_TYPES.RSA4096]: { numBits: 4096 },
    [ENCRYPTION_TYPES.RSA2048]: { numBits: 2048 }
};

export const KEY_FLAG = {
    ENCRYPTED_AND_SIGNED: 3,
    ENCRYPTED: 2,
    SIGNED: 1,
    CLEAR_TEXT: 0
};

export const USER_STATUS = {
    DELETED: 0,
    DISABLED: 1,
    USER: 2,
    VPN_ADMIN: 3,
    ADMIN: 4,
    SUPER_ADMIN: 5
};

export const MAILBOX_IDENTIFIERS = {
    inbox: '0',
    allDrafts: '1',
    allSent: '2',
    trash: '3',
    spam: '4',
    allmail: '5',
    starred: '10',
    archive: '6',
    sent: '7',
    drafts: '8',
    search: 'search',
    label: 'label'
};

/* eslint  no-useless-escape: "off" */
export const REGEX_EMAIL = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/i;

export const FILTER_STATUS = {
    ENABLED: 1,
    DISABLED: 0
};
export const VCARD_VERSION = '4.0';
export const CONTACT_CARD_TYPE = {
    ENCRYPTED_AND_SIGNED: 3,
    SIGNED: 2,
    ENCRYPTED: 1,
    CLEAR_TEXT: 0
};

export const LABEL_TYPE = {
    MESSAGE: 1,
    CONTACT_GROUP: 2,
    MESSAGE_FOLDER: 3
};
export const DEFAULT_LOCALE = 'en_US';

export const PASSWORD_MODE = {
    SINGLE: 1,
    TWO_PASSWORD: 2
};

export const TWO_FA_FLAGS = {
    TOTP: 1,
    U2F: 2
};

export const TWO_FA_CONFIG = {
    PERIOD: 30,
    DIGITS: 6,
    ALGORITHM: 'SHA1'
};

export const SORT_DIRECTION = {
    ASC: 'ascending',
    DESC: 'descending'
};

export const SERVER_FEATURES = {
    SECURE_CORE: 1,
    TOR: 2,
    P2P: 4,
    XOR: 8,
    IPV6: 16
};

export const PAYMENT_TOKEN_STATUS = {
    STATUS_PENDING: 0,
    STATUS_CHARGEABLE: 1,
    STATUS_FAILED: 2,
    STATUS_CONSUMED: 3,
    STATUS_NOT_SUPPORTED: 4
};

export const PAYMENT_METHOD_TYPES = {
    CARD: 'card',
    PAYPAL: 'paypal',
    BITCOIN: 'bitcoin',
    CASH: 'cash',
    TOKEN: 'token'
};

export const INVITE_TYPES = {
    MAIL: 1,
    VPN: 2
};

export const CLIENT_IDS = {
    WebMail: 'Web Mail',
    WebMailSettings: 'Web Mail Settings',
    WebCalendar: 'Web Calendar',
    WebContacts: 'Web Contacts',
    WebVPNSettings: 'Web VPN Settings',
    WebDrive: 'Web Drive',
    Admin: 'Web Admin'
};

export const CLIENT_TYPES = {
    MAIL: 1,
    VPN: 2
};
