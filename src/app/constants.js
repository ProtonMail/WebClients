export const MAIN_KEY = '0';
export const REMOTE = 1;
export const EMBEDDED = 2;
export const MODAL_Z_INDEX = 11000;
export const CONVERSATION_REQUEST_SIZE = 10;
export const GIFT_CODE_LENGTH = 16;
export const MESSAGE_MAX_RECIPIENTS = 100;
export const MAX_OUTSIDE_REPLY = 4;
export const MAILBOX_PASSWORD_KEY = 'proton:mailbox_pwd';
export const WHITELIST = ['notify@protonmail.com'];
export const MAX_TITLE_LENGTH = 255;
export const AWESOMEPLETE_MAX_ITEMS = 20;
export const WIZARD_ENABLED = true;
export const FREE_USER_ROLE = 0;
export const PAID_MEMBER_ROLE = 1;
export const PAID_ADMIN_ROLE = 2;
export const CURRENCIES = ['USD', 'EUR', 'CHF'];
export const BILLING_CYCLE = [1, 12, 24];
export const PHOTO_PLACEHOLDER_URL = '/assets/img/photo-placeholder.png';
export const INVITE_URL = 'https://protonmail.com/invite';
export const OAUTH_KEY = 'proton:oauth';
export const CUSTOM_DOMAIN_ADDRESS = 3;
export const MESSAGE_VIEW_MODE = 1;
export const CONVERSATION_VIEW_MODE = 0;
export const ROW_MODE = 1;
export const COLUMN_MODE = 0;
export const ENCRYPTION_DEFAULT = 2048;
export const MAX_SIZE_SCREENSHOT = 500 * 1000;
export const CLIENT_TYPE = 1;
export const CONTACT_EMAILS_LIMIT = 1000;
export const CONTACTS_LIMIT = 1000;
export const EXPORT_CONTACTS_LIMIT = 50;
export const MAX_VPN = 500;
export const MAX_MEMBER = 100;
export const HUGE_MEMBER = 5000;
export const TIMEOUT = 30 * 1000; // timeout in milliseconds
export const TEMP_STORAGE_LIFETIME = 60 * 1000;
export const BASE_SIZE = 1024; // define the base used for byte
export const KEY_VERSION = 3;
export const PM_ADDRESS = 1;
export const PM_ALIAS = 2;
export const REPLY = 0;
export const REPLY_ALL = 1;
export const FORWARD = 2;
// FIXME FILTER MIGRATION: CHANGE FILTER VERSION TO 2 ONCE API IS READY
export const FILTER_VERSION = 1;
export const ATTACHMENT_SIZE_LIMIT = 25; // MB
export const ATTACHMENT_NUMBER_LIMIT = 100;
export const MAX_NUMBER_COMPOSER = 3;
export const MESSAGE_LIMIT = 100;
export const CONVERSATION_LIMIT = 100;

export const EVENTS_MS = {
    INTERVAL_EVENT_TIMER: 30 * 1000, // Time in ms between querying the event log (every 30 seconds)
    LOOP_DEBOUNCE_MS: 500 // Interval in ms during which the old event call is returned if calling again.
};
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

