angular.module('proton.constants', [])

//
// Constants definition
//
.constant('CONSTANTS', {
    TIMEOUT: 30 * 1000, // timeout in milliseconds
    BASE_SIZE: 1024, // define the base used for byte
    HOSTS_ALLOWED: ['localhost', 'dev.protonmail.com', 'protonmail.blue', 'dev2.protonmail.com'],
    MAILBOX_PASSWORD_KEY: "proton:mailbox_pwd",
    OAUTH_KEY: "proton:oauth",
    EVENT_ID: "proton:eventid",
    FREE_USER: 0,
    PAID_MEMBER: 1,
    PAID_ADMIN: 2,
    ATTACHMENT_SIZE_LIMIT: 15, // MB
    ATTACHMENT_NUMBER_LIMIT: 100,
    MAX_TITLE_LENGTH: 255,
    MAX_NUMBER_COMPOSER: 3,
    NUMBER_OF_MESSAGES_PRELOADING: 5,
    ENC_NONE: 0,
    ENC_INTERNAL: 1, // all within ProtonMail
    ENC_EXTERNAL: 2, // encrypted from outside
    ENC_OUT_ENC: 3, // encrypted for outside
    ENC_OUT_PLAIN: 4, // sent plain but stored enc
    ENC_STORED_ENC: 5, // such as draft
    INTERVAL_EVENT_TIMER: 30 * 1000, // time between querying the event log (every 30 seconds)
    TIMEOUT_PRELOAD_MESSAGE: 500, // milliseconds
    UPLOAD_GRADIENT_DARK: '147, 145, 209', // dark rgb color for upload progress bar
    UPLOAD_GRADIENT_LIGHT: '255, 255, 255', // light rgb color for upload progress bar
    ENC_OUT_ENC_REPLY: 6, // encrypted for outside
    SAVE_TIMEOUT_TIME: 2000, // 2 seconds
    MAX_EXPIRATION_TIME: 672, // hours
    ELEMENTS_PER_PAGE: 50,
    COUNT_UNREAD_INTERVAL_TIME: 20000, // 20 seconds
    LOGIN_PW_MAX_LEN: 500,
    HD_BREAKPOINT: 1920,
    DESKTOP_BREAKPOINT: 1200,
    ROW_BREAKPOINT: 960,
    MOBILE_BREAKPOINT: 800,
    WIZARD_ENABLED: false, // true / false
    MAILBOX_IDENTIFIERS: {
        inbox: '0',
        drafts: '1',
        sent: '2', // outbox
        trash: '3',
        spam: '4',
        starred: '10',
        archive: '6',
        search: '7',
        label: '8'
    }
});
