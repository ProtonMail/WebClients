import { c } from 'ttag';

import type { enums } from '@proton/crypto';

import { EncryptionConfig } from './interfaces';

export const DEFAULT_TIMEOUT = 30000; // default fetch timeout
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
export const MONTH = 4 * WEEK;
export const YEAR = 12 * MONTH;

// Max quantity for all addons
export const MAX_VPN_ADDON = 2000;
export const MAX_MEMBER_ADDON = 5000;
export const MAX_DOMAIN_PRO_ADDON = 99;
export const MAX_DOMAIN_PLUS_ADDON = 10;
export const MAX_ADDRESS_ADDON = 10;
export const MAX_SPACE_ADDON = 20;

export const DOMAIN_PLACEHOLDER = 'example.com';
export const EMAIL_PLACEHOLDER = 'john.doe@example.com';
export const USERNAME_PLACEHOLDER = 'john.doe';

export const BRAND_NAME = 'Proton';
export const MAIL_APP_NAME = 'Proton Mail';
export const CALENDAR_APP_NAME = 'Proton Calendar';
export const DRIVE_APP_NAME = 'Proton Drive';
export const VPN_APP_NAME = 'Proton VPN';
export const ACCOUNT_APP_NAME = 'Proton Account';
export const VERIFY_APP_NAME = 'Proton Verify';

export const APPS = {
    PROTONACCOUNT: 'proton-account',
    PROTONACCOUNTLITE: 'proton-account-lite',
    PROTONMAIL: 'proton-mail',
    PROTONCONTACTS: 'proton-contacts',
    PROTONDRIVE: 'proton-drive',
    PROTONCALENDAR: 'proton-calendar',
    PROTONVPN_SETTINGS: 'proton-vpn-settings',
    PROTONADMIN: 'proton-admin',
    PROTONVERIFICATION: 'proton-verify',
    PROTONEXTENSION: 'proton-extension',
} as const;
export const APPS_CONFIGURATION = {
    [APPS.PROTONACCOUNT]: {
        publicPath: '',
        subdomain: 'account',
        name: ACCOUNT_APP_NAME,
        bareName: 'Account',
        clientID: 'web-account',
        icon: 'brand-proton',
        settingsSlug: 'account',
    },
    [APPS.PROTONACCOUNTLITE]: {
        publicPath: '',
        subdomain: 'account',
        name: ACCOUNT_APP_NAME,
        bareName: 'Account',
        clientID: 'web-account-lite',
        icon: 'brand-proton',
        settingsSlug: 'account',
    },
    [APPS.PROTONMAIL]: {
        publicPath: '',
        subdomain: 'mail',
        name: MAIL_APP_NAME,
        bareName: 'Mail',
        clientID: 'web-mail',
        icon: 'brand-proton-mail',
        settingsSlug: 'mail',
    },
    [APPS.PROTONCONTACTS]: {
        publicPath: '/contacts',
        subdomain: 'contacts',
        name: 'ProtonContacts',
        bareName: 'Contacts',
        clientID: 'web-contacts',
        icon: 'brand-proton',
        settingsSlug: 'contacts',
    },
    [APPS.PROTONDRIVE]: {
        publicPath: '/drive',
        subdomain: 'drive',
        name: DRIVE_APP_NAME,
        bareName: 'Drive',
        clientID: 'web-drive',
        icon: 'brand-proton-drive',
        settingsSlug: 'drive',
    },
    [APPS.PROTONCALENDAR]: {
        publicPath: '/calendar',
        subdomain: 'calendar',
        name: CALENDAR_APP_NAME,
        bareName: 'Calendar',
        clientID: 'web-calendar',
        icon: 'brand-proton-calendar',
        settingsSlug: 'calendar',
    },
    [APPS.PROTONEXTENSION]: {
        publicPath: '',
        subdomain: 'extension',
        name: 'Proton Extension',
        bareName: 'Extension',
        clientID: 'web-account',
        icon: '',
        settingsSlug: '',
    },
    [APPS.PROTONVPN_SETTINGS]: {
        publicPath: '',
        subdomain: '',
        name: VPN_APP_NAME,
        bareName: 'VPN',
        clientID: 'web-vpn-settings',
        icon: 'brand-proton-vpn',
        settingsSlug: 'vpn',
    },
    [APPS.PROTONADMIN]: {
        publicPath: '',
        subdomain: '',
        name: '',
        bareName: 'Admin',
        clientID: 'web-admin',
        icon: 'brand-proton',
        settingsSlug: '',
    },
    [APPS.PROTONVERIFICATION]: {
        publicPath: '',
        subdomain: 'verify',
        name: VERIFY_APP_NAME,
        bareName: 'Verify',
        clientID: 'web-verify',
        icon: 'brand-proton',
        settingsSlug: '',
    },
} as const;