export const TIMEOUT_PRELOAD_MESSAGE = 500; // milliseconds
export const UPLOAD_GRADIENT_DARK = '147, 145, 209'; // dark rgb color for upload progress bar
export const UPLOAD_GRADIENT_LIGHT = '255, 255, 255'; // light rgb color for upload progress bar
export const ENC_OUT_ENC_REPLY = 6; // encrypted for outside
export const SAVE_TIMEOUT_TIME = 3000; // 3 seconds
export const SAVE_THROTTLE_TIME = 10000; // 10 seconds
export const MAX_EXPIRATION_TIME = 672; // hours
export const INVOICES_PER_PAGE = 25;
export const ELEMENTS_PER_PAGE = 50;
export const CONTACTS_PER_PAGE = 1000;
export const HD_BREAKPOINT = 1920;
export const DESKTOP_BREAKPOINT = 1200;
export const ROW_BREAKPOINT = 960;
export const MOBILE_BREAKPOINT = 800;
export const MIN_PAYPAL_AMOUNT = 500;
export const MAX_PAYPAL_AMOUNT = 99999900;
export const SIGNATURE_START = Math.Infinity; // TODO: when the clients were force updated
export const MIN_BITCOIN_AMOUNT = 500;
export const BTC_DONATION_ADDRESS = '1Q1nhq1NbxPYAbw1BppwKbCqg58ZqMb9A8';
export const IFRAME_SECURE_ORIGIN = 'https://secure.protonmail.com';
export const DEFAULT_CURRENCY = 'EUR';
export const CHANGELOG_PATH = 'assets/changelog.tpl.html';
export const DEFAULT_CYCLE = 12;
export const CANCEL_REQUEST = 'CANCEL_REQUEST';
export const DEFAULT_TRANSLATION = 'en_US';
export const CONTACTS_LIMIT_ENCRYPTION = 20;
export const CONTACTS_LIMIT_UPLOAD = 50;
export const CONTACTS_LIMIT_REQUESTS = 10;
export const CONTACT_SETTINGS_DEFAULT = 'DEFAULT_VALUE';
export const CONTACT_IMG_SIZE = 128;
export const CONTACT_ADD_ID = 'ADD_ADDRESS_MODAL';
export const LARGE_KEY_SIZE = 50 * 1024;
export const VCARD_VERSION = '4.0';
export const AES256 = 'aes256';
export const VCARD_KEYS = [
    'fn',
    'email',
    'adr',
    'tel',
    'note',
    'kind',
    'source',
    'xml',
    'nickname',
    'photo',
    'bday',
    'anniversary',
    'gender',
    'impp',
    'lang',
    'tz',
    'geo',
    'title',
    'role',
    'logo',
    'org',
    'member',
    'related',
    'categories',
    'rev',
    'sound',
    'uid',
    'clientpidmap',
    'url',
    'key',
    'fburl',
    'caladruri',
    'caluri'
];
export const VCARD_TYPES = [
    'work',
    'home',
    'text',
    'voice',
    'fax',
    'cell',
    'video',
    'pager',
    'textphone',
    'iana-token',
    'x-name',
    'contact',
    'acquaintance',
    'friend',
    'met',
    'co-worker',
    'colleague',
    'co-resident',
    'neighbor',
    'child',
    'parent',
    'sibling',
    'spouse',
    'kin',
    'muse',
    'crush',
    'date',
    'sweetheart',
    'me',
    'agent',
    'emergency'
];
export const VCARD_KEY_FIELDS = [
    'key',
    'x-pm-mimetype',
    'x-pm-encrypt',
    'x-pm-sign',
    'x-pm-scheme',
    'x-pm-tls',
    'x-pm-dane'
];

export const MESSAGE_FLAGS = {
    FLAG_RECEIVED: 1, // whether a message is received
    FLAG_SENT: 2, // whether a message is sent
    FLAG_INTERNAL: 4, // whether the message is between ProtonMail recipients
    FLAG_E2E: 8, // whether the message is end-to-end encrypted
    FLAG_AUTO: 16, // whether the message is an autoresponse
    FLAG_REPLIED: 32, // whether the message is replied to
    FLAG_REPLIEDALL: 64, // whether the message is replied all to
    FLAG_FORWARDED: 128, // whether the message is forwarded
    FLAG_AUTOREPLIED: 256, // whether the message has been responded to with an autoresponse
    FLAG_IMPORTED: 512, // whether the message is an import
    FLAG_OPENED: 1024, // whether the message has ever been opened by the user
    FLAG_RECEIPT_SENT: 2048, // whether a read receipt has been sent in response to the message
    // For drafts only
    FLAG_RECEIPT_REQUEST: 65536, // whether to request a read receipt for the message
    FLAG_PUBLIC_KEY: 131072, // whether to attach the public key
    FLAG_SIGN: 262144 // whether to sign the message
};

export const PASSWORD_MODE = {
    TWO_MODE: 2,
    ONE_MODE: 1
};

export const SPAM_SCORE = {
    PM_SPOOFED: 100,
    DMARC_FAILED: 101,
    PHISHING: 102
};

export const CONTACT_CARD_TYPE = {
    ENCRYPTED_AND_SIGNED: 3,
    SIGNED: 2,
    ENCRYPTED: 1,
    CLEAR_TEXT: 0
};

