import { CachedItem, ESCache, isTimepointSmaller } from '@proton/encrypted-search';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Api } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import { ESBaseMessage, ESMessage, ESMessageContent } from '../../models/encryptedSearch';
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
const cleanText = (text: string, removeQuote: boolean) => {
    const domParser = new DOMParser();

    const { body } = domParser.parseFromString(text, 'text/html');
    removeTag(body, 'style');
    removeTag(body, 'script');

    let content = body.innerHTML;
    if (removeQuote) {
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
    };
    return baseMessage;
};

/**
 * Check whether a message is first in its conversation, i.e. whether it is
 * the oldest among all messages in the conversation
 */
const isFirst = (message: Message, esCache: Map<string, CachedItem<ESBaseMessage, unknown>>) => {
    const { ConversationID, Time, Order, ID } = message;
    const timepoint: [number, number] = [Time, Order];

    const values = esCache.values();
    let value = values.next();

    while (!value.done) {
        const { metadata } = value.value;
        if (
            metadata.ConversationID === ConversationID &&
            metadata.ID !== ID &&
            isTimepointSmaller([metadata.Time, metadata.Order], timepoint)
        ) {
            return false;
        }
        value = values.next();
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
    signal?: AbortSignal,
    esCacheRef?: React.MutableRefObject<ESCache<ESBaseMessage, unknown>>
): Promise<ESMessageContent | undefined> => {
    const message = await queryMessage(api, messageID, signal);
    if (!message) {
        throw new Error('Message fetching failed');
    }

    let decryptedSubject: string | undefined;
    let decryptedBody: string | undefined;
    let mimetype: MIME_TYPES | undefined;
    try {
        const keys = await getMessageKeys(message);
        const decryptionResult = await decryptMessage(message, keys.privateKeys, undefined);
        if (!decryptionResult.errors) {
            ({ decryptedSubject, decryptedBody, mimetype } = decryptionResult);
        }
    } catch (error: any) {
        // Decryption can legitimately fail if there are inactive keys. In this
        // case the above three variables are left undefined
        return;
    }

    // Quotes are removed for all messages that are not first in their conversation
    const removeQuote = !!esCacheRef && !isFirst(message, esCacheRef.current.esCache);

    const cleanDecryptedBody =
        typeof decryptedBody === 'string'
            ? (mimetype || message.MIMEType) === MIME_TYPES.DEFAULT
                ? cleanText(decryptedBody, removeQuote)
                : decryptedBody
            : undefined;

    const content: ESMessageContent = {
        decryptedBody: cleanDecryptedBody,
        decryptedSubject,
    };

    if (typeof content.decryptedBody === 'string' || typeof content.decryptedSubject === 'string') {
        return content;
    }
};
