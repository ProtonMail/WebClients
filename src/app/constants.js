angular.module('proton.constants', [])

//
// Constants definition
//
.constant('CONSTANTS', {
    ATTACHMENT_SIZE_LIMIT: 15, // MB
    ATTACHMENT_NUMBER_LIMIT: 50,
    MAX_TITLE_LENGTH: 250,
    MAX_NUMBER_COMPOSER: 3,
    NUMBER_OF_MESSAGES_PRELOADING: 5,
    ENC_NONE: 0,
    ENC_INTERNAL: 1, // all within ProtonMail
    ENC_EXTERNAL: 2, // encrypted from outside
    ENC_OUT_ENC: 3, // encrypted for outside
    ENC_OUT_PLAIN: 4, // sent plain but stored enc
    ENC_STORED_ENC: 5, // such as draft
    TIMEOUT_PRELOAD_MESSAGE: 500, // milliseconds
    ENC_OUT_ENC_REPLY: 6, // encrypted for outside
    SAVE_TIMEOUT_TIME: 3000, // 3 seconds
    MAX_EXPIRATION_TIME: 672, // hours
    MESSAGES_PER_PAGE: 50,
    COUNT_UNREAD_INTERVAL_TIME: 20000, // 20 seconds
    MAILBOX_IDENTIFIERS: {
        "inbox": 0,
        "drafts": 1,
        "sent": 2, // outbox
        "trash": 3,
        "spam": 4,
        "starred": 5,
        "archive": 6,
        "search": 7,
        "label": 8
    }
});
