import type { enums } from '@proton/crypto';

import { EncryptionConfig } from './interfaces';

export const DEFAULT_TIMEOUT = 30000; // default fetch timeout
export const RETRY_DELAY_MAX = 10; // seconds
export const RETRY_ATTEMPTS_MAX = 5; // how many times to try the same request
export const OFFLINE_RETRY_DELAY = 2000; // how much time in ms to wait before retrying an offline request
export const OFFLINE_RETRY_ATTEMPTS_MAX = 0; // how many times to try the same request when offline
export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 4 * WEEK;
export const YEAR = 12 * MONTH;
export const MINUTE_IN_SECONDS = 60;
export const HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS;
export const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS;

// Max quantity for all addons
export const MAX_VPN_ADDON = 2000;
export const MAX_MEMBER_ADDON = 5000;
export const MAX_DOMAIN_PRO_ADDON = 99;
export const MAX_DOMAIN_PLUS_ADDON = 10;
export const MAX_ADDRESS_ADDON = 10;
export const MAX_SPACE_ADDON = 20;
// VPN B2B limits
export const MAX_MEMBER_VPN_B2B_ADDON = 5000;
export const MAX_IPS_ADDON = 100;

export const DOMAIN_PLACEHOLDER = 'example.com';
export const EMAIL_PLACEHOLDER = 'john.doe@example.com';
export const USERNAME_PLACEHOLDER = 'john.doe';
export const NAME_PLACEHOLDER = 'Thomas A. Anderson';

export const BRAND_NAME = 'Proton';
export const MAIL_SHORT_APP_NAME = 'Mail';
export const MAIL_APP_NAME = `${BRAND_NAME} ${MAIL_SHORT_APP_NAME}`;
export const CONTACTS_SHORT_APP_NAME = 'Contacts';
export const CONTACTS_APP_NAME = `${BRAND_NAME} ${CONTACTS_SHORT_APP_NAME}`;
export const CALENDAR_SHORT_APP_NAME = 'Calendar';
export const CALENDAR_APP_NAME = `${BRAND_NAME} ${CALENDAR_SHORT_APP_NAME}`;
export const DRIVE_SHORT_APP_NAME = 'Drive';
export const DRIVE_APP_NAME = `${BRAND_NAME} ${DRIVE_SHORT_APP_NAME}`;
export const PASS_SHORT_APP_NAME = 'Pass';
export const PASS_APP_NAME = `${BRAND_NAME} ${PASS_SHORT_APP_NAME}`;
export const VPN_SHORT_APP_NAME = 'VPN';
export const VPN_APP_NAME = `${BRAND_NAME} ${VPN_SHORT_APP_NAME}`;
export const VERIFY_APP_NAME = 'Proton Verify';
export const REFERRER_CODE_MAIL_TRIAL = 'MAILPLUSTRIAL';
export const PROTON_SENTINEL_NAME = 'Proton Sentinel';

export const APPS = {
    PROTONACCOUNT: 'proton-account',
    PROTONACCOUNTLITE: 'proton-account-lite',
    PROTONVPNBROWSEREXTENSION: 'proton-vpn-browser-extension',
    PROTONMAIL: 'proton-mail',
    PROTONCONTACTS: 'proton-contacts',
    PROTONDRIVE: 'proton-drive',
    PROTONCALENDAR: 'proton-calendar',
    PROTONPASS: 'proton-pass',
    PROTONVPN_SETTINGS: 'proton-vpn-settings',
    PROTONADMIN: 'proton-admin',
    PROTONVERIFICATION: 'proton-verify',
    PROTONEXTENSION: 'proton-extension',
    PROTONPASSBROWSEREXTENSION: 'proton-pass-extension',
} as const;

interface AppConfiguration {
    publicPath: string;
    subdomain: string;
    name: string;
    bareName: string;
    clientID?: string;
    webClientID?: string;
    windowsClientID?: string;
    macosClientID?: string;
    icon: string;
    settingsSlug: string;
}

