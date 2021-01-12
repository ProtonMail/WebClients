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
    FLAG_SIGN: 262144, // whether to sign the message
    FLAG_HAM_MANUAL: 1 << 27, // The message is in spam and the user moves it to a new location that is not spam or trash (e.g. inbox or archive).
    FLAG_PHISHING_AUTO: 1 << 30, // Incoming mail is marked as phishing by anti-spam filters.
    FLAG_DMARC_FAIL: 1 << 26, // Incoming mail failed dmarc authentication.
    FLAG_UNSUBSCRIBED: 1 << 19, // Unsubscribed from newsletter
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
