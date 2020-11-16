export const RETRY_DELAY_MAX = 10; // seconds
export const RETRY_ATTEMPTS_MAX = 5; // how many times to try the same request
export const OFFLINE_RETRY_DELAY = 2000; // how much time in ms to wait before retrying an offline request
export const OFFLINE_RETRY_ATTEMPTS_MAX = 0; // how many times to try the same request when offline
export const MILLISECOND = 1;
export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;

// Max quantity for all addons
export const MAX_VPN_ADDON = 496;
export const MAX_MEMBER_ADDON = 5000;
export const MAX_DOMAIN_PRO_ADDON = 99;
export const MAX_DOMAIN_PLUS_ADDON = 10;
export const MAX_ADDRESS_ADDON = 10;
export const MAX_SPACE_ADDON = 16;

export const DOMAIN_PLACEHOLDER = 'example.com';
export const EMAIL_PLACEHOLDER = 'john.doe@example.com';
export const USERNAME_PLACEHOLDER = 'john.doe';

export const BRAND_NAME = 'Proton';

export const APPS = {
    PROTONACCOUNT: 'proton-account',
    PROTONMAIL: 'proton-mail',
    PROTONMAIL_SETTINGS: 'proton-mail-settings',
    PROTONCONTACTS: 'proton-contacts',
    PROTONDRIVE: 'proton-drive',
    PROTONCALENDAR: 'proton-calendar',
    PROTONVPN_SETTINGS: 'proton-vpn-settings',
    PROTONADMIN: 'proton-admin',
} as const;
export const APPS_CONFIGURATION = {
    [APPS.PROTONACCOUNT]: {
        publicPath: '',
        subdomain: 'account',
        name: 'Proton Account',
        clientID: 'WebAccount',
        icon: 'protonaccount',
    },
    [APPS.PROTONMAIL]: {
        publicPath: '',
        subdomain: 'beta',
        name: 'ProtonMail',
        clientID: 'WebMail',
        icon: 'protonmail',
    },
    [APPS.PROTONMAIL_SETTINGS]: {
        publicPath: '/settings',
        subdomain: 'beta',
        name: 'ProtonMail',
        // Needs to be the same ClientID as mail since they are deployed as an embedded app
        clientID: 'WebMail',
        icon: 'protonmail',
    },
    [APPS.PROTONCONTACTS]: {
        publicPath: '/contacts',
        subdomain: 'contacts',
        name: 'ProtonContacts',
        clientID: 'WebContacts',
        icon: 'protoncontacts',
    },
    [APPS.PROTONDRIVE]: {
        publicPath: '/drive',
        subdomain: 'drive',
        name: 'ProtonDrive',
        clientID: 'WebDrive',
        icon: 'protondrive',
    },
    [APPS.PROTONCALENDAR]: {
        publicPath: '/calendar',
        subdomain: 'calendar',
        name: 'ProtonCalendar',
        clientID: 'WebCalendar',
        icon: 'protoncalendar',
    },
    [APPS.PROTONVPN_SETTINGS]: {
        publicPath: '',
        subdomain: '',
        name: 'ProtonVPN',
        clientID: 'WebVPNSettings',
        icon: 'protonvpn',
    },
    [APPS.PROTONADMIN]: {
        publicPath: '',
        subdomain: '',
        name: '',
        clientID: 'WebAdmin',
        icon: '',
    },
} as const;
export type APP_KEYS = keyof typeof APPS;
export type APP_NAMES = typeof APPS[APP_KEYS];
export const SSO_PATHS = {
    AUTHORIZE: '/authorize',
    FORK: '/login',
    SWITCH: '/switch',
    LOGIN: '/login',
    RESET_PASSWORD: '/reset-password',
    FORGOT_USERNAME: '/forgot-username',
    SIGNUP: '/signup',
} as const;

export const REQUIRES_INTERNAL_EMAIL_ADDRESS: APP_NAMES[] = [
    APPS.PROTONMAIL,
    APPS.PROTONMAIL_SETTINGS,
    APPS.PROTONCONTACTS,
    APPS.PROTONCALENDAR,
];

export const REQUIRES_NONDELINQUENT: APP_NAMES[] = [
    APPS.PROTONMAIL,
    APPS.PROTONCONTACTS,
    APPS.PROTONCALENDAR,
    APPS.PROTONDRIVE,
];