export const APPS_CONFIGURATION: { [key in APP_NAMES]: AppConfiguration } = {
    [APPS.PROTONACCOUNT]: {
        publicPath: '',
        subdomain: 'account',
        name: 'Proton Account',
        bareName: 'Account',
        webClientID: 'web-account',
        windowsClientID: 'windows-mail',
        macosClientID: 'macos-mail',
        icon: 'brand-proton',
        settingsSlug: 'account',
    },
    [APPS.PROTONACCOUNTLITE]: {
        publicPath: '',
        subdomain: 'account',
        name: 'Proton Account',
        bareName: 'Account',
        webClientID: 'web-account-lite',
        windowsClientID: 'windows-mail',
        macosClientID: 'macos-mail',
        icon: 'brand-proton',
        settingsSlug: 'account',
    },
    [APPS.PROTONVPNBROWSEREXTENSION]: {
        publicPath: '',
        subdomain: '',
        name: 'Proton VPN Browser Extension',
        bareName: 'Browser VPN Extension',
        webClientID: 'browser-vpn',
        icon: 'brand-proton-vpn',
        settingsSlug: '',
    },
    [APPS.PROTONMAIL]: {
        publicPath: '',
        subdomain: 'mail',
        name: MAIL_APP_NAME,
        bareName: MAIL_SHORT_APP_NAME,
        webClientID: 'web-mail',
        windowsClientID: 'windows-mail',
        macosClientID: 'macos-mail',
        icon: 'brand-proton-mail',
        settingsSlug: 'mail',
    },
    [APPS.PROTONCONTACTS]: {
        publicPath: '/contacts',
        subdomain: 'contacts',
        name: 'ProtonContacts',
        bareName: 'Contacts',
        webClientID: 'web-contacts',
        icon: 'brand-proton',
        settingsSlug: 'contacts',
    },
    [APPS.PROTONDRIVE]: {
        publicPath: '/drive',
        subdomain: 'drive',
        name: DRIVE_APP_NAME,
        bareName: DRIVE_SHORT_APP_NAME,
        webClientID: 'web-drive',
        icon: 'brand-proton-drive',
        settingsSlug: 'drive',
    },
    [APPS.PROTONCALENDAR]: {
        publicPath: '/calendar',
        subdomain: 'calendar',
        name: CALENDAR_APP_NAME,
        bareName: CALENDAR_SHORT_APP_NAME,
        webClientID: 'web-calendar',
        windowsClientID: 'windows-mail',
        macosClientID: 'macos-mail',
        icon: 'brand-proton-calendar',
        settingsSlug: 'calendar',
    },
    [APPS.PROTONPASS]: {
        publicPath: '/pass',
        subdomain: 'pass',
        name: PASS_APP_NAME,
        bareName: PASS_SHORT_APP_NAME,
        webClientID: 'web-pass',
        icon: 'brand-proton-pass',
        settingsSlug: 'pass',
    },
    [APPS.PROTONEXTENSION]: {
        publicPath: '',
        subdomain: '',
        name: PASS_APP_NAME,
        bareName: PASS_SHORT_APP_NAME,
        clientID: 'browser-pass',
        icon: '',
        settingsSlug: '',
    },
    [APPS.PROTONPASSBROWSEREXTENSION]: {
        publicPath: '',
        subdomain: '',
        name: PASS_APP_NAME,
        bareName: PASS_SHORT_APP_NAME,
        clientID: 'browser-pass',
        icon: '',
        settingsSlug: '',
    },
    [APPS.PROTONVPN_SETTINGS]: {
        publicPath: '',
        subdomain: '',
        name: VPN_APP_NAME,
        bareName: VPN_SHORT_APP_NAME,
        webClientID: 'web-vpn-settings',
        icon: 'brand-proton-vpn',
        settingsSlug: 'vpn',
    },
    [APPS.PROTONADMIN]: {
        publicPath: '',
        subdomain: '',
        name: '',
        bareName: 'Admin',
        webClientID: 'web-admin',
        icon: 'brand-proton',
        settingsSlug: '',
    },
    [APPS.PROTONVERIFICATION]: {
        publicPath: '',
        subdomain: 'verify',
        name: VERIFY_APP_NAME,
        bareName: 'Verify',
        webClientID: 'web-verify',
        icon: 'brand-proton',
        settingsSlug: '',
    },
};

