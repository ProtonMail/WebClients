import { apiHelper } from '@proton/encrypted-search/esHelpers';
import type { ESCiphertext } from '@proton/encrypted-search/models';
import { removeBase64 } from '@proton/mail-renderer/helpers/transforms/transformEscape';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { removeHTMLComments } from '@proton/shared/lib/helpers/string';
import type { Api } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import type { ESBaseMessage, ESMessage, ESMessageContent } from '../../models/encryptedSearch';
import { locateBlockquote } from '../message/messageBlockquote';
import { decryptMessage } from '../message/messageDecrypt';
import { queryMessage } from './esAPI';

enum CONTENT_VERSION {
    V1 = 1,
    // Stop using turndown to clean the HTML before storing it in the database
    DOM_INDEXING = 2,
    // Fix blockquote issue that was not removing HTML content
    BLOCKQUOTE_FIX = 3,
}

const getContentVersion = (): CONTENT_VERSION => {
    return CONTENT_VERSION.BLOCKQUOTE_FIX;
};

/**
 * Remove the specified tag from the given HTML element
 */
export const removeTag = (element: HTMLElement, tagName: string) => {
    let removeTag = true;
    while (removeTag) {
        const tagInstances = element.getElementsByTagName(tagName);
        const tagInstance = tagInstances.item(0);
        if (tagInstance) {
            tagInstance.remove();
        }
        removeTag = tagInstances.length !== 0;
    }
};

const prepareHTMLBody = (body: HTMLElement) => {
    // Remove hidden elements
    body.querySelectorAll('*').forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') {
            el.remove();
        }
    });

    // Replace block elements with newlines to preserve the text structure
    body.querySelectorAll(
        'address, article, aside, blockquote, canvas, dd, div, dl, dt, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, header, hr, li, main, nav, noscript, ol, p, pre, section, table, tfoot, ul, video, tr, td, th, tbody, thead, caption'
    ).forEach((el) => {
        el.insertAdjacentText('beforebegin', '\n');
    });

    body.querySelectorAll('br').forEach((el) => {
        el.textContent = '\n';
    });

    return body;
};

const getCleanMessageContent = (content: string) => {
    return content
        .replace(/[ \t]+/g, ' ') // Collapse spaces and tabs
        .replace(/\n\s+/g, '\n') // Remove whitespace after newlines
        .replace(/\n{2,}/g, '\n') // Collapse multiple newlines
        .trim();
};

/**
 * Remove quoted text and HTML tags from body
 */
export const cleanText = (text: string, includeQuote: boolean) => {
    const domParser = new DOMParser();

    // No need to add comments and b64 images to the ES cache
    const withoutComment = removeHTMLComments(text);
    const value = removeBase64(withoutComment);

    const doc = domParser.parseFromString(value, 'text/html');
    const { body } = doc;
    removeTag(body, 'style');
    removeTag(body, 'script');

    let finalBody = body;

    if (!includeQuote) {
        const [noQuoteContent] = locateBlockquote(body);
        finalBody = domParser.parseFromString(noQuoteContent, 'text/html').body;
    }

    const preparedBody = prepareHTMLBody(finalBody);
    return getCleanMessageContent(preparedBody.textContent || '');
};

/**
 * Turn a range of supersets of the ESBaseMessage interface into an ESBaseMessage object
 */
export const getBaseMessage = (message: Message | ESMessage) => {
    const baseMessage: ESBaseMessage = {
        ID: message.ID,
        ConversationID: message.ConversationID,
        Subject: message.Subject,
        Unread: message.Unread,
        Sender: message.Sender,
        Flags: message.Flags,
        AddressID: message.AddressID,
        IsReplied: message.IsReplied,
        IsRepliedAll: message.IsRepliedAll,
        IsForwarded: message.IsForwarded,
        ToList: message.ToList,
        CCList: message.CCList,
        BCCList: message.BCCList,
        Size: message.Size,
        NumAttachments: message.NumAttachments,
        ExpirationTime: message.ExpirationTime,
        LabelIDs: message.LabelIDs,
        Time: message.Time,
        Order: message.Order,
        AttachmentInfo: message.AttachmentInfo,
        SnoozeTime: message.SnoozeTime,
    };
    return baseMessage;
};