export const KEY_FLAG = {
    ENCRYPTED_AND_SIGNED: 3,
    ENCRYPTED: 2,
    SIGNED: 1,
    CLEAR_TEXT: 0
};

export const STATUS = {
    DELETE: 0,
    CREATE: 1,
    UPDATE: 2,
    UPDATE_DRAFT: 2,
    UPDATE_FLAGS: 3
};

export const CYCLE = {
    MONTHLY: 1,
    YEARLY: 12,
    TWO_YEARS: 24
};

export const PRODUCT_TYPE = {
    MAIL: 1,
    VPN: 2
};

export const RECIPIENT_TYPE = {
    TYPE_INTERNAL: 1,
    TYPE_EXTERNAL: 2,
    TYPE_NO_RECEIVE: 3
};

export const PLANS = {
    PLAN: {
        PLUS: 'plus',
        PROFESSIONAL: 'professional',
        VISIONARY: 'visionary',
        VPN_BASIC: 'vpnbasic',
        VPN_PLUS: 'vpnplus'
    },
    ADDON: {
        ADDRESS: '5address',
        MEMBER: '1member',
        DOMAIN: '1domain',
        SPACE: '1gb',
        VPN: '1vpn'
    }
};

export const PACKAGE_TYPE = {
    SEND_PM: 1,
    SEND_EO: 2,
    SEND_CLEAR: 4,
    SEND_PGP_INLINE: 8,
    SEND_PGP_MIME: 16
};

export const PLANS_TYPE = {
    PLAN: 1,
    ADDON: 0
};

export const FONT_SIZE = {
    small: 8,
    normal: 14,
    large: 20,
    huge: 26
};

export const COMPOSER_COLOR = {
    COLOR: '#222222',
    BACKGROUND: '#FFFFFF'
};

export const FONT_COLOR = {
    white: ['#FFFFFF', '#DADADA', '#B5B5B5', '#909090', '#6B6B6B', '#464646', '#222222'],
    magenta: ['#F6CBCB', '#EC9798', '#E36667', '#ED4139', '#CF3932', '#9A2B25', '#681D19'],
    blue: ['#CDE1F2', '#9CC3E5', '#6CA6D9', '#3B83C2', '#2A47F6', '#145390', '#0F3A62'],
    green: ['#D7EAD3', '#B3D6A9', '#8FC380', '#77F241', '#66A657', '#3A762B', '#29501F'],
    yellow: ['#FFF2CD', '#FEE59C', '#FCD86F', '#FDF84E', '#F2C246', '#BE8F35', '#7F6124']
};