export enum PRODUCT_BIT {
    Mail = 1,
    Drive = 2,
    VPN = 4,
    PASS = 8,
}

export type APP_KEYS = keyof typeof APPS;
export type APP_NAMES = (typeof APPS)[APP_KEYS];
export type APP_CLIENT_IDS =
    | (typeof APPS_CONFIGURATION)[keyof typeof APPS_CONFIGURATION]['webClientID']
    | 'android_tv-vpn';
export const SSO_PATHS = {
    EXTERNAL_SSO_LOGIN: '/sso/login',
    OAUTH_AUTHORIZE: '/oauth/authorize',
    OAUTH_CONFIRM_FORK: '/oauth/confirm',
    AUTHORIZE: '/authorize',
    FORK: '/login',
    SWITCH: '/switch',
    LOGIN: '/login',
    RESET_PASSWORD: '/reset-password',
    FORGOT_USERNAME: '/forgot-username',
    MAIL_SIGNUP: '/mail/signup',
    MAIL_SIGN_IN: '/mail',
    CALENDAR_SIGNUP: '/calendar/signup',
    CALENDAR_SIGN_IN: '/calendar',
    DRIVE_SIGNUP: '/drive/signup',
    DRIVE_SIGN_IN: '/drive',
    BUSINESS_SIGNUP: '/business/signup',
    VPN_SIGNUP: '/vpn/signup',
    VPN_PRICING: '/vpn/pricing',
    VPN_SIGN_IN: '/vpn',
    PASS_SIGNUP: '/pass/signup',
    PASS_SIGN_IN: '/pass',
    SIGNUP: '/signup',
    INVITE: '/pre-invite',
    REFER: '/refer-a-friend',
    TRIAL: '/trial',
} as const;
export const SETUP_ADDRESS_PATH = '/setup-address';

export const VPN_HOSTNAME = 'account.protonvpn.com';

export enum HTTP_STATUS_CODE {
    OK = 200,
    BAD_REQUEST = 400,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    UNPROCESSABLE_ENTITY = 422,
    TOO_MANY_REQUESTS = 429,
    INTERNAL_SERVER_ERROR = 500,
}

export enum API_CODES {
    GLOBAL_SUCCESS = 1001,
    SINGLE_SUCCESS = 1000,
    NOT_ALLOWED_ERROR = 2011,
    INVALID_REQUIREMENT_ERROR = 2000,
    INVALID_LINK_TYPE_ERROR = 2001,
    ALREADY_EXISTS_ERROR = 2500,
    NOT_FOUND_ERROR = 2501,
    INVALID_ID_ERROR = 2061,
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

export const DEFAULT_CURRENCY = 'EUR';
export const CURRENCIES = ['EUR', 'USD', 'CHF'] as const;
export const MIN_DONATION_AMOUNT = 100;
export const MIN_CREDIT_AMOUNT = 500;
export const MAX_CREDIT_AMOUNT = 4000000;
export const MIN_BITCOIN_AMOUNT = MIN_CREDIT_AMOUNT;
export const MAX_BITCOIN_AMOUNT = MAX_CREDIT_AMOUNT;
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
    NOT_UNPAID = 0,
    AVAILABLE = 1,
    OVERDUE = 2,
    DELINQUENT = 3,
    NO_RECEIVE = 4,
}

export const BASE_SIZE = 1024;
export const GIGA = BASE_SIZE ** 3;

