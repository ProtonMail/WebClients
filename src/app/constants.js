angular.module('proton.constants', [])
/* eslint  no-useless-escape: "off" */
    .constant('regexEmail', /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/i)

//
// Constants definition
//
    .constant('CONSTANTS', {
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
                SPACE: '1gb'
            }
        },
        PLANS_TYPE: {
            PLAN: 1,
            ADDON: 0
        },
        MAX_MEMBER: 100,
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
        INVITE_MAIL: 1,
        INVITE_VPN: 2,
        FREE_USER_ROLE: 0,
        PAID_MEMBER_ROLE: 1,
        PAID_ADMIN_ROLE: 2,
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
        HD_BREAKPOINT: 1920,
        DESKTOP_BREAKPOINT: 1200,
        ROW_BREAKPOINT: 960,
        MOBILE_BREAKPOINT: 800,
        WIZARD_ENABLED: true, // true / false
        MAILBOX_IDENTIFIERS: {
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
        },
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
        MAX_PAYPAL_AMOUNT: 999999999,
        MIN_BITCOIN_AMOUNT: 500,
        BTC_DONATION_ADDRESS: '1Q1nhq1NbxPYAbw1BppwKbCqg58ZqMb9A8',
        CURRENCIES: ['USD', 'EUR', 'CHF'],
        BILLING_CYCLE: [1, 12],
        IFRAME_SECURE_ORIGIN: 'https://secure.protonmail.com',
        INVITE_URL: 'https://protonmail.com/invite',
        DEFAULT_CURRENCY: 'EUR',
        TRACKER_ROUTE: 'piwik.php',
        PIWIK_SCRIPT: 'piwik.js',
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
        }
    });
