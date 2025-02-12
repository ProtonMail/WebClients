import type { AesGcmCiphertext } from '@proton/encrypted-search';
import { apiHelper } from '@proton/encrypted-search';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import type { ESBaseMessage, ESMessage, ESMessageContent } from '../../models/encryptedSearch';
import { locateBlockquote } from '../message/messageBlockquote';
import { decryptMessage } from '../message/messageDecrypt';
import { toText } from '../parserHtml';
import { queryMessage } from './esAPI';

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

/**
 * Remove quoted text and HTML tags from body
 */
export const cleanText = (text: string, includeQuote: boolean) => {
    const domParser = new DOMParser();

    const { body } = domParser.parseFromString(text, 'text/html');
    removeTag(body, 'style');
    removeTag(body, 'script');

    let content = body.innerHTML;
    if (!includeQuote) {
        const [noQuoteContent] = locateBlockquote(body);
        content = noQuoteContent;
    }

    // Introduce new lines after every div, because the toText function joins
    // the content of consecutive divs together and this might introduce
    // unwanted matches. Then remove redundant consecutive new lines
    return toText(content.replaceAll('</div>', '</div><br>'))
        .replace(/\n{2,}/g, '\n')
        .trim();
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
        promise = apiHelper<{ Total: number }>(
            api,
            undefined,
            {
                method: 'get',
                url: 'mail/v4/messages',
                params: {
                    ExternalID,
                    ConversationID,
                },
            },
            'externalIDExists'
        );
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
            },
        };
    } catch (error: any) {
        return { error };
    }
};

export const prepareCiphertext = (itemToStore: ESMessage, aesGcmCiphertext: AesGcmCiphertext) => {
    const { ID, Time, Order, LabelIDs } = itemToStore;
    return {
        ID,
        Time,
        Order,
        LabelIDs,
        aesGcmCiphertext,
    };
};
