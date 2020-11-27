import { encryptSessionKey, encryptMessage, OpenPGPKey, encodeBase64, arrayToBinaryString } from 'pmcrypto';
import { enums } from 'openpgp';
import { createDraft, updateDraft } from 'proton-shared/lib/api/messages';
import { Api } from 'proton-shared/lib/interfaces';
import { Attachment, Message } from 'proton-shared/lib/interfaces/mail/Message';
import { getAttachments, isPlainText } from 'proton-shared/lib/mail/messages';
import { getSessionKey } from 'proton-shared/lib/mail/send/attachments';
import { MESSAGE_ACTIONS } from '../../constants';
import { MessageExtended, MessageExtendedWithData, MessageKeys } from '../../models/message';
import { mutateHTMLCid } from '../embedded/embeddedParser';
import { find } from '../embedded/embeddedFinder';
import { getDocumentContent, getPlainTextContent } from './messageContent';
import { constructMimeFromSource } from '../send/sendMimeBuilder';
import { splitMail, combineHeaders } from '../mail';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';

export const prepareExport = (message: MessageExtended) => {
    if (!message.document) {
        return;
    }

    const document = message.document.cloneNode(true) as Element;
    const embeddeds = find(message, document);
    mutateHTMLCid(embeddeds, document);

    return document;
};

const encryptBody = async (content: string, messageKeys: MessageKeys) => {
    const { data } = await encryptMessage({
        data: content,
        publicKeys: [messageKeys.publicKeys?.[0]],
        privateKeys: [messageKeys.privateKeys?.[0]],
        compression: enums.compression.zip,
    });

    return data;
};

export const prepareAndEncryptBody = async (message: MessageExtended, messageKeys: MessageKeys) => {
    const plainText = isPlainText(message.data);
    const document = plainText ? undefined : prepareExport(message);
    const content = plainText ? getPlainTextContent(message) : getDocumentContent(document);
    const encrypted = await encryptBody(content, messageKeys);
    return { document, content, encrypted };
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
    message: MessageExtendedWithData,
    api: Api,
    getMessageKeys: GetMessageKeys
): Promise<Message> => {
    const messageKeys = await getMessageKeys(message.data);
    const { encrypted: Body } = await prepareAndEncryptBody(message, messageKeys);
    const attachments = getAttachments(message.data);

    let AttachmentKeyPackets;
    if (attachments?.length && message.originalAddressID && message.originalAddressID !== message.data.AddressID) {
        const originalMessageKeys = await getMessageKeys({ AddressID: message.originalAddressID });
        AttachmentKeyPackets = await encryptAttachmentKeyPackets(
            attachments,
            originalMessageKeys.privateKeys,
            messageKeys.publicKeys
        );
    }
    const { Message: updatedMessage } = await api(
        createDraft({
            Action: message.action !== MESSAGE_ACTIONS.NEW ? message.action : undefined,
            Message: { ...message.data, Body },
            ParentID: message.ParentID,
            AttachmentKeyPackets,
        })
    );
    return updatedMessage;
};

/**
 * Update an already existing message by encrypting it then send the API request to the API
 * @param message The message to update containing the right keys related to the address
 * @param senderHasChanged Things are different if the sender has changed since the last version
 * @param previousAddressPrivateKeys Only needed if senderHasChanged to decrypt attachments sessionKeys and re-encrypt with the new address key
 * @param api Api handler to use
 */
export const updateMessage = async (
    message: MessageExtendedWithData,
    previousAddressID: string,
    api: Api,
    getMessageKeys: GetMessageKeys
): Promise<Message> => {
    const messageKeys = await getMessageKeys(message.data);
    const { encrypted: Body } = await prepareAndEncryptBody(message, messageKeys);
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
    const { Message: updatedMessage } = await api(
        updateDraft(message.data?.ID, { ...message.data, Body }, AttachmentKeyPackets)
    );
    return updatedMessage;
};

/**
 * Prepare a message a blob to download
 * Use mime format, don't encrypt,
 */
export const exportBlob = async (
    message: MessageExtended,
    messageKeys: MessageKeys,
    attachmentsCache: AttachmentsCache,
    api: Api
) => {
    const mimeMessage = await constructMimeFromSource(message, messageKeys, attachmentsCache, api);
    const { body, headers: mimeHeaders } = splitMail(mimeMessage);
    const headers = await combineHeaders(message.data?.Header || '', mimeHeaders);

    return new Blob([`${headers}\r\n${body}`], {
        type: 'data:text/plain;charset=utf-8;',
    });
};