export enum MEMBER_TYPE {
    PROTON = 0,
    MANAGED = 1,
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

export enum ADDRESS_RECEIVE {
    RECEIVE_YES = 1,
    RECEIVE_NO = 0,
}

export enum ADDRESS_SEND {
    SEND_YES = 1,
    SEND_NO = 0,
}

export enum ADDRESS_FLAGS {
    FLAG_DISABLE_E2EE = 16,
    FLAG_DISABLE_EXPECTED_SIGNED = 32,
}

export enum MEMBER_PERMISSIONS {
    MANAGE_FORWARDING = 1,
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
    PGP_KEYS = 'application/pgp-keys',
}

export enum MIME_TYPES_MORE {
    AUTOMATIC = '',
}

export type CONTACT_MIME_TYPES = MIME_TYPES.PLAINTEXT | MIME_TYPES.DEFAULT | MIME_TYPES_MORE.AUTOMATIC;

export enum RECIPIENT_TYPES {
    TYPE_INTERNAL = 1,
    TYPE_EXTERNAL = 2,
}

/**
 * Returned by legacy GET /keys endpoint
 */
export enum IGNORE_KT {
    VALID = 0,
    EXTERNAL_ADDRESS = 1,
    CATCH_ALL = 2,
}

export enum DRAFT_TYPE {
    NORMAL = 'text/html',
    PLAIN_TEXT = 'text/plain',
}

export enum ORGANIZATION_FLAGS {
    LOYAL = 1,
    COVID = 2,
    SMTP_SUBMISSION = 4,
    NO_CYCLE_SCHEDULED = 8,
    DISSIDENT = 64,
    PROTON = 128,
}

export enum ORGANIZATION_TWOFA_SETTING {
    NOT_REQUIRED = 0,
    REQUIRED_ADMIN_ONLY = 1,
    REQUIRED_ALL = 2,
}

export enum APP_UPSELL_REF_PATH {
    MAIL_UPSELL_REF_PATH = 'upsell_mail-',
    CALENDAR_UPSELL_REF_PATH = 'upsell_calendar-',
    DRIVE_UPSELL_REF_PATH = 'upsell_drive-',
    PASS_UPSELL_REF_PATH = 'upsell_pass-',
    VPN_UPSELL_REF_PATH = 'upsell_vpn-',
}

export enum UPSELL_COMPONENT {
    BANNER = 'banner-',
    MODAL = 'modal-',
    BUTTON = 'button-',
}

export enum MAIL_UPSELL_PATHS {
    AUTO_REPLY = 'auto-reply',
    DOMAIN_NAMES = 'domain-names',
    CATCH_ALL = 'catch-all',
    BRIDGE = 'bridge',
    PM_ME = 'pm-me',
    SHORT_ADDRESS = 'short-address',
    AUTO_DELETE = 'auto-delete',
    SCHEDULE_SEND = 'schedule-send',
    STORAGE_FULL = 'storage-full',
    GET_STARTED_CHECKLIST = 'get-started-checklist',
    MAIL_FOOTER = 'mail-footer',
    UNLIMITED_FOLDERS = 'unlimited-folders',
    UNLIMITED_LABELS = 'unlimited-labels',
    UNLIMITED_FILTERS = 'unlimited-filters',
    UNLIMITED_ADDRESSES = 'unlimited-addresses',
    FORWARD_EMAILS = 'forward-emails',
    SMTP_SUBMISSION = 'smtp-submission',
    SNOOZE_MESSAGE = 'snooze-message',
}

export enum CALENDAR_UPSELL_PATHS {
    MULTI_CAL = 'multi-cal',
    SHARE_CAL = 'share-cal',
    MAX_CAL = 'max-cal',
}

export enum DRIVE_UPSELL_PATHS {
    SIDEBAR = 'sidebar',
}

export enum SHARED_UPSELL_PATHS {
    MULTI_USER = 'multi-user',
    CONTACT_GROUP = 'contact-groups',
    STORAGE = 'storage',
    STORAGE_PERCENTAGE = 'storage-percentage',
    ORGANIZATION_CAPACITY = 'organization-capacity',
    SENTINEL = 'sentinel',
}

export enum DASHBOARD_UPSELL_PATHS {
    MAILPLUS = 'mailplus-dashboard',
    UNLIMITED = 'unlimited-dashboard',
    DRIVE = 'drive-dashboard',
    PASS = 'pass-dashboard',
    VPN = 'vpn-dashboard',
    FAMILY = 'family-dashboard',
    BUSINESS = 'business-dashboard',
}

export const LOYAL_BONUS_STORAGE = 5 * GIGA;
export const LOYAL_BONUS_CONNECTION = 2;

export const COVID_PLUS_BONUS_STORAGE = 5 * GIGA;
export const COVID_PROFESSIONAL_BONUS_STORAGE = 5 * GIGA;
export const COVID_VISIONARY_BONUS_STORAGE = 10 * GIGA;

export const FREE_VPN_CONNECTIONS = 1;
export const VPN_CONNECTIONS = 10;

export enum CYCLE {
    MONTHLY = 1,
    YEARLY = 12,
    TWO_YEARS = 24,
    THIRTY = 30,
    FIFTEEN = 15,
}

export const DEFAULT_CYCLE = CYCLE.TWO_YEARS;

export const BLACK_FRIDAY = {
    COUPON_CODE: 'BF2022',
    START: new Date(Date.UTC(2021, 10, 1, 5)), // 6 AM CET
    END: new Date(Date.UTC(2022, 0, 1, 17)), // 6 PM CET
    CYBER_START: new Date(Date.UTC(2020, 10, 30, 6)),
    CYBER_END: new Date(Date.UTC(2020, 11, 1, 6)),
};

export const PRODUCT_PAYER = {
    START: new Date(Date.UTC(2020, 9, 28, 6)),
    END: new Date(Date.UTC(2020, 11, 15, 6)),
};

export const MIN_PAYPAL_AMOUNT = 499;
export const MAX_PAYPAL_AMOUNT = 99999900;

export enum NEWSLETTER_SUBSCRIPTIONS {
    ANNOUNCEMENTS = 'Announcements',
    /** not displayed anymore, turning on one product news should turn it on as well */
    FEATURES = 'Features',
    NEWSLETTER = 'Newsletter',
    BETA = 'Beta',
    BUSINESS = 'Business',
    OFFERS = 'Offers',
    /** used in `Messages & Composing` */
    NEW_EMAIL_NOTIF = 'NewEmailNotif',
    ONBOARDING = 'Onboarding',
    USER_SURVEY = 'UserSurveys',
    INBOX_NEWS = 'InboxNews',
    VPN_NEWS = 'VpnNews',
    DRIVE_NEWS = 'DriveNews',
    PASS_NEWS = 'PassNews',
}

export enum NEWSLETTER_SUBSCRIPTIONS_BITS {
    ANNOUNCEMENTS = 1 << 0,
    FEATURES = 1 << 1,
    NEWSLETTER = 1 << 2,
    BETA = 1 << 3,
    BUSINESS = 1 << 4,
    OFFERS = 1 << 5,
    /** used in `Messages & Composing` */
    NEW_EMAIL_NOTIF = 1 << 6,
    ONBOARDING = 1 << 7,
    USER_SURVEY = 1 << 8,
    INBOX_NEWS = 1 << 9,
    VPN_NEWS = 1 << 10,
    DRIVE_NEWS = 1 << 11,
    PASS_NEWS = 1 << 12,
}

export const NEWSLETTER_SUBSCRIPTIONS_BY_BITS: Record<NEWSLETTER_SUBSCRIPTIONS_BITS, NEWSLETTER_SUBSCRIPTIONS> = {
    [NEWSLETTER_SUBSCRIPTIONS_BITS.ANNOUNCEMENTS]: NEWSLETTER_SUBSCRIPTIONS.ANNOUNCEMENTS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.FEATURES]: NEWSLETTER_SUBSCRIPTIONS.FEATURES,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.NEWSLETTER]: NEWSLETTER_SUBSCRIPTIONS.NEWSLETTER,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.BETA]: NEWSLETTER_SUBSCRIPTIONS.BETA,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.BUSINESS]: NEWSLETTER_SUBSCRIPTIONS.BUSINESS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.OFFERS]: NEWSLETTER_SUBSCRIPTIONS.OFFERS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.NEW_EMAIL_NOTIF]: NEWSLETTER_SUBSCRIPTIONS.NEW_EMAIL_NOTIF,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.ONBOARDING]: NEWSLETTER_SUBSCRIPTIONS.ONBOARDING,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.USER_SURVEY]: NEWSLETTER_SUBSCRIPTIONS.USER_SURVEY,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.INBOX_NEWS]: NEWSLETTER_SUBSCRIPTIONS.INBOX_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.VPN_NEWS]: NEWSLETTER_SUBSCRIPTIONS.VPN_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.DRIVE_NEWS]: NEWSLETTER_SUBSCRIPTIONS.DRIVE_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.PASS_NEWS]: NEWSLETTER_SUBSCRIPTIONS.PASS_NEWS,
};

