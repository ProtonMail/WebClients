export const ATTACHMENT_MAX_SIZE = 25000000; // bytes -> 25MB

export enum UPLOAD_ATTACHMENT_ERROR_CODES {
    MESSAGE_ALREADY_SENT = 11114,
    STORAGE_QUOTA_EXCEEDED = 11100,
}

export const MESSAGE_ALREADY_SENT_INTERNAL_ERROR = 'Message already sent';
export const STORAGE_QUOTA_EXCEEDED_INTERNAL_ERROR = 'Storage quota exceeded';

export const DRAG_ADDRESS_KEY = 'drag-address';

export enum SEND_EMAIL_ERROR_CODES {
    MESSAGE_ALREADY_SENT = 2500,
}

export const MIN_DELAY_SENT_NOTIFICATION = 2500;

export const SCHEDULED_MESSAGES_LIMIT = 1000;
export const SCHEDULED_MAX_DATE_DAYS = 90;

export const MAX_EXPIRATION_TIME = 672; // hours
export const DEFAULT_EO_EXPIRATION_DAYS = 28;

export const ADVANCED_SEARCH_OVERLAY_CLOSE_EVENT = 'advancedsearchclose';

export const NO_REPLY_EMAIL_DONT_SHOW_AGAIN_KEY = 'no-reply-email-dont-show-again';
