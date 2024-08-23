import { DEFAULT_FONT_FACE_ID, DEFAULT_FONT_SIZE } from '@proton/components/components/editor/constants';
import { checkContrast, parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import type { Address, MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isPlainText, isPlainText as testIsPlainText } from '@proton/shared/lib/mail/messages';
import { message } from '@proton/shared/lib/sanitize';
import { escape, unescape } from '@proton/shared/lib/sanitize/escape';

import { MESSAGE_IFRAME_ROOT_ID } from '../../components/message/constants';
import type { MESSAGE_ACTIONS } from '../../constants';
import type { MessageState, PartialMessageState } from '../../store/messages/messagesTypes';
import { parseModelResult } from '../assistant/result';
import { findSender } from '../message/messageRecipients';
import { toText } from '../parserHtml';
import { textToHtml } from '../textToHtml';
import { locateBlockquote } from './messageBlockquote';
import { generateBlockquote } from './messageDraft';

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
    if (testIsPlainText(message.data)) {
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
        document = parseStringToDOM(content).body;
    }

    return document;
};

/**
 * Set current processed message document html
 */
export const setContent = (message: MessageState, content: string) => {
    if (testIsPlainText(message.data)) {
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
    return toText(content).replace(/\u200B/g, '');
};

/**
 * Generates/Gets the plaintext body from the message. If the message is not composed in plaintext, it will downconvert
 * the html body to plaintext if downconvert is set. If downconvert is disabled it will return false.
 */
export const getPlainText = (message: MessageState, downconvert: boolean) => {
    if (testIsPlainText(message.data)) {
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
    message: Partial<Message> | undefined,
    plainTextContent: string | undefined,
    mailSettings: MailSettings | undefined,
    userSettings: UserSettings | undefined,
    addresses: Address[]
) => {
    const sender = findSender(addresses, message);
    return textToHtml(plainTextContent, sender?.Signature || '', mailSettings, userSettings);
};

export const querySelectorAll = (message: Partial<MessageState> | undefined, selector: string) => [
    ...((message?.messageDocument?.document?.querySelectorAll(selector) || []) as HTMLElement[]),
];

export const canSupportDarkStyle = (iframe: HTMLIFrameElement | null) => {
    const container = iframe?.contentDocument?.getElementById(MESSAGE_IFRAME_ROOT_ID);
    const window = iframe?.contentWindow;

    if (!container || !window) {
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

    const contrastResult = checkContrast(container, window);

    return contrastResult;
};

export const getContentWithoutBlockquotes = (
    message: MessageState,
    referenceMessage: MessageState,
    mailSettings: MailSettings,
    userSettings: UserSettings,
    addresses: Address[],
    action: MESSAGE_ACTIONS
) => {
    if (testIsPlainText(message.data)) {
        const blockquotes = generateBlockquote(referenceMessage || {}, mailSettings, userSettings, addresses, action);
        const plainBlockquotes = toText(blockquotes);

        return message.messageDocument?.plainText?.replace(plainBlockquotes, '');
    }

    const [contentBeforeBlockquotes] = locateBlockquote(message.messageDocument?.document);

    return contentBeforeBlockquotes;
};

export const getContentWithBlockquotes = (
    content: string,
    isPlainText: boolean,
    referenceMessage: MessageState,
    mailSettings: MailSettings,
    userSettings: UserSettings,
    addresses: Address[],
    action: MESSAGE_ACTIONS
) => {
    const blockquotes = generateBlockquote(referenceMessage || {}, mailSettings, userSettings, addresses, action);

    if (isPlainText) {
        const plainBlockquotes = toText(blockquotes);

        return `${content}${plainBlockquotes}`;
    } else {
        return `${content}${blockquotes.toString()}`;
    }
};

/**
 * @param mailSettings
 * @returns string containing fon styles. to be inserted in `style` attribute of an HTML element
 * @example
 * ```
 * This usage
 * <div style="${getComposerDefaultFontStyles(mailSettings)}">...</div>
 * Becomes
 * <div style="font-family: Arial, serif; font-size: 12px;">...</div>
 * ```
 */
export const getComposerDefaultFontStyles = (mailSettings: MailSettings) =>
    `font-family: ${mailSettings?.FontFace || DEFAULT_FONT_FACE_ID}; font-size: ${mailSettings?.FontSize || DEFAULT_FONT_SIZE}px`;

export const prepareContentToInsert = (textToInsert: string, isPlainText: boolean, isMarkdown: boolean) => {
    if (isPlainText) {
        return unescape(textToInsert);
    }

    if (isMarkdown) {
        return parseModelResult(textToInsert);
    }

    // Because rich text editor convert text to HTML, we need to escape the text before inserting it
    // As a 2nd layer of security, to prevent adding unsafe elements, we also want to sanitize the content before importing it
    const escapedText = escape(textToInsert);
    const sanitizedText = message(escapedText);

    return sanitizedText;
};

export const insertTextBeforeContent = (
    message: MessageState,
    textToInsert: string,
    mailSettings: MailSettings,
    needsSeparator: boolean
) => {
    let newBody;
    // In both cases, add a separator only if there is already some content in the composer
    // However we still need to add message body after because message might contain signature or blockquotes
    if (isPlainText(message.data)) {
        const separator = '--------------------';
        const messageBody = message.messageDocument?.plainText;

        newBody = needsSeparator ? `${textToInsert}\n${separator}\n${messageBody}` : `${textToInsert}\n${messageBody}`;
    } else {
        const separator = `<hr/>`;
        const messageBody = message.messageDocument?.document?.innerHTML;
        const textToInsertHTML = textToInsert.replaceAll('\n', '<br>');
        const fontStyles = getComposerDefaultFontStyles(mailSettings);

        newBody = needsSeparator
            ? `<div style="${fontStyles}">${textToInsertHTML}</div><br>${separator}<br>${messageBody}`
            : `<div style="${fontStyles}">${textToInsertHTML}</div><br>${messageBody}`;
    }
    return newBody;
};