export enum API_CODES {
    GLOBAL_SUCCESS = 1001,
    SINGLE_SUCCESS = 1000,
}

export enum ACCOUNT_DELETION_REASONS {
    DIFFERENT_ACCOUNT = 'DIFFERENT_ACCOUNT',
    TOO_EXPENSIVE = 'TOO_EXPENSIVE',
    MISSING_FEATURE = 'MISSING_FEATURE',
    USE_OTHER_SERVICE = 'USE_OTHER_SERVICE',
    OTHER = 'OTHER',
}

export const MAIN_USER_KEY = 'USER_KEYS';
export const SECURE_SESSION_STORAGE_KEY = 'SECURE';
export const MAILBOX_PASSWORD_KEY = 'proton:mailbox_pwd';
export const UID_KEY = 'proton:oauth:UID';
export const LOCAL_ID_KEY = 'proton:localID';
export const INTERVAL_EVENT_TIMER = 30 * 1000;
export const MAX_SIZE_SCREENSHOT = 500 * 1000;

export enum EVENT_ACTIONS {
    DELETE = 0,
    CREATE = 1,
    UPDATE = 2,
    UPDATE_DRAFT = 2,
    UPDATE_FLAGS = 3,
}
export enum USER_ROLES {
    FREE_ROLE = 0,
    MEMBER_ROLE = 1,
    ADMIN_ROLE = 2,
}
export const ELEMENTS_PER_PAGE = 10;
export enum INVOICE_OWNER {
    USER = 0,
    ORGANIZATION = 1,
}
export const PM_SIGNATURE = 'Sent with <a href="https://protonmail.com/" target="_blank">ProtonMail</a> Secure Email.';
export const PGP_SIGN = 1;
export const DEFAULT_CURRENCY = 'EUR';
export const CURRENCIES = ['EUR', 'USD', 'CHF'];
export const MIN_DONATION_AMOUNT = 100;
export const MIN_CREDIT_AMOUNT = 500;
export const MIN_BITCOIN_AMOUNT = 500;
export const DEFAULT_CREDITS_AMOUNT = 5000;
export const DEFAULT_DONATION_AMOUNT = 5000;
export enum AUTH_LOG_EVENTS {
    LOGIN_FAILURE_PASSWORD = 0,
    LOGIN_SUCCESS = 1,
    LOGOUT = 2,
    LOGIN_FAILURE_2FA = 3,
    LOGIN_SUCCESS_AWAIT_2FA = 4,
}
export enum INVOICE_TYPE {
    OTHER = 0,
    SUBSCRIPTION = 1,
    CANCELLATION = 2,
    CREDIT = 3,
    DONATION = 4,
    CHARGEBACK = 5,
    RENEWAL = 6,
    REFUND = 7,
    MODIFICATION = 8,
    ADDITION = 9,
}
export enum INVOICE_STATE {
    UNPAID = 0,
    PAID = 1,
    VOID = 2,
    BILLED = 3,
    WRITEOFF = 4,
}

export enum UNPAID_STATE {
    NOT_UNPAID,
    AVAILABLE,
    OVERDUE,
    DELINQUENT,
    NO_RECEIVE,
}

export const BASE_SIZE = 1024;
export const GIGA = BASE_SIZE ** 3;

export enum LOGS_STATE {
    DISABLE = 0,
    BASIC = 1,
    ADVANCED = 2,
}

export enum MEMBER_TYPE {
    MEMBER = 0,
    SUB_MEMBER = 1,
}

export enum DOMAIN_STATE {
    DOMAIN_STATE_DEFAULT = 0, // Domain's State before verify or after deactivation
    DOMAIN_STATE_ACTIVE = 1, // active once verified
    DOMAIN_STATE_WARN = 2, // detected backward DNS change after ACTIVE
}

export enum VERIFY_STATE {
    VERIFY_STATE_DEFAULT = 0, // 0 is default, no good
    VERIFY_STATE_EXIST = 1, // 1 is has code but doesn't match DB's, no good
    VERIFY_STATE_GOOD = 2, // 2 is has code and matches DB's, good!
}