export const CONTACT_EMAILS_LIMIT = 1000;
export const CONTACTS_LIMIT = 1000;
export const EXPORT_CONTACTS_LIMIT = 50; // Maximum page size for export is 50 from API
export const CONTACTS_REQUESTS_PER_SECOND = 10;
export const ALL_MEMBERS_ID = -100;

export enum LABEL_EXCLUSIVE {
    FOLDER = 1,
    LABEL = 0,
}

export const REGEX_IMAGE_EXTENSION = /\.(gif|jpe?g|tiff|png)$/i;

export const DARK_MODE_CLASS = 'isDarkMode';

export enum LINK_WARNING {
    KEY = 'link_warning',
    VALUE = 'dontAsk',
}

export const MEMBER_ADDON_PREFIX = '1member';
export const DOMAIN_ADDON_PREFIX = '1domain';
export const IP_ADDON_PREFIX = '1ip';

export enum ADDON_NAMES {
    ADDRESS = '5address',
    MEMBER = '1member',
    DOMAIN = '1domain',
    SPACE = '1gb',
    VPN = '1vpn',
    MEMBER_DRIVE_PRO = `${MEMBER_ADDON_PREFIX}-drivepro2022`,
    MEMBER_MAIL_PRO = `${MEMBER_ADDON_PREFIX}-mailpro2022`,
    MEMBER_BUNDLE_PRO = `${MEMBER_ADDON_PREFIX}-bundlepro2022`,
    DOMAIN_BUNDLE_PRO = `${DOMAIN_ADDON_PREFIX}-bundlepro2022`,
    MEMBER_ENTERPRISE = `${MEMBER_ADDON_PREFIX}-enterprise2022`,
    DOMAIN_ENTERPRISE = `${DOMAIN_ADDON_PREFIX}-enterprise2022`,
    MEMBER_VPN_PRO = `${MEMBER_ADDON_PREFIX}-vpnpro2023`,
    MEMBER_VPN_BUSINESS = `${MEMBER_ADDON_PREFIX}-vpnbiz2023`,
    IP_VPN_BUSINESS = `${IP_ADDON_PREFIX}-vpnbiz2023`,
}

