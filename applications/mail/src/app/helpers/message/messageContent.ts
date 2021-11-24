import { MailSettings, Address } from '@proton/shared/lib/interfaces';
import { isPlainText } from '@proton/shared/lib/mail/messages';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { toText } from '../parserHtml';
import { findSender } from '../addresses';
import { textToHtml } from '../textToHtml';
import { parseInDiv } from '../dom';
import { MessageState, PartialMessageState } from '../../logic/messages/messagesTypes';

export const getPlainTextContent = (message: PartialMessageState) => {
    return message.messageDocument?.plainText || '';
};

export const getDocumentContent = (document: Element | undefined) => {
    const root = document?.querySelector('body') || document;
    return root?.innerHTML || '';
};

/**
 * Get current processed message document html content
 */
export const getContent = (message: PartialMessageState) => {
    if (isPlainText(message.data)) {
        return getPlainTextContent(message);
    }

    return getDocumentContent(message.messageDocument?.document);
};

export const setPlainTextContent = (message: MessageState, content: string) => {
    if (message.messageDocument) {
        message.messageDocument.plainText = content;
    } else {
        message.messageDocument = { plainText: content };
    }
};

export const setDocumentContent = (document: Element | undefined, content: string) => {
    if (document) {
        document.innerHTML = content;
    } else {
        document = parseInDiv(content);
    }

    return document;
};

/**
 * Set current processed message document html
 */
export const setContent = (message: MessageState, content: string) => {
    if (isPlainText(message.data)) {
        setPlainTextContent(message, content);
    } else {
        const document = setDocumentContent(message.messageDocument?.document, content);
        if (message.messageDocument) {
            message.messageDocument.document = document;
        } else {
            message.messageDocument = { document };
        }
    }
};

export const exportPlainText = (content: string) => {
    /*
     * The replace removes any characters that are produced by the copying process (like zero width characters)
     * See: http://www.berklix.org/help/majordomo/#quoted we want to avoid sending unnecessary quoted printable encodings
     */
    return toText(content, true).replace(/\u200B/g, '');
};

/**
 * Generates/Gets the plaintext body from the message. If the message is not composed in plaintext, it will downconvert
 * the html body to plaintext if downconvert is set. If downconvert is disabled it will return false.
 */
export const getPlainText = (message: MessageState, downconvert: boolean) => {
    if (isPlainText(message.data)) {
        return getPlainTextContent(message);
    }

    if (!downconvert) {
        return undefined;
    }

    return exportPlainText(getContent(message));
};

/**
 * Convert the body of a message in plain text to an HTML version
 */
export const plainTextToHTML = (
    message: Message | undefined,
    plainTextContent: string | undefined,
    mailSettings: Partial<MailSettings> = {},
    addresses: Address[]
) => {
    const sender = findSender(addresses, message);
    return textToHtml(plainTextContent, sender?.Signature || '', mailSettings);
};

export const querySelectorAll = (message: Partial<MessageState> | undefined, selector: string) => [
    ...((message?.messageDocument?.document?.querySelectorAll(selector) || []) as HTMLElement[]),
];