export enum MX_STATE {
    MX_STATE_DEFAULT = 0, // 0 is default, no good
    MX_STATE_NO_US = 1, // 1 is set but does not have us
    MX_STATE_INC_US = 2, // 2 is includes our MX but priority no good
    MX_STATE_GOOD = 3, // 3 is includes our MX and we are highest and pri is legit, good!
}

export enum SPF_STATE {
    SPF_STATE_DEFAULT = 0, // 0 is default, no spf record
    SPF_STATE_ONE = 1, // 1 is has spf record but not us
    SPF_STATE_MULT = 2, // 2 is has multiple spf records, no good
    SPF_STATE_GOOD = 3, // 3 is has spf record and includes us, good!
}

export enum DKIM_STATE {
    DKIM_STATE_DEFAULT = 0,
    DKIM_STATE_ERROR = 3,
    DKIM_STATE_GOOD = 4,
    DKIM_STATE_WARNING = 6,
}

export enum DMARC_STATE {
    DMARC_STATE_DEFAULT = 0, // 0 is default, no dmarc record
    DMARC_STATE_ONE = 1, // 1 is found entries but format wrong
    DMARC_STATE_MULT = 2, // 2 is multiple dmarc records, no good
    DMARC_STATE_GOOD = 3, // 3 is good!
}

export enum ADDRESS_STATUS {
    STATUS_DISABLED = 0,
    STATUS_ENABLED = 1,
}

export enum ADDRESS_TYPE {
    TYPE_ORIGINAL = 1,
    TYPE_ALIAS = 2,
    TYPE_CUSTOM_DOMAIN = 3,
    TYPE_PREMIUM = 4,
    TYPE_EXTERNAL = 5,
}

export enum RECEIVE_ADDRESS {
    RECEIVE_YES = 1,
    RECEIVE_NO = 0,
}

export enum SEND_ADDRESS {
    SEND_YES = 1,
    SEND_NO = 0,
}

export enum MEMBER_PRIVATE {
    READABLE = 0,
    UNREADABLE = 1,
}

export enum MEMBER_ROLE {
    ORGANIZATION_NONE = 0,
    ORGANIZATION_MEMBER = 1,
    ORGANIZATION_OWNER = 2,
}

export enum PACKAGE_TYPE {
    SEND_PM = 1,
    SEND_EO = 2,
    SEND_CLEAR = 4,
    SEND_PGP_INLINE = 8,
    SEND_PGP_MIME = 16,
    SEND_CLEAR_MIME = 32,
}

export enum PGP_SCHEMES {
    PGP_INLINE = 'pgp-inline',
    PGP_MIME = 'pgp-mime',
}

export enum PGP_SCHEMES_MORE {
    GLOBAL_DEFAULT = '',
}

export type CONTACT_PGP_SCHEMES = PGP_SCHEMES | PGP_SCHEMES_MORE;

export enum MIME_TYPES {
    MIME = 'multipart/mixed',
    PLAINTEXT = 'text/plain',
    DEFAULT = 'text/html',
}

export enum MIME_TYPES_MORE {
    AUTOMATIC = '',
}

export type DRAFT_MIME_TYPES = MIME_TYPES.PLAINTEXT | MIME_TYPES.DEFAULT;

export type CONTACT_MIME_TYPES = MIME_TYPES.PLAINTEXT | MIME_TYPES.DEFAULT | MIME_TYPES_MORE.AUTOMATIC;

export enum RECIPIENT_TYPES {
    TYPE_INTERNAL = 1,
    TYPE_EXTERNAL = 2,
    TYPE_NO_RECEIVE = 3,
}

export enum SHOW_IMAGES {
    NONE = 0,
    REMOTE = 1,
    EMBEDDED = 2,
    ALL = 3,
}

export enum COMPOSER_MODE {
    POPUP = 0,
    MAXIMIZED = 1,
}

export enum VIEW_LAYOUT {
    COLUMN = 0,
    ROW = 1,
}

export enum STICKY_LABELS {
    OFF = 0,
    ON = 1,
}

export enum VIEW_MODE {
    GROUP = 0,
    SINGLE = 1,
}

export enum SHOW_MOVED {
    NONE = 0,
    DRAFTS = 1,
    SENT = 2,
    DRAFTS_AND_SENT = 3,
}