/**
 * Extract the ExternalID from the In-Reply-To header of the given message
 */
export const getExternalID = ({ ParsedHeaders }: Message) => {
    let ExternalID = ParsedHeaders['In-Reply-To'];

    if (typeof ExternalID === 'string') {
        if (ExternalID[0] === '<' && ExternalID[ExternalID.length - 1] === '>') {
            ExternalID = ExternalID.slice(1, ExternalID.length - 1);
        }
        return ExternalID;
    }
};

const EXTERNAL_ID_QUERY_CACHE = new Map<string, Promise<{ Total: number } | undefined>>();
const getExternalIdQueryKey = (ExternalID: string, ConversationID: string) => `${ExternalID}-${ConversationID}`;

/**
 * Check whether the given ExternalID exists in the given conversation
 */
export const externalIDExists = async (ExternalID: string, ConversationID: string, api: Api) => {
    const cacheKey = getExternalIdQueryKey(ExternalID, ConversationID);
    let promise = EXTERNAL_ID_QUERY_CACHE.get(cacheKey);

    if (!promise) {
        promise = apiHelper<{ Total: number }>({
            api,
            signal: undefined,
            options: {
                method: 'get',
                url: 'mail/v4/messages',
                params: {
                    ExternalID,
                    ConversationID,
                },
            },
            callingContext: 'externalIDExists',
        });
        EXTERNAL_ID_QUERY_CACHE.set(cacheKey, promise);
    }

    const response = await promise;

    return !!response && response.Total > 0;
};

/**
 * Check whether quoted content has to be indexed or not by checking
 * whether the ExternalID inside the given message's In-Reply-To header
 * exists in the user's mailbox
 */
const shouldIndexQuotedContent = async (message: Message, api: Api) => {
    const ExternalID = getExternalID(message);

    if (typeof ExternalID === 'string') {
        return !(await externalIDExists(ExternalID, message.ConversationID, api));
    }

    return true;
};

/**
 * Fetches a message and return a ESMessage
 */
export const fetchMessage = async (
    messageID: string,
    api: Api,
    getMessageKeys: GetMessageKeys,
    signal?: AbortSignal
): Promise<{ content?: ESMessageContent; error?: any }> => {
    try {
        const message = await queryMessage(api, messageID, signal);
        if (!message) {
            return { error: new Error('Message not found') };
        }

        const keys = await getMessageKeys(message);
        const decryptionResult = await decryptMessage(message, keys.decryptionKeys);

        let decryptedSubject: string | undefined;
        let decryptedBody: string | undefined;
        let mimetype: MIME_TYPES | undefined;
        if (!decryptionResult.errors) {
            ({ decryptedSubject, decryptedBody, mimetype } = decryptionResult);
        } else {
            // Decryption can legitimately fail if there are inactive keys. In this
            // case the above three variables are left undefined
            return { content: {} };
        }

        const includeQuote = await shouldIndexQuotedContent(message, api);

        const cleanDecryptedBody =
            typeof decryptedBody === 'string'
                ? (mimetype || message.MIMEType) === MIME_TYPES.DEFAULT
                    ? cleanText(decryptedBody, includeQuote)
                    : decryptedBody
                : undefined;

        return {
            content: {
                decryptedBody: cleanDecryptedBody,
                decryptedSubject,
                version: getContentVersion(),
            },
        };
    } catch (error: any) {
        return { error };
    }
};

export const prepareCiphertext = (itemToStore: ESMessage, aesGcmCiphertext: ESCiphertext) => {
    const { ID, Time, Order, LabelIDs } = itemToStore;
    return {
        ID,
        Time,
        Order,
        LabelIDs,
        aesGcmCiphertext,
    };
};
