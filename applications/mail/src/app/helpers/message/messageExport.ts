import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { arrayToBinaryString, encodeBase64 } from '@proton/crypto/lib/utils';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type {
    MessageKeys,
    MessageState,
    MessageStateWithData,
    PublicPrivateKey,
} from '@proton/mail/store/messages/messagesTypes';
import { createDraft, updateDraft } from '@proton/shared/lib/api/messages';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import type { Api } from '@proton/shared/lib/interfaces';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import type { CREATE_DRAFT_MESSAGE_ACTION } from '@proton/shared/lib/interfaces/message';
import { getAttachments, isPlainText } from '@proton/shared/lib/mail/messages';
import { getSessionKey } from '@proton/shared/lib/mail/send/attachments';

import type { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import type { DecryptedAttachment } from '../../store/attachments/attachmentsTypes';
import { combineHeaders, splitMail } from '../mail';
import { constructMimeFromSource } from '../send/sendMimeBuilder';
import { getPlainTextContent } from './messageContent';
import { insertActualEmbeddedImages } from './messageEmbeddeds';
import { replaceProxyWithOriginalURLAttributes } from './messageImages';

const removePasswordFromRequests: Pick<Message, 'Password' | 'PasswordHint'> = {
    Password: undefined,
    PasswordHint: undefined,
};

const restorePasswordFromResults = (
    resultMessage: Message,
    originalMessage: Pick<Message, 'Password' | 'PasswordHint'>
): Message => ({
    ...resultMessage,
    Password: originalMessage.Password,
    PasswordHint: originalMessage.PasswordHint,
});

export const prepareExport = (message: MessageState) => {
    if (!message.messageDocument?.document) {
        return '';
    }

    const document = message.messageDocument.document.cloneNode(true) as Element;

    // Using create element will create a DOM element that will not be added to the window's document, but images will be loaded
    // Use a DOMParser instead so that images are not loaded.
    const dom = parseStringToDOM(document.innerHTML);

    // Embedded images
    insertActualEmbeddedImages(dom.body);

    // Clean remote images
    return replaceProxyWithOriginalURLAttributes(message, dom.body);
};

const encryptBody = async (content: string, messageKeys: PublicPrivateKey) => {
    const { message: data } = await CryptoProxy.encryptMessage({
        textData: content,
        stripTrailingSpaces: true,
        encryptionKeys: messageKeys.encryptionKey,
        signingKeys: messageKeys.signingKeys,
    });

    return data;
};

export const prepareAndEncryptBody = async (message: MessageState, messageKeys: MessageKeys) => {
    const plainText = isPlainText(message.data);
    const content = plainText ? getPlainTextContent(message) : prepareExport(message);
    return encryptBody(content, messageKeys as PublicPrivateKey);
};

export const encryptAttachmentKeyPackets = async (
    attachments: Attachment[],
    previousAddressDecryptionKeys: PrivateKeyReference[] = [],
    newAddressEncryptionKey: PublicKeyReference,
    messageFlags?: number
) => {
    return Object.fromEntries(
        await Promise.all(
            attachments
                .filter(({ ID = '' }) => ID.indexOf('PGPAttachment'))
                .map(async (attachment) => {
                    const sessionKey = await getSessionKey(attachment, previousAddressDecryptionKeys, messageFlags);
                    const encryptedSessionKey = await CryptoProxy.encryptSessionKey({
                        data: sessionKey.data,
                        algorithm: sessionKey.algorithm,
                        encryptionKeys: newAddressEncryptionKey,
                        format: 'binary',
                    });
                    return [attachment.ID || '', encodeBase64(arrayToBinaryString(encryptedSessionKey))];
                })
        )
    );
};

export const createMessage = async (
    message: MessageStateWithData,
    api: Api,
    getMessageKeys: GetMessageKeys
): Promise<Message> => {
    const messageKeys = await getMessageKeys(message.data);
    const Body = await prepareAndEncryptBody(message, messageKeys);
    const attachments = getAttachments(message.data);

    let AttachmentKeyPackets;
    if (attachments?.length) {
        const originalMessageKeys = await getMessageKeys({
            AddressID: message.draftFlags?.originalAddressID || message.data?.AddressID,
        });
        AttachmentKeyPackets = await encryptAttachmentKeyPackets(
            attachments,
            originalMessageKeys.decryptionKeys,
            messageKeys.encryptionKey,
            message.draftFlags?.originalMessageFlags
        );
    }

    const getMessageAction = (action: MESSAGE_ACTIONS | undefined): CREATE_DRAFT_MESSAGE_ACTION | undefined => {
        if (action !== MESSAGE_ACTIONS.NEW && action !== undefined) {
            return action as unknown as CREATE_DRAFT_MESSAGE_ACTION;
        }

        return undefined;
    };

    const { Message: updatedMessage } = await api(
        createDraft({
            Action: getMessageAction(message.draftFlags?.action),
            Message: { ...message.data, Body, ...removePasswordFromRequests },
            ParentID: message.draftFlags?.ParentID,
            AttachmentKeyPackets,
        })
    );

    return restorePasswordFromResults(updatedMessage, message.data);
};

/**
 * Update an already existing message by encrypting it then send the API request to the API
 * @param message The message to update containing the right keys related to the address
 * @param senderHasChanged Things are different if the sender has changed since the last version
 * @param previousAddressPrivateKeys Only needed if senderHasChanged to decrypt attachments sessionKeys and re-encrypt with the new address key
 * @param api Api handler to use
 */
export const updateMessage = async (
    message: MessageStateWithData,
    previousAddressID: string,
    api: Api,
    getMessageKeys: GetMessageKeys
): Promise<Message> => {
    const messageKeys = await getMessageKeys(message.data);
    const Body = await prepareAndEncryptBody(message, messageKeys);
    const attachments = getAttachments(message.data);
    let AttachmentKeyPackets;
    if (attachments?.length && previousAddressID !== message.data.AddressID) {
        const previousMessageKeys = await getMessageKeys({ AddressID: previousAddressID });
        AttachmentKeyPackets = await encryptAttachmentKeyPackets(
            attachments,
            previousMessageKeys.decryptionKeys,
            messageKeys.encryptionKey
        );
    }
    const { Message: updatedMessage } = await api({
        ...updateDraft(message.data?.ID, {
            Message: { ...message.data, Body, ...removePasswordFromRequests },
            AttachmentKeyPackets,
        }),
        silence: true,
    });

    return restorePasswordFromResults(updatedMessage, message.data);
};

/**
 * Prepare a message a blob to download
 * Use mime format, don't encrypt,
 */
export const exportBlob = async (
    message: MessageState,
    messageKeys: MessageKeys,
    getAttachment: (ID: string) => DecryptedAttachment | undefined,
    onUpdateAttachment: (ID: string, attachment: DecryptedAttachment) => void,
    api: Api
) => {
    const mimeMessage = await constructMimeFromSource(message, messageKeys, getAttachment, onUpdateAttachment, api);
    const { body, headers: mimeHeaders } = splitMail(mimeMessage);
    const headers = await combineHeaders(message.data?.Header || '', mimeHeaders);

    return new Blob([`${headers}\r\n${body}`], {
        type: 'data:text/plain;charset=utf-8;',
    });
};