export type APP_KEYS = keyof typeof APPS;
export type APP_NAMES = typeof APPS[APP_KEYS];
export type APP_CLIENT_IDS = typeof APPS_CONFIGURATION[keyof typeof APPS_CONFIGURATION]['clientID'] | 'android_tv-vpn';
export const SSO_PATHS = {
    OAUTH_AUTHORIZE: '/oauth/authorize',
    OAUTH_CONFIRM_FORK: '/oauth/confirm',
    AUTHORIZE: '/authorize',
    FORK: '/login',
    SWITCH: '/switch',
    LOGIN: '/login',
    RESET_PASSWORD: '/reset-password',
    FORGOT_USERNAME: '/forgot-username',
    SIGNUP: '/signup',
    INVITE: '/pre-invite',
    REFER: '/refer-a-friend',
} as const;

export const VPN_HOSTNAME = 'account.protonvpn.com';

export const REQUIRES_INTERNAL_EMAIL_ADDRESS: APP_NAMES[] = [
    APPS.PROTONMAIL,
    APPS.PROTONCONTACTS,
    APPS.PROTONCALENDAR,
    APPS.PROTONDRIVE,
];

export const REQUIRES_NONDELINQUENT: APP_NAMES[] = [
    APPS.PROTONMAIL,
    APPS.PROTONCONTACTS,
    APPS.PROTONCALENDAR,
    APPS.PROTONDRIVE,
];

export enum HTTP_STATUS_CODE {
    OK = 200,
    BAD_REQUEST = 400,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    UNPROCESSABLE_ENTITY = 422,
    INTERNAL_SERVER_ERROR = 500,
}

export enum API_CODES {
    GLOBAL_SUCCESS = 1001,
    SINGLE_SUCCESS = 1000,
}

export const GET_VTIMEZONES_API_LIMIT = 10;
export const GET_CANONICAL_EMAILS_API_LIMIT = 100;

export enum ACCOUNT_DELETION_REASONS {
    DIFFERENT_ACCOUNT = 'DIFFERENT_ACCOUNT',
    TOO_EXPENSIVE = 'TOO_EXPENSIVE',
    MISSING_FEATURE = 'MISSING_FEATURE',
    USE_OTHER_SERVICE = 'USE_OTHER_SERVICE',
    OTHER = 'OTHER',
}

export const FORBIDDEN_LABEL_NAMES = ['inbox', 'drafts', 'sent', 'starred', 'archive', 'spam', 'trash', 'outbox'];

export enum SUBSCRIPTION_CANCELLATION_REASONS {
    DIFFERENT_ACCOUNT = 'DIFFERENT_ACCOUNT',
    TOO_EXPENSIVE = 'TOO_EXPENSIVE',
    MISSING_FEATURE = 'MISSING_FEATURE',
    QUALITY_ISSUE = 'QUALITY_ISSUE',
    STREAMING_SERVICE_UNSUPPORTED = 'STREAMING_SERVICE_UNSUPPORTED',
    SWITCHING_TO_DIFFERENT_SERVICE = 'SWITCHING_TO_DIFFERENT_SERVICE',
    TEMPORARY = 'TEMPORARY',
    OTHER = 'OTHER',
}

export const MAIN_USER_KEY = 'USER_KEYS';
export const SECURE_SESSION_STORAGE_KEY = 'SECURE';
export const MAILBOX_PASSWORD_KEY = 'proton:mailbox_pwd';
export const UID_KEY = 'proton:oauth:UID';
export const USER_ID_KEY = 'proton:userID';
export const LOCAL_ID_KEY = 'proton:localID';
export const PERSIST_SESSION_KEY = 'proton:persistSession';
export const TRUST_SESSION_KEY = 'proton:trustSession';
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

