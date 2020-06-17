import { MIME_TYPES } from 'proton-shared/lib/constants';
import { MailSettings } from 'proton-shared/lib/interfaces';

import { isPlainText } from './messages';
import { MessageExtended, PartialMessageExtended } from '../../models/message';
import { toText } from '../parserHtml';
import { findSender } from '../addresses';
import { Address } from 'proton-shared/lib/interfaces';
import { textToHtml } from '../textToHtml';
import { parseInDiv } from '../dom';
import { templateBuilder } from './messageSignature';

export const getPlainTextContent = (message: PartialMessageExtended) => {
    return message.plainText || '';
};

export const getDocumentContent = (document: Element | undefined) => {
    const root = document?.querySelector('body') || document;
    return root?.innerHTML || '';
};

/**
 * Get current processed message document html content
 */
export const getContent = (message: PartialMessageExtended) => {
    if (isPlainText(message.data)) {
        return getPlainTextContent(message);
    }

    return getDocumentContent(message.document);
};

export const setPlainTextContent = (message: MessageExtended, content: string) => {
    message.plainText = content;
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
export const setContent = (message: MessageExtended, content: string) => {
    if (isPlainText(message.data)) {
        setPlainTextContent(message, content);
    } else {
        message.document = setDocumentContent(message.document, content);
    }
};

export const exportPlainText = (message: MessageExtended) => {
    const content = getContent(message);

    /*
     * The replace removes any characters that are produced by the copying process (like zero width characters)
     * See: http://www.berklix.org/help/majordomo/#quoted we want to avoid sending unnecessary quoted printable encodings
     */
    if (message.data?.MIMEType !== MIME_TYPES.DEFAULT) {
        return content.replace(/\u200B/g, '');
    }
    return toText(content, true, true).replace(/\u200B/g, '');
};

/**
 * Generates/Gets the plaintext body from the message. If the message is not composed in plaintext, it will downconvert
 * the html body to plaintext if downconvert is set. If downconvert is disabled it will return false.
 */
export const getPlainText = (message: MessageExtended, downconvert: boolean) => {
    if (isPlainText(message.data)) {
        return getPlainTextContent(message);
    }

    if (!downconvert) {
        return undefined;
    }

    return exportPlainText(message);
};

/**
 * Convert the body of a message in plain text to an HTML version
 */
export const plainTextToHTML = (message: MessageExtended, mailSettings: MailSettings, addresses: Address[]) => {
    const sender = findSender(addresses, message.data);
    const content = getContent(message);

    return textToHtml(content, sender?.Signature || '', mailSettings);
};

/**
 * Return the content of the message with the signature switched from the old one to the new one
 */
export const changeSignature = (
    message: MessageExtended,
    mailSettings: MailSettings,
    oldSignature: string,
    newSignature: string
) => {
    const oldTemplate = templateBuilder(oldSignature, mailSettings, false, true);
    const newTemplate = templateBuilder(newSignature, mailSettings, false, true);

    if (isPlainText(message.data)) {
        const content = getPlainTextContent(message);
        const oldSignatureText = toText(oldTemplate, true, true)
            .replace(/\u200B/g, '')
            .trim();
        const newSignatureText = toText(newTemplate, true, true)
            .replace(/\u200B/g, '')
            .trim();
        return content.replace(oldSignatureText, newSignatureText);
    } else {
        const content = getDocumentContent(message.document);
        return content.replace(oldTemplate, newTemplate);
    }
};
