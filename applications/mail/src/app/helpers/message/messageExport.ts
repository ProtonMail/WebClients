import {
    encryptSessionKey,
    encryptMessage,
    OpenPGPKey,
    encodeBase64,
    arrayToBinaryString,
    DecryptResultPmcrypto,
} from 'pmcrypto';
import { createDraft, updateDraft } from '@proton/shared/lib/api/messages';
import { Api } from '@proton/shared/lib/interfaces';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getAttachments, isPlainText } from '@proton/shared/lib/mail/messages';
import { getSessionKey } from '@proton/shared/lib/mail/send/attachments';
import { getDocumentContent, getPlainTextContent } from './messageContent';
import { constructMimeFromSource } from '../send/sendMimeBuilder';
import { splitMail, combineHeaders } from '../mail';
import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import { MESSAGE_ACTIONS } from '../../constants';
import { restoreAllPrefixedAttributes } from './messageImages';
import { insertActualEmbeddedImages } from './messageEmbeddeds';
import { MessageKeys, MessageState, MessageStateWithData, PublicPrivateKey } from '../../logic/messages/messagesTypes';

const removePasswordFromRequests: Pick<Message, 'Password' | 'PasswordHint'> = {
    Password: undefined,
    PasswordHint: undefined,
};

const restorePasswordFromResults = (resultMessage: Message, originalMessage: Message): Message => ({
    ...resultMessage,
    Password: originalMessage.Password,
    PasswordHint: originalMessage.PasswordHint,
});

export const prepareExport = (message: MessageState) => {
    if (!message.messageDocument?.document) {
        return '';
    }

    const document = message.messageDocument.document.cloneNode(true) as Element;

    // Embedded images
    insertActualEmbeddedImages(document);

    let content = getDocumentContent(document);

    // Remote images
    content = restoreAllPrefixedAttributes(content);

    return content;
};

const encryptBody = async (content: string, messageKeys: PublicPrivateKey) => {
    const publicKeys = messageKeys.publicKeys.slice(0, 1);
    const privateKeys = messageKeys.privateKeys.slice(0, 1);

    const { data } = await encryptMessage({
        data: content,
        publicKeys,
        privateKeys,
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
    previousAddressPrivateKeys: OpenPGPKey[] = [],
    newAddressPublicKeys: OpenPGPKey[] = []
) => {
    return Object.fromEntries(
        await Promise.all(
            attachments
                .filter(({ ID = '' }) => ID.indexOf('PGPAttachment'))
                .map(async (attachment) => {
                    const sessionKey = await getSessionKey(attachment, previousAddressPrivateKeys);
                    const result = await encryptSessionKey({
                        data: sessionKey.data,
                        algorithm: sessionKey.algorithm,
                        publicKeys: newAddressPublicKeys,
                    });
                    return [
                        attachment.ID || '',
                        encodeBase64(arrayToBinaryString(result.message.packets.write() as Uint8Array)),
                    ];
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
            originalMessageKeys.privateKeys,
            messageKeys.publicKeys
        );
    }

    const { Message: updatedMessage } = await api(
        createDraft({
            Action: message.draftFlags?.action !== MESSAGE_ACTIONS.NEW ? message.draftFlags?.action : undefined,
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
            previousMessageKeys.privateKeys,
            messageKeys.publicKeys
        );
    }
    const { Message: updatedMessage } = await api({
        ...updateDraft(
            message.data?.ID,
            { ...message.data, Body, ...removePasswordFromRequests },
            AttachmentKeyPackets
        ),
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
    getAttachment: (ID: string) => DecryptResultPmcrypto | undefined,
    onUpdateAttachment: (ID: string, attachment: DecryptResultPmcrypto) => void,
    api: Api
) => {
    const mimeMessage = await constructMimeFromSource(message, messageKeys, getAttachment, onUpdateAttachment, api);
    const { body, headers: mimeHeaders } = splitMail(mimeMessage);
    const headers = await combineHeaders(message.data?.Header || '', mimeHeaders);

    return new Blob([`${headers}\r\n${body}`], {
        type: 'data:text/plain;charset=utf-8;',
    });
};