export const PGP_SIGN = 1;
export const DEFAULT_CURRENCY = 'EUR';
export const CURRENCIES = ['EUR', 'USD', 'CHF'] as const;
export const MIN_DONATION_AMOUNT = 100;
export const MIN_CREDIT_AMOUNT = 500;
export const MIN_BITCOIN_AMOUNT = 500;
export const DEFAULT_CREDITS_AMOUNT = 5000;

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

export enum MEMBER_TYPE {
    PROTON = 0,
    MANAGED = 1,
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
    STATUS_DELETING = 2, // not used by clients yet; coming in the future
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
    ORGANIZATION_ADMIN = 2,
}

export enum MEMBER_SUBSCRIBER {
    NON_PAYER = 0,
    PAYER = 1,
}

export enum PACKAGE_TYPE {
    SEND_PM = 1,
    SEND_EO = 2,
    SEND_CLEAR = 4,
    SEND_PGP_INLINE = 8,
    SEND_PGP_MIME = 16,
    SEND_CLEAR_MIME = 32,
}

export enum PACKAGE_SIGNATURES_MODE {
    SIGNATURES_NONE = 0,
    SIGNATURES_ATTACHMENTS = 1,
    SIGNATURES_BODY = 2,
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
    ICS = 'text/calendar',
    APPLICATION_ICS = 'application/ics', // Google's special one that doesn't have standard newlines
}

export enum MIME_TYPES_MORE {
    AUTOMATIC = '',
}

export type DRAFT_MIME_TYPES = MIME_TYPES.PLAINTEXT | MIME_TYPES.DEFAULT;

export type CONTACT_MIME_TYPES = MIME_TYPES.PLAINTEXT | MIME_TYPES.DEFAULT | MIME_TYPES_MORE.AUTOMATIC;

export enum RECIPIENT_TYPES {
    TYPE_INTERNAL = 1,
    TYPE_EXTERNAL = 2,
}

export enum SHOW_IMAGES {
    NONE = 0,
    REMOTE = 1,
    EMBEDDED = 2,
    ALL = 3,
}

export enum IMAGE_PROXY_FLAGS {
    NONE = 0,
    INCORPORATOR = 1,
    PROXY = 2,
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
    DISSIDENT = 64,
    PROTON = 128,
}

export const LOYAL_BONUS_STORAGE = 5 * GIGA;
export const LOYAL_BONUS_CONNECTION = 2;

export const COVID_PLUS_BONUS_STORAGE = 5 * GIGA;
export const COVID_PROFESSIONAL_BONUS_STORAGE = 5 * GIGA;
export const COVID_VISIONARY_BONUS_STORAGE = 10 * GIGA;

export const DEFAULT_CYCLE = 24;

export const VPN_CONNECTIONS = 10;

export enum CYCLE {
    MONTHLY = 1,
    YEARLY = 12,
    TWO_YEARS = 24,
}