export enum DRAFT_TYPE {
    NORMAL = 'text/html',
    PLAIN_TEXT = 'text/plain',
}

export enum RIGHT_TO_LEFT {
    OFF = 0,
    ON = 1,
}

export enum ORGANIZATION_FLAGS {
    LOYAL = 1,
    COVID = 2,
}

export const LOYAL_BONUS_STORAGE = 5 * GIGA;
export const LOYAL_BONUS_CONNECTION = 2;

export const COVID_PLUS_BONUS_STORAGE = 5 * GIGA;
export const COVID_PROFESSIONAL_BONUS_STORAGE = 5 * GIGA;
export const COVID_VISIONARY_BONUS_STORAGE = 10 * GIGA;

export const DEFAULT_CYCLE = 12;

export enum CYCLE {
    MONTHLY = 1,
    YEARLY = 12,
    TWO_YEARS = 24,
}

export const BLACK_FRIDAY = {
    COUPON_CODE: 'BF2020',
    START: new Date(Date.UTC(2020, 10, 16, 6)),
    CYBER_START: new Date(Date.UTC(2020, 10, 30, 6)),
    CYBER_END: new Date(Date.UTC(2020, 11, 1, 6)),
    END: new Date(Date.UTC(2020, 11, 15, 6)),
};

export const PRODUCT_PAYER = {
    START: new Date(Date.UTC(2020, 9, 28, 6)),
    END: new Date(Date.UTC(2020, 11, 15, 6)),
};

export const MIN_PAYPAL_AMOUNT = 500;
export const MAX_PAYPAL_AMOUNT = 99999900;
export enum NEWS {
    ANNOUNCEMENTS = 1,
    FEATURES = 2,
    NEWSLETTER = 4,
    BETA = 8,
    BUSINESS = 16,
}

export const CONTACT_EMAILS_LIMIT = 1000;
export const CONTACTS_LIMIT = 1000;
export const EXPORT_CONTACTS_LIMIT = 50; // Maximum page size for export is 50 from API
export const CONTACTS_REQUESTS_PER_SECOND = 10;
export const ALL_MEMBERS_ID = -100;

export enum LABEL_EXCLUSIVE {
    FOLDER = 1,
    LABEL = 0,
}

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
    '#dfb286',
];
export const REGEX_IMAGE_EXTENSION = /\.(gif|jpe?g|tiff|png)$/i;

export const DARK_MODE_CLASS = 'isDarkMode';

export enum LINK_WARNING {
    KEY = 'link_warning',
    VALUE = 'dontAsk',
}

export enum ADDON_NAMES {
    ADDRESS = '5address',
    MEMBER = '1member',
    DOMAIN = '1domain',
    SPACE = '1gb',
    VPN = '1vpn',
}

export enum PLAN_TYPES {
    PLAN = 1,
    ADDON = 0,
}

export enum PLAN_SERVICES {
    MAIL = 1,
    VPN = 4,
}

export const FREE_SUBSCRIPTION = {}; // You don't need more, use `user.isPaid`
export const FREE_ORGANIZATION = {}; // You don't need more, use `user.isPaid`

export enum PLANS {
    PLUS = 'plus',
    PROFESSIONAL = 'professional',
    VISIONARY = 'visionary',
    VPNBASIC = 'vpnbasic',
    VPNPLUS = 'vpnplus',
}

export const FREE = 'free';

export const PLAN_NAMES = {
    [PLANS.PLUS]: 'Plus',
    [PLANS.PROFESSIONAL]: 'Professional',
    [PLANS.VISIONARY]: 'Visionary',
    [PLANS.VPNBASIC]: 'Basic',
    [PLANS.VPNPLUS]: 'Plus',
};

export enum COUPON_CODES {
    BUNDLE = 'BUNDLE',
    PROTONTEAM = 'PROTONTEAM',
    BLACK_FRIDAY_2018 = 'TWO4ONE2018',
    BLACK_FRIDAY_2019 = 'BF2019',
    LIFETIME = 'LIFETIME',
    VISIONARYFOREVER = 'VISIONARYFOREVER',
}

export const GIFT_CODE_LENGTH = 16;

