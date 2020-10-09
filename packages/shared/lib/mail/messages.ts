import { c } from 'ttag';
import { MIME_TYPES } from '../constants';
import { clearBit, hasBit, setBit, toggleBit } from '../helpers/bitset';
import { identity } from '../helpers/function';
import { Message } from '../interfaces/mail/Message';
import { MESSAGE_FLAGS, SIGNATURE_START } from './constants';

const { PLAINTEXT, MIME } = MIME_TYPES;
const {
    FLAG_RECEIVED,
    FLAG_SENT,
    FLAG_RECEIPT_REQUEST,
    FLAG_RECEIPT_SENT,
    FLAG_IMPORTED,
    FLAG_REPLIED,
    FLAG_REPLIEDALL,
    FLAG_FORWARDED,
    FLAG_INTERNAL,
    FLAG_AUTO,
    FLAG_E2E,
    FLAG_SIGN,
    FLAG_PUBLIC_KEY,
} = MESSAGE_FLAGS;
const AUTOREPLY_HEADERS = ['X-Autoreply', 'X-Autorespond', 'X-Autoreply-From', 'X-Mail-Autoreply'];

/**
 * Check if a message has a mime type
 */
export const hasMimeType = (type: MIME_TYPES) => (message?: Partial<Message>) => message?.MIMEType === type;

export const isMIME = hasMimeType(MIME);
export const isPlainText = hasMimeType(PLAINTEXT);
export const isHTML = hasMimeType(MIME_TYPES.DEFAULT);

/**
 * Check if a message has a flag in the flags bitmap
 */
export const hasFlag = (flag: number) => (message?: Partial<Message>) => hasBit(message?.Flags, flag);
export const setFlag = (flag: number) => (message?: Partial<Message>) => setBit(message?.Flags, flag);
export const clearFlag = (flag: number) => (message?: Partial<Message>) => clearBit(message?.Flags, flag);
export const toggleFlag = (flag: number) => (message?: Partial<Message>) => toggleBit(message?.Flags, flag);

export const isRequestReadReceipt = hasFlag(FLAG_RECEIPT_REQUEST);
export const isReadReceiptSent = hasFlag(FLAG_RECEIPT_SENT);
export const isImported = hasFlag(FLAG_IMPORTED);
export const isInternal = hasFlag(FLAG_INTERNAL);
export const isExternal = (message: Message) => !isInternal(message);
export const isAuto = hasFlag(FLAG_AUTO);
export const isReceived = hasFlag(FLAG_RECEIVED);
export const isSent = hasFlag(FLAG_SENT);
export const isReplied = hasFlag(FLAG_REPLIED);
export const isRepliedAll = hasFlag(FLAG_REPLIEDALL);
export const isForwarded = hasFlag(FLAG_FORWARDED);
export const isSentAndReceived = hasFlag(FLAG_SENT | FLAG_RECEIVED);
export const isDraft = (message?: Partial<Message>) =>
    message?.Flags !== undefined && !isSent(message) && !isReceived(message);
export const isE2E = hasFlag(FLAG_E2E);
export const isSentEncrypted = hasFlag(FLAG_E2E | FLAG_SENT);
export const isInternalEncrypted = hasFlag(FLAG_E2E | FLAG_INTERNAL);
export const isSign = hasFlag(FLAG_SIGN);
export const isAttachPublicKey = hasFlag(FLAG_PUBLIC_KEY);

export const isExternalEncrypted = (message: Message) => isE2E(message) && !isInternal(message);
export const isPGPEncrypted = (message: Message) => isExternal(message) && isReceived(message) && isE2E(message);
export const inSigningPeriod = ({ Time = 0 }: Message) => Time >= Math.max(SIGNATURE_START.USER, SIGNATURE_START.BULK);
export const isPGPInline = (message: Message) => isPGPEncrypted(message) && !isMIME(message);
export const isEO = (message?: Message) => !!message?.Password;
export const addReceived = (Flags = 0) => setBit(Flags, MESSAGE_FLAGS.FLAG_RECEIVED);

