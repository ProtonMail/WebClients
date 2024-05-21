export const MESSAGE_FLAGS = {
    FLAG_RECEIVED: Math.pow(2, 0), // whether a message is received
    FLAG_SENT: Math.pow(2, 1), // whether a message is sent
    FLAG_INTERNAL: Math.pow(2, 2), // whether the message is between Proton Mail recipients
    FLAG_E2E: Math.pow(2, 3), // whether the message is end-to-end encrypted
    FLAG_AUTO: Math.pow(2, 4), // whether the message is an autoresponse
    FLAG_REPLIED: Math.pow(2, 5), // whether the message is replied to
    FLAG_REPLIEDALL: Math.pow(2, 6), // whether the message is replied all to
    FLAG_FORWARDED: Math.pow(2, 7), // whether the message is forwarded
    FLAG_AUTOREPLIED: Math.pow(2, 8), // whether the message has been responded to with an autoresponse
    FLAG_IMPORTED: Math.pow(2, 9), // whether the message is an import
    FLAG_OPENED: Math.pow(2, 10), // whether the message has ever been opened by the user
    FLAG_RECEIPT_SENT: Math.pow(2, 11), // whether a read receipt has been sent in response to the message
    FLAG_RECEIPT_REQUEST: Math.pow(2, 16), // whether to request a read receipt for the message
    FLAG_PUBLIC_KEY: Math.pow(2, 17), // whether to attach the public key
    FLAG_SIGN: Math.pow(2, 18), // whether to sign the message
    FLAG_UNSUBSCRIBED: Math.pow(2, 19), // Unsubscribed from newsletter
    FLAG_SCHEDULED_SEND: Math.pow(2, 20), // Messages that have been delayed send
    FLAG_UNSUBSCRIBABLE: Math.pow(2, 21), // Messages that are unsubscribable
    FLAG_DMARC_FAIL: Math.pow(2, 26), // Incoming mail failed dmarc authentication.
    FLAG_HAM_MANUAL: Math.pow(2, 27), // The message is in spam and the user moves it to a new location that is not spam or trash (e.g. inbox or archive).
    FLAG_PHISHING_AUTO: Math.pow(2, 30), // Incoming mail is marked as phishing by anti-spam filters.
    FLAG_FROZEN_EXPIRATION: BigInt(Math.pow(2, 32)), // Messages where the expiration time cannot be changed
    FLAG_SUSPICIOUS: BigInt(Math.pow(2, 33)), // System flagged this message as a suspicious email
    FLAG_AUTO_FORWARDER: BigInt(Math.pow(2, 34)), // Message is auto-forwarded
    FLAG_AUTO_FORWARDEE: BigInt(Math.pow(2, 35)), // Message is auto-forwarded
};

export enum VERIFICATION_STATUS {
    NOT_VERIFIED = -1,
    NOT_SIGNED,
    SIGNED_AND_VALID,
    SIGNED_AND_INVALID,
    SIGNED_NO_PUB_KEY = 3,
}

// Protonmail enforces signing outgoing messages since January 1, 2019. It does not sign bulk messages yet
export const SIGNATURE_START = {
    USER: 1546300800,
    BULK: Infinity,
};

export enum BLOCK_SENDER_CONFIRMATION {
    DO_NOT_ASK = 1,
}

export const ATTACHMENT_MAX_COUNT = 100;

export enum ATTACHMENT_DISPOSITION {
    ATTACHMENT = 'attachment',
    INLINE = 'inline',
}

export enum MARK_AS_STATUS {
    READ = 'read',
    UNREAD = 'unread',
}

export const AUTO_REPLY_CHARACTER_COUNT_LIMIT = 4000;