export enum PERMISSIONS {
    ADMIN = 'admin',
    MEMBER = 'member',
    FREE = 'free',
    UPGRADER = 'upgrader',
    MULTI_USERS = 'multi-users',
    PAID = 'paid',
    PAID_MAIL = 'paid-mail',
    PAID_VPN = 'paid-vpn',
    NOT_SUB_USER = 'not-sub-user',
}

export enum MESSAGE_BUTTONS {
    READ_UNREAD = 0,
    UNREAD_READ = 1,
}

export const KEY_FILE_EXTENSION = '.asc';

export enum ENCRYPTION_TYPES {
    RSA2048 = 'RSA2048',
    RSA4096 = 'RSA4096',
    X25519 = 'X25519',
}

export const DEFAULT_ENCRYPTION_CONFIG = ENCRYPTION_TYPES.RSA2048;

export const ENCRYPTION_CONFIGS = {
    [ENCRYPTION_TYPES.X25519]: { curve: 'ed25519' },
    [ENCRYPTION_TYPES.RSA4096]: { numBits: 4096 },
    [ENCRYPTION_TYPES.RSA2048]: { numBits: 2048 },
};

export enum KEY_FLAG {
    // Key can be used to encrypt
    FLAG_NOT_OBSOLETE = 2,
    // Key can be used to verify signatures
    FLAG_NOT_COMPROMISED = 1,
}

export enum USER_STATUS {
    DELETED = 0,
    DISABLED = 1,
    USER = 2,
    VPN_ADMIN = 3,
    ADMIN = 4,
    SUPER_ADMIN = 5,
}

export enum MAILBOX_IDENTIFIERS {
    inbox = '0',
    allDrafts = '1',
    allSent = '2',
    trash = '3',
    spam = '4',
    allmail = '5',
    starred = '10',
    archive = '6',
    sent = '7',
    drafts = '8',
    outbox = '9',
    search = 'search',
    label = 'label',
}

export const BLACKLIST_LOCATION = +MAILBOX_IDENTIFIERS.spam;
export const WHITELIST_LOCATION = +MAILBOX_IDENTIFIERS.inbox;

/* eslint  no-useless-escape: "off" */
export const REGEX_EMAIL = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/i;

export enum FILTER_STATUS {
    ENABLED = 1,
    DISABLED = 0,
}
export const VCARD_VERSION = '4.0';
export enum CONTACT_CARD_TYPE {
    ENCRYPTED_AND_SIGNED = 3,
    SIGNED = 2,
    ENCRYPTED = 1,
    CLEAR_TEXT = 0,
}

export enum LABEL_TYPE {
    MESSAGE_LABEL = 1,
    CONTACT_GROUP = 2,
    MESSAGE_FOLDER = 3,
}
export const DEFAULT_LOCALE = 'en_US';

export enum PASSWORD_MODE {
    SINGLE = 1,
    TWO_PASSWORD = 2,
}

export enum TWO_FA_FLAGS {
    TOTP = 1,
    U2F = 2,
}

export enum TWO_FA_CONFIG {
    PERIOD = 30,
    DIGITS = 6,
    ALGORITHM = 'SHA1',
}

export enum SORT_DIRECTION {
    ASC = 'ASC',
    DESC = 'DESC',
}

export enum SERVER_FEATURES {
    SECURE_CORE = 1,
    TOR = 2,
    P2P = 4,
    XOR = 8,
    IPV6 = 16,
}

export enum PAYMENT_TOKEN_STATUS {
    STATUS_PENDING = 0,
    STATUS_CHARGEABLE = 1,
    STATUS_FAILED = 2,
    STATUS_CONSUMED = 3,
    STATUS_NOT_SUPPORTED = 4,
}

export enum PAYMENT_METHOD_TYPES {
    CARD = 'card',
    PAYPAL = 'paypal',
    PAYPAL_CREDIT = 'paypal-credit',
    BITCOIN = 'bitcoin',
    CASH = 'cash',
    TOKEN = 'token',
}

export enum INVITE_TYPES {
    MAIL = 1,
    VPN = 2,
}