export const getSender = (message?: Message) => message?.Sender;
export const getRecipients = (message?: Message) => {
    const { ToList = [], CCList = [], BCCList = [] } = message || {};
    return [...ToList, ...CCList, ...BCCList];
};
export const getRecipientsAddresses = (message: Message) =>
    getRecipients(message)
        .map(({ Address }) => Address || '')
        .filter(identity);
/**
 * Get date from message
 */
export const getDate = ({ Time = 0 }: Message) => new Date(Time * 1000);
export const getParsedHeaders = (message: Partial<Message> | undefined, parameter: string) => {
    const { ParsedHeaders = {} } = message || {};
    return ParsedHeaders[parameter];
};
export const getParsedHeadersFirstValue = (message: Partial<Message> | undefined, parameter: string) => {
    const value = getParsedHeaders(message, parameter);
    return Array.isArray(value) ? value[0] : value;
};
export const getParsedHeadersAsArray = (message: Partial<Message> | undefined, parameter: string) => {
    const value = getParsedHeaders(message, parameter);
    return value === undefined ? undefined : Array.isArray(value) ? value : [value];
};
export const getOriginalTo = (message?: Partial<Message>) => {
    return getParsedHeadersFirstValue(message, 'X-Original-To') || '';
};
export const requireReadReceipt = (message?: Message) => {
    const dispositionNotificationTo = getParsedHeaders(message, 'Disposition-Notification-To') || ''; // ex: Andy <andy@pm.me>

    if (!dispositionNotificationTo || isReadReceiptSent(message) || isSent(message)) {
        return false;
    }

    return true;
};
export const getListUnsubscribe = (message?: Message) => getParsedHeadersAsArray(message, 'List-Unsubscribe');
export const getListUnsubscribePost = (message?: Message) => getParsedHeadersAsArray(message, 'List-Unsubscribe-Post');
export const getAttachments = (message?: Message) => message?.Attachments || [];
export const hasAttachments = (message?: Message) => !!(message?.NumAttachments && message?.NumAttachments > 0);
export const attachmentsSize = (message?: Message) =>
    getAttachments(message).reduce((acc, { Size = 0 } = {}) => acc + +Size, 0);

export const isAutoReply = (message?: Message) => {
    const ParsedHeaders = message?.ParsedHeaders || {};
    return AUTOREPLY_HEADERS.some((h) => h in ParsedHeaders);
};
export const isSentAutoReply = ({ Flags, ParsedHeaders = {} }: Message) => {
    if (!isSent({ Flags })) {
        return false;
    }

    if (isAuto({ Flags })) {
        return true;
    }

    const autoReplyHeaderValues = [
        ['Auto-Submitted', 'auto-replied'],
        ['Precedence', 'auto_reply'],
        ['X-Precedence', 'auto_reply'],
        ['Delivered-To', 'autoresponder'],
    ];
    // These headers are not always available. But we should check them to support
    // outlook / mail autoresponses.
    return (
        AUTOREPLY_HEADERS.some((header) => header in ParsedHeaders) ||
        autoReplyHeaderValues.some(([header, searchedValue]) =>
            getParsedHeadersAsArray({ ParsedHeaders }, header)?.some((foundValue) => foundValue === searchedValue)
        )
    );
};
/**
 * Format the subject to add the prefix only when the subject
 * doesn't start with it
 */
export const formatSubject = (subject = '', prefix = '') => {
    const hasPrefix = new RegExp(`^${prefix}`, 'i');
    return hasPrefix.test(subject) ? subject : `${prefix} ${subject}`;
};

export const DRAFT_ID_PREFIX = 'draft';
export const ORIGINAL_MESSAGE = `‐‐‐‐‐‐‐ Original Message ‐‐‐‐‐‐‐`;
export const RE_PREFIX = c('Message').t`Re:`;
export const FW_PREFIX = c('Message').t`Fw:`;
