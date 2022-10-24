import { AesGcmCiphertext } from '@proton/encrypted-search';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Api } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { localisedForwardFlags } from '../../constants';
import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import { ESBaseMessage, ESMessage } from '../../models/encryptedSearch';
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
 * Turns a Message into a ESBaseMessage
 */
const prepareMessageMetadata = (message: Message | ESMessage) => {
    const messageForSearch: ESBaseMessage = {
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
        DisplaySenderImage: message.DisplaySenderImage,
    };
    return messageForSearch;
};

/**
 * Compare the subject to a set of known translations of the Fw: flag and decide
 * if the message is a forwarded one
 */
export const isMessageForwarded = (subject: string | undefined) => {
    if (!subject) {
        return false;
    }
    return localisedForwardFlags.some((fwFlag) => subject.slice(0, fwFlag.length).toLocaleLowerCase() === fwFlag);
};

/**
 * Fetches a message and return a ESMessage
 */
export const fetchMessage = async (
    messageID: string,
    api: Api,
    getMessageKeys: GetMessageKeys,
    signal?: AbortSignal
): Promise<ESMessage | undefined> => {
    const message = await queryMessage(api, messageID, signal);
    if (!message) {
        return;
    }

    let decryptedSubject: string | undefined;
    let decryptedBody: string | undefined;
    let decryptionError = true;
    let mimetype: MIME_TYPES | undefined;
    try {
        const keys = await getMessageKeys(message);
        const decryptionResult = await decryptMessage(message, keys.privateKeys, undefined);
        if (!decryptionResult.errors) {
            ({ decryptedSubject, decryptedBody, mimetype } = decryptionResult);
            decryptionError = false;
        }
    } catch (error: any) {
        // Decryption can legitimately fail if there are inactive keys. In this
        // case the above three variables are left undefined
    }

    // Quotes are removed for all sent messages, and all other messages apart from forwarded ones
    const removeQuote = message.LabelIDs.includes('2') || !isMessageForwarded(message.Subject);

    const cleanDecryptedBody =
        typeof decryptedBody === 'string'
            ? (mimetype || message.MIMEType) === MIME_TYPES.DEFAULT
                ? cleanText(decryptedBody, removeQuote)
                : decryptedBody
            : undefined;

    const cachedMessage: ESMessage = {
        ...prepareMessageMetadata(message),
        decryptedBody: cleanDecryptedBody,
        decryptedSubject,
        decryptionError,
    };

    return cachedMessage;
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