export const BLACK_FRIDAY = {
    COUPON_CODE: 'BF2021',
    START: new Date(Date.UTC(2021, 10, 1, 5)), // 6 AM CET
    END: new Date(Date.UTC(2022, 0, 1, 17)), // 6 PM CET
    CYBER_START: new Date(Date.UTC(2020, 10, 30, 6)),
    CYBER_END: new Date(Date.UTC(2020, 11, 1, 6)),
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
    OFFERS = 32,
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

export const ACCENT_COLORNAMES = {
    purple: { color: '#8080FF', getName: () => c('color').t`purple` },
    pink: { color: '#DB60D6', getName: () => c('color').t`pink` },
    strawberry: { color: '#EC3E7C', getName: () => c('color').t`strawberry` },
    carrot: { color: '#F78400', getName: () => c('color').t`carrot` },
    sahara: { color: '#936D58', getName: () => c('color').t`sahara` },
    enzian: { color: '#5252CC', getName: () => c('color').t`enzian` },
    plum: { color: '#A839A4', getName: () => c('color').t`plum` },
    cerise: { color: '#BA1E55', getName: () => c('color').t`cerise` },
    copper: { color: '#C44800', getName: () => c('color').t`copper` },
    soil: { color: '#54473F', getName: () => c('color').t`soil` },
    slateblue: { color: '#415DF0', getName: () => c('color').t`slateblue` },
    pacific: { color: '#179FD9', getName: () => c('color').t`pacific` },
    reef: { color: '#1DA583', getName: () => c('color').t`reef` },
    fern: { color: '#3CBB3A', getName: () => c('color').t`fern` },
    olive: { color: '#B4A40E', getName: () => c('color').t`olive` },
    cobalt: { color: '#273EB2', getName: () => c('color').t`cobalt` },
    ocean: { color: '#0A77A6', getName: () => c('color').t`ocean` },
    pine: { color: '#0F735A', getName: () => c('color').t`pine` },
    forest: { color: '#258723', getName: () => c('color').t`forest` },
    pickle: { color: '#807304', getName: () => c('color').t`pickle` },
};

export const ACCENT_COLORS = Object.values(ACCENT_COLORNAMES).map(({ color }) => color);

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
    MEMBER_DRIVE_PRO = '1member-drivepro2022',
    MEMBER_MAIL_PRO = '1member-mailpro2022',
    MEMBER_BUNDLE_PRO = '1member-bundlepro2022',
    DOMAIN_BUNDLE_PRO = '1domain-bundlepro2022',
    MEMBER_ENTERPRISE = '1member-enterprise2022',
    DOMAIN_ENTERPRISE = '1domain-enterprise2022',
}

export enum PLAN_TYPES {
    PLAN = 1,
    ADDON = 0,
}

export enum PLAN_SERVICES {
    MAIL = 1,
    DRIVE = 2,
    VPN = 4,
}

export const FREE_SUBSCRIPTION = {}; // You don't need more, use `user.isPaid`
export const FREE_ORGANIZATION = {}; // You don't need more, use `user.isPaid`

export enum PLANS {
    FREE = 'free',
    // Old plans
    PLUS = 'plus',
    PROFESSIONAL = 'professional',
    VISIONARY = 'visionary',
    VPNBASIC = 'vpnbasic',
    VPNPLUS = 'vpnplus',
    // New plans
    DRIVE = 'drive2022',
    DRIVE_PRO = 'drivepro2022',
    MAIL = 'mail2022',
    MAIL_PRO = 'mailpro2022',
    VPN = 'vpn2022',
    BUNDLE = 'bundle2022',
    BUNDLE_PRO = 'bundlepro2022',
    ENTERPRISE = 'enterprise2022',
    FAMILY = 'family2022',
    NEW_VISIONARY = 'visionary2022',
}

export const PLAN_NAMES = {
    [PLANS.FREE]: 'Free',
    [PLANS.PLUS]: 'Plus',
    [PLANS.PROFESSIONAL]: 'Professional',
    [PLANS.VISIONARY]: 'Visionary',
    [PLANS.VPNBASIC]: 'Basic',
    [PLANS.VPNPLUS]: 'Plus',
    [PLANS.DRIVE]: 'Drive Plus',
    [PLANS.DRIVE_PRO]: 'Drive Essentials',
    [PLANS.MAIL]: 'Mail Plus',
    [PLANS.MAIL_PRO]: 'Mail Essentials',
    [PLANS.VPN]: 'VPN Plus',
    [PLANS.BUNDLE]: 'Proton Unlimited',
    [PLANS.BUNDLE_PRO]: 'Business',
    [PLANS.ENTERPRISE]: 'Enterprise',
    [PLANS.FAMILY]: 'Proton Family',
    [PLANS.NEW_VISIONARY]: 'Visionary',
};

export const MEMBER_PLAN_MAPPING = {
    [ADDON_NAMES.MEMBER_BUNDLE_PRO]: PLANS.BUNDLE_PRO,
    [ADDON_NAMES.MEMBER_MAIL_PRO]: PLANS.MAIL_PRO,
    [ADDON_NAMES.MEMBER_DRIVE_PRO]: PLANS.DRIVE_PRO,
    [ADDON_NAMES.MEMBER_ENTERPRISE]: PLANS.ENTERPRISE,
};