export enum CLIENT_IDS {
    // Old apps
    Web = 'Web',
    Admin = 'Web Admin',
    // New apps
    WebAccount = 'Web Account',
    WebMail = 'Web Mail',
    WebMailSettings = 'Web Mail Settings',
    WebCalendar = 'Web Calendar',
    WebContacts = 'Web Contacts',
    WebVPNSettings = 'Web VPN Settings',
    WebDrive = 'Web Drive',
    WebAdmin = 'Web Admin',
    // Android
    AndroidTvVPN = 'AndroidTvVPN',
}
export type CLIENT_ID_KEYS = keyof typeof CLIENT_IDS;

export const CLIENT_TYPES = {
    MAIL: 1,
    VPN: 2,
} as const;

export enum TOKEN_TYPES {
    EMAIL = 'email',
    SMS = 'sms',
    INVITE = 'invite',
    COUPON = 'coupon',
    PAYMENT = 'payment',
}

export enum MAILBOX_LABEL_IDS {
    INBOX = '0',
    ALL_DRAFTS = '1',
    ALL_SENT = '2',
    TRASH = '3',
    SPAM = '4',
    ALL_MAIL = '5',
    STARRED = '10',
    ARCHIVE = '6',
    SENT = '7',
    DRAFTS = '8',
    OUTBOX = '9',
}

export enum AutoReplyDuration {
    FIXED = 0,
    DAILY = 1,
    WEEKLY = 2,
    MONTHLY = 3,
    PERMANENT = 4,
}

export const ADD_CARD_MODE = 'add-card';
export const DKIM_RSA_1024 = 0;
export const DKIM_RSA_2048 = 1;
export enum DKIM_KEY_STATUS {
    ACTIVE = 0,
    PENDING = 1,
    RETIRED = 2,
    DECEASED = 3,
}

export enum DKIM_KEY_DNS_STATUS {
    NOT_SET = 0,
    GOOD = 1,
    INVALID = 2,
}

export enum DENSITY {
    COMFORTABLE = 0,
    COMPACT = 1,
}

export enum SPAM_SCORE {
    PM_SPOOFED = 100,
    DMARC_FAILED = 101,
    PHISHING = 102,
}

export const COLLAPSE_MENU_KEY = 'collapse-menu';
export const ROOT_FOLDER = 0;

export const USER_SCOPES = {
    DRIVE: 68719476736,
};

export const MAJOR_DOMAINS = [
    'protonmail.com',
    'protonmail.ch',
    'pm.me',
    'gmail.com',
    'live.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
];

export enum LINK_TYPES {
    WEB = 'web',
    EMAIL = 'email',
    PHONE = 'phone',
}

declare const WEBPACK_FEATURE_FLAGS: string;
// This is a definition coming from webpack. Hide behind typeof for the test env.
export const FEATURE_FLAGS = typeof WEBPACK_FEATURE_FLAGS === 'undefined' ? '' : WEBPACK_FEATURE_FLAGS;

declare const WEBPACK_APP_MODE: string;
export const APP_MODE = typeof WEBPACK_APP_MODE === 'undefined' ? '' : WEBPACK_APP_MODE;
export const isSSOMode = APP_MODE === 'sso';
export const isStandaloneMode = APP_MODE === 'standalone';

declare const WEBPACK_PUBLIC_PATH: string;
export const PUBLIC_PATH = typeof WEBPACK_PUBLIC_PATH === 'undefined' ? '' : WEBPACK_PUBLIC_PATH;

interface OpenPGPFile {
    filepath: string;
    integrity?: string;
}

const DUMMY_FILE = {
    filepath: '/',
};

declare const WEBPACK_OPENPGP: { main: OpenPGPFile; compat: OpenPGPFile; elliptic: OpenPGPFile; worker: OpenPGPFile };
export const OPENPGP =
    typeof WEBPACK_OPENPGP === 'undefined'
        ? { main: DUMMY_FILE, compat: DUMMY_FILE, elliptic: DUMMY_FILE, worker: DUMMY_FILE }
        : WEBPACK_OPENPGP;

export const FORKABLE_APPS = new Set(
    [APPS.PROTONMAIL, APPS.PROTONMAIL_SETTINGS, APPS.PROTONCONTACTS, APPS.PROTONDRIVE, APPS.PROTONCALENDAR].filter(
        Boolean
    )
);

export const AES256 = 'aes256';
