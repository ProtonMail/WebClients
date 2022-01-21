import { MailSettings, Address } from '@proton/shared/lib/interfaces';
import { isPlainText, isNewsLetter } from '@proton/shared/lib/mail/messages';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getMaxDepth } from '@proton/shared/lib/helpers/dom';

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
    mailSettings: MailSettings | undefined,
    addresses: Address[]
) => {
    const sender = findSender(addresses, message);
    return textToHtml(plainTextContent, sender?.Signature || '', mailSettings);
};

export const querySelectorAll = (message: Partial<MessageState> | undefined, selector: string) => [
    ...((message?.messageDocument?.document?.querySelectorAll(selector) || []) as HTMLElement[]),
];

export const canSupportDarkStyle = (message: MessageState) => {
    const container = message.messageDocument?.document;

    if (!container) {
        return false;
    }

    const colorSchemeMetaTag = container.querySelector('meta[name="color-scheme"]');

    // If the meta tag color-scheme is present, we assume that the email supports dark mode
    if (colorSchemeMetaTag?.getAttribute('content')?.includes('dark')) {
        return true;
    }

    const supportedColorSchemesMetaTag = container.querySelector('meta[name="supported-color-schemes"]');

    // If the meta tag supported-color-schemes is present, we assume that the email supports dark mode
    if (supportedColorSchemesMetaTag?.getAttribute('content')?.includes('dark')) {
        return true;
    }

    const styleTag = container.querySelector('style');
    const styleTextContent = styleTag?.textContent;

    // If the media query prefers-color-scheme is present, we assume that the email supports dark mode
    if (styleTextContent?.includes('color-scheme') || styleTextContent?.includes('prefers-color-scheme')) {
        return true;
    }

    const tableTag = container.querySelector('table');

    // If the message contains a table, we assume that the message content is complex and not supporting dark mode
    if (tableTag) {
        return false;
    }

    const maxDepth = getMaxDepth(container);

    // If the HTML content is deep, we assume that the message content is complex and not supporting dark mode
    if (maxDepth > 15) {
        return false;
    }

    // If the message is a newsletter, message content needs to be display as it has been decided by the sender, so no dark style injection
    if (isNewsLetter(message.data)) {
        return false;
    }

    return true;
};