export enum COUPON_CODES {
    BUNDLE = 'BUNDLE',
    PROTONTEAM = 'PROTONTEAM',
    BLACK_FRIDAY_2018 = 'TWO4ONE2018',
    BLACK_FRIDAY_2019 = 'BF2019',
    BLACK_FRIDAY_2020 = 'BF2020',
    LIFETIME = 'LIFETIME',
    VISIONARYFOREVER = 'VISIONARYFOREVER',
    REFERRAL = 'REFERRAL',
}

export const GIFT_CODE_LENGTH = 16;

export enum MESSAGE_BUTTONS {
    READ_UNREAD = 0,
    UNREAD_READ = 1,
}

export const KEY_FILE_EXTENSION = '.asc';

export enum ENCRYPTION_TYPES {
    CURVE25519 = 'CURVE25519',
    RSA4096 = 'RSA4096',
}

export const DEFAULT_ENCRYPTION_CONFIG = ENCRYPTION_TYPES.CURVE25519;

export const ENCRYPTION_CONFIGS: { [key: string]: EncryptionConfig } = {
    [ENCRYPTION_TYPES.CURVE25519]: { type: 'ecc', curve: 'ed25519' as enums.curve }, // casting is just informational
    [ENCRYPTION_TYPES.RSA4096]: { type: 'rsa', rsaBits: 4096 },
};

export enum KEY_FLAG {
    // Flag used for external addresses
    FLAG_EXTERNAL = 4,
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

export enum INCOMING_DEFAULTS_LOCATION {
    INBOX = +MAILBOX_IDENTIFIERS.inbox,
    SPAM = +MAILBOX_IDENTIFIERS.spam,
    BLOCKED = 14,
}

/* eslint  no-useless-escape: "off" */
export const REGEX_EMAIL =
    /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/i;

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

export type PAYMENT_METHOD_TYPE = PAYMENT_METHOD_TYPES | string;

export enum CLIENT_TYPES {
    MAIL = 1,
    VPN = 2,
}

export enum TOKEN_TYPES {
    EMAIL = 'email',
    SMS = 'sms',
    INVITE = 'invite',
    COUPON = 'coupon',
    PAYMENT = 'payment',
    CAPTCHA = 'captcha',
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
    SCHEDULED = '12',
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

export const DOH_DOMAINS = ['.compute.amazonaws.com'];

export const PROTON_DOMAINS = [
    'protonmail.com',
    'protonmail.ch',
    'protonvpn.com',
    'protonstatus.com',
    'gdpr.eu',
    'protonvpn.net',
    'pm.me',
    'protonirockerxow.onion',
    'proton.me',
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
    [APPS.PROTONMAIL, APPS.PROTONCONTACTS, APPS.PROTONDRIVE, APPS.PROTONCALENDAR, APPS.PROTONEXTENSION].filter(Boolean)
);

export const EXTENSIONS = {
    [APPS.PROTONEXTENSION]: { ID: 'damclcigmmkebnbppkmjpnmambblleon' },
} as const;

export const AES256 = 'aes256';

export const FIBONACCI_LIST = [1, 1, 2, 3, 5, 8, 13];

/* Here is a list of product not to be translated */
export const PRODUCT_NAMES = {
    EASY_SWITCH: 'Easy Switch',
};

// Allowed Log parameters of the /metrics route
export enum METRICS_LOG {
    SIGNUP = 'signup',
    ENCRYPTED_SEARCH = 'encrypted_search',
    DARK_STYLES = 'dark_styles',
}

/** SimpleLogin constants **/
// SimpleLogin tags used to communicate with the web extension
export enum SIMPLE_LOGIN_TAGS {
    EXTENSION_INSTALLED_QUERY = 'EXTENSION_INSTALLED_QUERY',
    EXTENSION_INSTALLED_RESPONSE = 'EXTENSION_INSTALLED_RESPONSE',
}

export enum SIMPLE_LOGIN_EXTENSION_LINKS {
    MAIN_PAGE = 'https://simplelogin.io',
    DASHBOARD = 'https://app.simplelogin.io/dashboard/',
}
