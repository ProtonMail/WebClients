export const ERROR_AUTH_ACCOUNT_DISABLED = 10003;
export const ERROR_SILENT = 'ignoreError';
export const WIZARD_ENABLED = true;
export const FREE_USER_ROLE = 0;
export const PAID_MEMBER_ROLE = 1;
export const PAID_ADMIN_ROLE = 2;
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
export const CONVERSATION_REQUEST_SIZE = 10;
export const GIFT_CODE_LENGTH = 16;

export const CONSTANTS = {
    CLIENT_TYPE: 1,
    BLACK_FRIDAY_INTERVAL: 10 * 60 * 1000,
    REMOTE: 1,
    EMBEDDED: 2,
    PLANS: {
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
    },
    PLANS_TYPE: {
        PLAN: 1,
        ADDON: 0
    },
    CONTACTS_LIMIT_ENCRYPTION: 20,
    CONTACTS_LIMIT_UPLOAD: 50,
    VCARD_VERSION: '4.0',
    VCARD_KEYS: [
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
    ],
    VCARD_TYPES: [
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
    ],
    CONTACT_MODE: {
        ENCRYPTED_AND_SIGNED: 3,
        SIGNED: 2,
        ENCRYPTED: 1,
        CLEAR_TEXT: 0
    },
    CONTACT_ERROR: {
        TYPE3_CONTACT_VERIFICATION: 3,
        TYPE3_CONTACT_DECRYPTION: 2,
        TYPE2_CONTACT_VERIFICATION: 1,
        TYPE1_CONTACT: 0
    },
    CONTACT_EMAILS_LIMIT: 1000,
    CONTACTS_LIMIT: 1000,
    EXPORT_CONTACTS_LIMIT: 50,
    MAX_VPN: 100,
    MAX_MEMBER: 100,
    HUGE_MEMBER: 5000,
    AWESOMEPLETE_MAX_ITEMS: 20,
    MAIN_KEY: '0',
    TIMEOUT: 30 * 1000, // timeout in milliseconds
    BASE_SIZE: 1024, // define the base used for byte
    PM_SIGNATURE: 'Sent with <a href="https://protonmail.com" target="_blank">ProtonMail</a> Secure Email.',
    KEY_PHASE: 5,
    KEY_VERSION: 3,
    MAX_OUTSIDE_REPLY: 4,
    MAILBOX_PASSWORD_KEY: 'proton:mailbox_pwd',
    OAUTH_KEY: 'proton:oauth',
    WHITELIST: ['notify@protonmail.com'],
    ADDRESS_TYPE: {
        ORIGINAL: 1,
        ALIAS: 2,
        CUSTOM_DOMAIN: 3,
        PREMIUM: 4
    },
    INVITE_MAIL: 1,
    INVITE_VPN: 2,
    INBOX: 0,
    DRAFT: 1,
    SENT: 2,
    INBOX_AND_SENT: 3,
    PM_ADDRESS: 1,
    PM_ALIAS: 2,
    CUSTOM_DOMAIN_ADDRESS: 3,
    REPLY: 0,
    REPLY_ALL: 1,
    FORWARD: 2,
    FILTER_VERSION: 1,
    ROW_MODE: 1,
    COLUMN_MODE: 0,
    ATTACHMENT_SIZE_LIMIT: 25, // MB
    ATTACHMENT_NUMBER_LIMIT: 100,
    MAX_TITLE_LENGTH: 255,
    MAX_NUMBER_COMPOSER: 3,
    MESSAGE_VIEW_MODE: 1,
    CONVERSATION_VIEW_MODE: 0,
    MESSAGE_LIMIT: 100,
    CONVERSATION_LIMIT: 100,
    ENCRYPTED_STATUS: {
        NONE: 0,
        INTERNAL: 1,
        EXTERNAL: 2,
        OUT_ENC: 3,
        OUT_PLAIN: 4,
        STORED_ENC: 5,
        AUTOREPLY: 10
    },
    INTERVAL_EVENT_TIMER: 30 * 1000, // time between querying the event log (every 30 seconds)
    TIMEOUT_PRELOAD_MESSAGE: 500, // milliseconds
    UPLOAD_GRADIENT_DARK: '147, 145, 209', // dark rgb color for upload progress bar
    UPLOAD_GRADIENT_LIGHT: '255, 255, 255', // light rgb color for upload progress bar
    ENC_OUT_ENC_REPLY: 6, // encrypted for outside
    SAVE_TIMEOUT_TIME: 3000, // 3 seconds
    SAVE_THROTTLE_TIME: 10000, // 10 seconds
    MAX_EXPIRATION_TIME: 672, // hours
    ELEMENTS_PER_PAGE: 50,
    CONTACTS_PER_PAGE: 1000,
    HD_BREAKPOINT: 1920,
    DESKTOP_BREAKPOINT: 1200,
    ROW_BREAKPOINT: 960,
    MOBILE_BREAKPOINT: 800,
    EMAIL_FORMATING: {
        OPEN_TAG_AUTOCOMPLETE: '‹',
        CLOSE_TAG_AUTOCOMPLETE: '›',
        OPEN_TAG_AUTOCOMPLETE_RAW: '<',
        CLOSE_TAG_AUTOCOMPLETE_RAW: '>'
    },
    STATUS: {
        DELETE: 0,
        CREATE: 1,
        UPDATE: 2,
        UPDATE_DRAFT: 2,
        UPDATE_FLAGS: 3
    },
    DEFAULT_SQUIRE_VALUE: {
        LINK: '',
        IMAGE: '',
        HEADER_CLASS: 'h4',
        IFRAMECLASSNAME: 'angular-squire-iframe'
    },
    URL_INFO: 'https://mail.protonmail.com/assets/host.png',
    MIN_PAYPAL_AMOUNT: 500,
    MAX_PAYPAL_AMOUNT: 99999900,
    MIN_BITCOIN_AMOUNT: 500,
    BTC_DONATION_ADDRESS: '1Q1nhq1NbxPYAbw1BppwKbCqg58ZqMb9A8',
    CURRENCIES: ['USD', 'EUR', 'CHF'],
    BILLING_CYCLE: [1, 12, 24],
    CYCLE: {
        MONTHLY: 1,
        YEARLY: 12,
        TWO_YEARS: 24
    },
    IFRAME_SECURE_ORIGIN: 'https://secure.protonmail.com',
    INVITE_URL: 'https://protonmail.com/invite',
    DEFAULT_CURRENCY: 'EUR',
    CHANGELOG_PATH: 'assets/changelog.tpl.html',
    DEFAULT_CYCLE: 12,
    TRACKER_ROUTE: 'proton.php',
    PIWIK_SCRIPT: 'proton.js',
    METRIC_GOALS: {
        SIGNUP_ALL: 2,
        SIGNUP_FREE: 4,
        SIGNUP_PAID: 3,
        SIGNUP_PLUS: 6,
        SIGNUP_VISIONARY: 5
    },
    SEND_TYPES: {
        SEND_PM: 1,
        SEND_EO: 2,
        SEND_CLEAR: 4,
        SEND_PGP_INLINE: 8,
        SEND_PGP_MIME: 16,
        SEND_MIME: 32
    },
    AUTOCOMPLETE_DOMAINS: ['protonmail.com', 'protonmail.ch', 'gmail.com', 'hotmail.com', 'live.com', 'yahoo.com', 'outlook.com'],
    FONT_SIZE: {
        small: 8,
        normal: 14,
        large: 20,
        huge: 26
    },
    COMPOSER_COLOR: {
        COLOR: '#222222',
        BACKGROUND: '#FFFFFF'
    },
    FONT_COLOR: {
        white: ['#FFFFFF', '#DADADA', '#B5B5B5', '#909090', '#6B6B6B', '#464646', '#222222'],
        magenta: ['#F6CBCB', '#EC9798', '#E36667', '#ED4139', '#CF3932', '#9A2B25', '#681D19'],
        blue: ['#CDE1F2', '#9CC3E5', '#6CA6D9', '#3B83C2', '#2A47F6', '#145390', '#0F3A62'],
        green: ['#D7EAD3', '#B3D6A9', '#8FC380', '#77F241', '#66A657', '#3A762B', '#29501F'],
        yellow: ['#FFF2CD', '#FEE59C', '#FCD86F', '#FDF84E', '#F2C246', '#BE8F35', '#7F6124']
    },
    CANCEL_REQUEST: 'CANCEL_REQUEST',
    ENCRYPTION_DEFAULT: 2048,
    ERROR_SILENT,
    FREE_USER_ROLE,
    PAID_MEMBER_ROLE,
    PAID_ADMIN_ROLE,
    UNPAID_STATE,
    WIZARD_ENABLED,
    MAILBOX_IDENTIFIERS
};

/* eslint  no-useless-escape: "off" */
export const REGEX_EMAIL = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/i;

export default angular
    .module('proton.constants', [])
    .constant(
        'regexEmail', REGEX_EMAIL
    )
    .constant('CONSTANTS', CONSTANTS).name;