export const UNPAID_STATE = {
    NOT: 0,
    AVAILABLE: 1,
    OVERDUE: 2,
    DELINQUENT: 3,
    NO_RECEIVE: 4
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

export const VERIFICATION_STATUS = {
    NOT_VERIFIED: -1,
    NOT_SIGNED: 0,
    SIGNED_AND_VALID: 1,
    SIGNED_AND_INVALID: 2,
    SIGNED_NO_PUB_KEY: 3
};
export const TIME = {
    MILLISECOND: 1,
    SECOND: 1000,
    MINUTE: 60000,
    HOUR: 3600000,
    DAY: 3600000 * 24
};
export const KNOWLEDGE_BASE = {
    DIGITAL_SIGNATURE: 'https://protonmail.com/support/knowledge-base/digital-signature/',
    PGP_MIME_INLINE: 'https://protonmail.com/support/knowledge-base/pgp-mime-pgp-inline/',
    STORAGE_WARNING: 'https://protonmail.com/support/knowledge-base/storage-limit-reached/'
};
export const PM_SIGNATURE = 'Sent with <a href="https://protonmail.com" target="_blank">ProtonMail</a> Secure Email.';

export const ENCRYPTED_STATUS = {
    PGP_MIME: 8 // Used for attachment
};

export const SEND_TYPES = {
    SEND_PM: 1,
    SEND_EO: 2,
    SEND_CLEAR: 4,
    SEND_PGP_INLINE: 8,
    SEND_PGP_MIME: 16,
    SEND_MIME: 32
};

export const MIME_TYPES = {
    MIME: 'multipart/mixed',
    PLAINTEXT: 'text/plain',
    DEFAULT: 'text/html'
};

export const DEFAULT_SQUIRE_VALUE = {
    LINK: '',
    IMAGE: '',
    HEADER_CLASS: 'h4',
    IFRAME_CLASS: 'angular-squire-iframe'
};

export const LINK_TYPES = {
    WEB: 'web',
    EMAIL: 'email',
    PHONE: 'phone'
};

export const EMAIL_FORMATING = {
    OPEN_TAG_AUTOCOMPLETE: '‹',
    CLOSE_TAG_AUTOCOMPLETE: '›',
    OPEN_TAG_AUTOCOMPLETE_RAW: '<',
    CLOSE_TAG_AUTOCOMPLETE_RAW: '>'
};

export const AUTOCOMPLETE_DOMAINS = [
    'protonmail.com',
    'protonmail.ch',
    'gmail.com',
    'hotmail.com',
    'live.com',
    'yahoo.com',
    'outlook.com'
];

export const ADDRESS_TYPE = {
    ORIGINAL: 1,
    ALIAS: 2,
    CUSTOM_DOMAIN: 3,
    PREMIUM: 4
};
export const SENDPREF_STATUS = {
    ENCRYPTION_ENABLED: 1,
    SIGNING_ENABLED: 2,
    PINNING_ENABLED: 4,
    PGP_MIME: 8,
    PGP_INLINE: 16,
    PM_EO: 32,
    LOADING_CRYPT_INFO: 64
};

export const KEY_FLAGS = {
    DISABLED: 0,
    ENABLE_VERIFICATION: 1,
    ENABLE_ENCRYPTION: 2
};

export const KEY_FILE_EXTENSION = '.asc';

/* eslint  no-useless-escape: "off" */
export const REGEX_EMAIL = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/i;

// REGEX_URL from http://urlregex.com
export const REGEX_URL = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

export const STORAGE_WARNING = {
    KEY: 'storage_warning',
    VALUE: 'seen',
    WARNING_LIMIT: 90,
    REACHED_LIMIT: 99.99
};

export const VERSION_INFO = {
    INTERVAL: 30 * TIME.MINUTE
};

export const SIGNUP_PLANS = ['plus', 'visionary', 'plus_vpnplus'];

const BLACK_FRIDAY_YEAR = 2018;

export const BUNDLE_COUPON_CODE = 'BUNDLE';

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

export const CYBER_MONDAY = {
    BETWEEN: {
        START: `${BLACK_FRIDAY_YEAR}-11-26`,
        END: `${BLACK_FRIDAY_YEAR}-12-01`
    }
};

export const BLOCKQUOTE_SELECTORS = [
    '.protonmail_quote',
    '.gmail_quote',
    '.yahoo_quoted',
    '.gmail_extra',
    '.moz-cite-prefix',
    // '.WordSection1',
    '#isForwardContent',
    '#isReplyContent',
    '#mailcontent:not(table)',
    '#origbody',
    '#reply139content',
    '#oriMsgHtmlSeperator',
    'blockquote[type="cite"]'
];

export const LABEL_TYPE = {
    MESSAGE: 1,
    CONTACT_GROUP: 2
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

export const SRP_MODULUS_KEY = `
-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEXAHLgxYJKwYBBAHaRw8BAQdAFurWXXwjTemqjD7CXjXVyKf0of7n9Ctm
L8v9enkzggHNEnByb3RvbkBzcnAubW9kdWx1c8J3BBAWCgApBQJcAcuDBgsJ
BwgDAgkQNQWFxOlRjyYEFQgKAgMWAgECGQECGwMCHgEAAPGRAP9sauJsW12U
MnTQUZpsbJb53d0Wv55mZIIiJL2XulpWPQD/V6NglBd96lZKBmInSXX/kXat
Sv+y0io+LR8i2+jV+AbOOARcAcuDEgorBgEEAZdVAQUBAQdAeJHUz1c9+KfE
kSIgcBRE3WuXC4oj5a2/U3oASExGDW4DAQgHwmEEGBYIABMFAlwBy4MJEDUF
hcTpUY8mAhsMAAD/XQD8DxNI6E78meodQI+wLsrKLeHn32iLvUqJbVDhfWSU
WO4BAMcm1u02t4VKw++ttECPt+HUgPUq5pqQWe5Q2cW4TMsE
=Y4Mw
-----END PGP PUBLIC KEY BLOCK-----
`;