export enum PLAN_TYPES {
    PLAN = 1,
    ADDON = 0,
}

export enum PLAN_SERVICES {
    MAIL = 1,
    DRIVE = 2,
    VPN = 4,
    PASS = 8,
}

// You don't need more, use `user.isPaid`
export const FREE_SUBSCRIPTION = {
    isFreeSubscription: true,
};

export type FreeSubscription = typeof FREE_SUBSCRIPTION;

export function isFreeSubscription(obj: any): obj is FreeSubscription {
    return !!obj && obj.isFreeSubscription && Object.keys(obj).length === 1;
}

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
    PASS_PLUS = 'pass2023',
    MAIL = 'mail2022',
    MAIL_PRO = 'mailpro2022',
    VPN = 'vpn2022',
    BUNDLE = 'bundle2022',
    BUNDLE_PRO = 'bundlepro2022',
    ENTERPRISE = 'enterprise2022',
    FAMILY = 'family2022',
    NEW_VISIONARY = 'visionary2022',
    VPN_PRO = 'vpnpro2023',
    VPN_BUSINESS = 'vpnbiz2023',
    VPN_PASS_BUNDLE = 'vpnpass2023',
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
    [PLANS.PASS_PLUS]: 'Pass Plus',
    [PLANS.MAIL]: 'Mail Plus',
    [PLANS.MAIL_PRO]: 'Mail Essentials',
    [PLANS.VPN]: 'VPN Plus',
    [PLANS.BUNDLE]: 'Proton Unlimited',
    [PLANS.BUNDLE_PRO]: 'Business',
    [PLANS.ENTERPRISE]: 'Enterprise',
    [PLANS.FAMILY]: 'Proton Family',
    [PLANS.NEW_VISIONARY]: 'Visionary',
    [PLANS.VPN_PRO]: 'VPN Essentials',
    [PLANS.VPN_BUSINESS]: 'VPN Business',
    [PLANS.VPN_PASS_BUNDLE]: 'VPN and Pass bundle',
};

