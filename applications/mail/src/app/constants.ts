import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { c } from 'ttag';

export const MAX_EXPIRATION_TIME = 672; // hours
export const PAGE_SIZE = 50;
export const ATTACHMENT_MAX_SIZE = 25000000; // bytes -> 25MB

export const ELEMENT_TYPES = {
    MESSAGE: 'message',
    CONVERSATION: 'conversation'
};

export const LABEL_IDS_TO_HUMAN = {
    [MAILBOX_LABEL_IDS.INBOX]: 'inbox',
    [MAILBOX_LABEL_IDS.ALL_DRAFTS]: 'all-drafts',
    [MAILBOX_LABEL_IDS.ALL_SENT]: 'all-sent',
    [MAILBOX_LABEL_IDS.TRASH]: 'trash',
    [MAILBOX_LABEL_IDS.SPAM]: 'spam',
    [MAILBOX_LABEL_IDS.ALL_MAIL]: 'all-mail',
    [MAILBOX_LABEL_IDS.ARCHIVE]: 'archive',
    [MAILBOX_LABEL_IDS.SENT]: 'sent',
    [MAILBOX_LABEL_IDS.DRAFTS]: 'drafts',
    [MAILBOX_LABEL_IDS.STARRED]: 'starred'
};

export const HUMAN_TO_LABEL_IDS = Object.entries(LABEL_IDS_TO_HUMAN).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, Object.create(null));

export const LABEL_IDS_TO_I18N = {
    [MAILBOX_LABEL_IDS.INBOX]: c('Link').t`Inbox`,
    [MAILBOX_LABEL_IDS.ALL_DRAFTS]: c('Link').t`Drafts`,
    [MAILBOX_LABEL_IDS.ALL_SENT]: c('Link').t`Sent`,
    [MAILBOX_LABEL_IDS.TRASH]: c('Link').t`Trash`,
    [MAILBOX_LABEL_IDS.SPAM]: c('Link').t`Spam`,
    [MAILBOX_LABEL_IDS.ALL_MAIL]: c('Link').t`All mail`,
    [MAILBOX_LABEL_IDS.ARCHIVE]: c('Link').t`Archive`,
    [MAILBOX_LABEL_IDS.SENT]: c('Link').t`Sent`,
    [MAILBOX_LABEL_IDS.DRAFTS]: c('Link').t`Drafts`,
    [MAILBOX_LABEL_IDS.STARRED]: c('Link').t`Starred`
};

export enum ENCRYPTED_STATUS {
    PGP_MIME = 8 // Used for attachment
}

export const AES256 = 'aes256';

export enum LINK_TYPES {
    WEB = 'web',
    EMAIL = 'email',
    PHONE = 'phone'
}

export const SIGNATURE_START = 1546300800; // January 1, 2019
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

export enum VERIFICATION_STATUS {
    NOT_VERIFIED = -1,
    NOT_SIGNED = 0,
    SIGNED_AND_VALID = 1,
    SIGNED_AND_INVALID = 2,
    SIGNED_NO_PUB_KEY = 3
}

export enum MESSAGE_ACTIONS {
    NEW = -1,
    REPLY = 0,
    REPLY_ALL = 1,
    FORWARD = 2
}

export const DRAG_ELEMENT_KEY = 'drag-element';
