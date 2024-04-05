import { defaultFontStyle } from '@proton/components/components/editor/helpers';
import { checkContrast, parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { Address, MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isPlainText, isPlainText as testIsPlainText } from '@proton/shared/lib/mail/messages';

import { insertSignature } from 'proton-mail/helpers/message/messageSignature';

import { MESSAGE_IFRAME_ROOT_ID } from '../../components/message/constants';
import { MESSAGE_ACTIONS } from '../../constants';
import { MessageState, PartialMessageState } from '../../store/messages/messagesTypes';
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

// TODO add unit tests
export const insertTextBeforeBlockquotes = (
    textToInsert: string,
    message: MessageState,
    mailSettings: MailSettings,
    userSettings: UserSettings,
    addresses: Address[]
) => {
    const fontStyle = defaultFontStyle(mailSettings);
    const sender = message.data?.Sender;

    let newBody;
    if (isPlainText(message.data)) {
        /**
         * To insert the generated part into a plaintext message we need to:
         * - Generate the signature and insert it after the generated part
         * - Deal with blockquotes
         *  => [Won't be done for alpha] locate the blockquotes and insert them
         *  => [Will be done for alpha] Today we have no blockquote detection for plain messages
         *     So, instead of adding the blockquotes we will just drop them for now
         */
        // We should always get a sender. But in case it fails for some reason, insert the content without signature
        if (sender) {
            // Canonicalize the sender address in case we're sending from an alias
            const canonicalizedSenderAddress = canonicalizeInternalEmail(sender?.Address);
            const senderAddress = addresses.find((address) => address.Email === canonicalizedSenderAddress);
            // Always use "reply" message action so that we don't add extra spaces before and after signature
            // Insert the signature without the body because we need to convert it to text once it has been generated
            const signature = insertSignature(
                undefined,
                senderAddress?.Signature,
                MESSAGE_ACTIONS.REPLY,
                mailSettings,
                userSettings,
                fontStyle,
                true
            );
            const plainSignature = toText(signature);
            newBody = `${textToInsert}${plainSignature}`;
        } else {
            newBody = textToInsert;
        }
    } else {
        // TODO USE FONT SIZE/STYLE IN GENERATED CONTENT (for v2)
        /**
         * To insert the generated part into an HTML message body, we need to:
         * - "Convert" the generated part to HTML (luckily we only need to replace the line breaks)
         * - Generate the signature and insert it after the generated part
         * - Locate the blockquotes from the "current message content" so that we can re-use it below
         */
        const resultHtml = textToInsert.replaceAll('\n', '<br>');

        const [, blockquote] = locateBlockquote(message.messageDocument?.document);

        // We should always get a sender. But in case it fails for some reason, insert the content without signature
        if (sender) {
            // Canonicalize the sender address in case we're sending from an alias
            // TODO can we have external addresses?
            const canonicalizedSenderAddress = canonicalizeInternalEmail(sender?.Address);
            const senderAddress = addresses.find((address) => address.Email === canonicalizedSenderAddress);
            // Always use "reply" message action so that we don't add extra spaces before and after signature
            const bodyAndSignature = insertSignature(
                resultHtml,
                senderAddress?.Signature,
                MESSAGE_ACTIONS.REPLY,
                mailSettings,
                userSettings,
                fontStyle,
                true
            );
            newBody = `${bodyAndSignature}${blockquote}`;
        } else {
            newBody = `${resultHtml}${blockquote}`;
        }
    }

    return newBody;
};

// todo move in asistant helpers
export const cleanAssistantEmailGeneration = (inputText: string) => {
    /* Assistant often generates content with a subject and a body with the following format
     *
     *      Subject: email subject
     *      Body: some text
     *
     *      some other text
     *
     * We need to clean this in order to display the correct content to the user
     */
    let text = inputText
        .split('\n')
        .filter((line) => !line.startsWith('Subject:'))
        .join('\n')
        .trim();
    if (text.startsWith('Body:')) {
        text = text.substring('Body:'.length).trim();
    }
    return text;
};