export const MEMBER_PLAN_MAPPING = {
    [ADDON_NAMES.MEMBER_BUNDLE_PRO]: PLANS.BUNDLE_PRO,
    [ADDON_NAMES.MEMBER_MAIL_PRO]: PLANS.MAIL_PRO,
    [ADDON_NAMES.MEMBER_DRIVE_PRO]: PLANS.DRIVE_PRO,
    [ADDON_NAMES.MEMBER_ENTERPRISE]: PLANS.ENTERPRISE,
    [ADDON_NAMES.MEMBER_VPN_PRO]: PLANS.VPN_PRO,
    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: PLANS.VPN_BUSINESS,
};

export enum COUPON_CODES {
    BUNDLE = 'BUNDLE',
    PROTONTEAM = 'PROTONTEAM',
    BLACK_FRIDAY_2018 = 'TWO4ONE2018',
    BLACK_FRIDAY_2019 = 'BF2019',
    BLACK_FRIDAY_2020 = 'BF2020',
    BLACK_FRIDAY_2022 = 'BF2022',
    BLACK_FRIDAY_2023 = 'BF2023',
    MAIL_BLACK_FRIDAY_2022 = 'MAILBF2022',
    VPN_BLACK_FRIDAY_2022 = 'VPNBF2022',
    LIFETIME = 'LIFETIME',
    VISIONARYFOREVER = 'VISIONARYFOREVER',
    REFERRAL = 'REFERRAL',
    ANNIVERSARY23 = 'ANNIVERSARY23',
}

export const GIFT_CODE_LENGTH = 16;

export const KEY_EXTENSION = 'asc';
export const KEY_FILE_EXTENSION = `.${KEY_EXTENSION}`;

export enum ENCRYPTION_TYPES {
    CURVE25519 = 'CURVE25519',
    RSA4096 = 'RSA4096',
}

export const DEFAULT_ENCRYPTION_CONFIG = ENCRYPTION_TYPES.CURVE25519;

export const ENCRYPTION_CONFIGS: { [key: string]: EncryptionConfig } = {
    [ENCRYPTION_TYPES.CURVE25519]: {
        type: 'ecc',
        curve: 'ed25519' as enums.curve,
    }, // casting is just informational
    [ENCRYPTION_TYPES.RSA4096]: { type: 'rsa', rsaBits: 4096 },
};

export enum KEY_FLAG {
    FLAG_EMAIL_NO_SIGN = 8,
    /**
     * Key can't be used to encrypt email. There are multiple scenarios where this can happen
     * - the key is associated to a product without Mail, like Drive or VPN
     * - the key is associated to an external address
     * - the key is associated to an internal address e2e encryption disabled (e.g. because of forwarding)
     */
    FLAG_EMAIL_NO_ENCRYPT = 4,
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
    INBOX = Number(MAILBOX_IDENTIFIERS.inbox),
    SPAM = Number(MAILBOX_IDENTIFIERS.spam),
    BLOCKED = 14,
}

/* eslint  no-useless-escape: "off" */
export const REGEX_EMAIL =
    /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/i;

export enum FILTER_STATUS {
    ENABLED = 1,
    DISABLED = 0,
}

export const FREE_USER_ACTIVE_FILTERS_LIMIT = 1;
export const FREE_USER_FOLDERS_LIMIT = 3;
export const FREE_USER_LABELS_LIMIT = 3;

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
    SYSTEM_FOLDER = 4,
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
    RESTRICTED = 32,
    PARTNER = 64,
    DOUBLE_RESTRICTION = 128,
}

export enum CLIENT_TYPES {
    MAIL = 1,
    VPN = 2,
    PASS = 5,
}

export enum TOKEN_TYPES {
    EMAIL = 'email',
    SMS = 'sms',
    INVITE = 'invite',
    COUPON = 'coupon',
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
    ALMOST_ALL_MAIL = '15',
    SNOOZED = '16',
}

export const LINKED_LABEL_IDS: {
    [key in MAILBOX_LABEL_IDS]?: MAILBOX_LABEL_IDS;
} = {
    [MAILBOX_LABEL_IDS.ALL_DRAFTS]: MAILBOX_LABEL_IDS.DRAFTS,
    [MAILBOX_LABEL_IDS.ALL_SENT]: MAILBOX_LABEL_IDS.SENT,
    [MAILBOX_LABEL_IDS.ALL_MAIL]: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
    [MAILBOX_LABEL_IDS.DRAFTS]: MAILBOX_LABEL_IDS.ALL_DRAFTS,
    [MAILBOX_LABEL_IDS.SENT]: MAILBOX_LABEL_IDS.ALL_SENT,
    [MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL]: MAILBOX_LABEL_IDS.ALL_MAIL,
};

export enum AutoReplyDuration {
    FIXED = 0,
    DAILY = 1,
    WEEKLY = 2,
    MONTHLY = 3,
    PERMANENT = 4,
}

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
    'protonmailrmez3lotccipshtkleegetolb73fuirgj7r4o4vfu7ozyd.onion',
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

declare const WEBPACK_OPENPGP: {
    main: OpenPGPFile;
    compat: OpenPGPFile;
    elliptic: OpenPGPFile;
    worker: OpenPGPFile;
};
export const OPENPGP =
    typeof WEBPACK_OPENPGP === 'undefined'
        ? {
              main: DUMMY_FILE,
              compat: DUMMY_FILE,
              elliptic: DUMMY_FILE,
              worker: DUMMY_FILE,
          }
        : WEBPACK_OPENPGP;

export const FORKABLE_APPS = new Set(
    [
        APPS.PROTONMAIL,
        APPS.PROTONCONTACTS,
        APPS.PROTONDRIVE,
        APPS.PROTONCALENDAR,
        APPS.PROTONPASS,
        APPS.PROTONEXTENSION,
        APPS.PROTONPASSBROWSEREXTENSION,
        APPS.PROTONVPNBROWSEREXTENSION,
    ].filter(Boolean)
);

export const EXTENSIONS = {
    [APPS.PROTONEXTENSION]: { ID: 'ghmbeldphafepmbegfdlkpapadhbakde' },
    [APPS.PROTONPASSBROWSEREXTENSION]: {
        ID: 'ghmbeldphafepmbegfdlkpapadhbakde',
    },
    [APPS.PROTONVPNBROWSEREXTENSION]: {
        ID: 'jplgfhpmjnbigmhklmmbgecoobifkmpa',
    },
} as const;

export const AES256 = 'aes256';

export const REFERRAL_PROGRAM_MAX_AMOUNT = 9000;

export const FIBONACCI_LIST = [1, 1, 2, 3, 5, 8, 13];

/* Here is a list of product not to be translated */
//TODO should this be moved in the easy-switch package
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

export const OPEN_OFFER_MODAL_EVENT = 'openoffermodal';

export const FAMILY_MAX_USERS = 6;

export enum DESKTOP_APP_NAMES {
    DRIVE = 'drive',
}

export enum DESKTOP_PLATFORMS {
    LINUX = 'linux',
    MACOS = 'macos',
    WINDOWS = 'windows',
}

export enum RELEASE_CATEGORIES {
    STABLE = 'Stable',
    ALPHA = 'Alpha',
    EARLY_ACCESS = 'EarlyAccess',
}

export enum PROTON_WEBSITES {
    PROTON_STATUS_PAGE = 'https://status.proton.me',
}

export const IPS_INCLUDED_IN_PLAN: Partial<Record<PLANS, number>> = {
    [PLANS.VPN_BUSINESS]: 1,
} as const;

/**
 * Mail Composer toolbar
 */
export const COMPOSER_TOOLBAR_ICON_SIZE = 14;
