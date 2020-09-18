import { encryptSessionKey, encryptMessage, OpenPGPKey, encodeBase64, arrayToBinaryString } from 'pmcrypto';
import { enums } from 'openpgp';
import { createDraft, updateDraft } from 'proton-shared/lib/api/messages';
import { Api } from 'proton-shared/lib/interfaces';

import { MESSAGE_ACTIONS } from '../../constants';
import { MessageExtended, Message } from '../../models/message';
import { mutateHTMLCid } from '../embedded/embeddedParser';
import { find } from '../embedded/embeddedFinder';
import { isPlainText, getAttachments } from './messages';
import { getDocumentContent, getPlainTextContent } from './messageContent';
import { getSessionKey } from '../attachment/attachmentLoader';
import { constructMime } from '../send/sendMimeBuilder';
import { splitMail, combineHeaders } from '../mail';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { parseInDiv } from '../../helpers/dom';
import { Attachment } from '../../models/attachment';

export const prepareExport = (message: MessageExtended) => {
    if (!message.document) {
        return;
    }

    const document = message.document.cloneNode(true) as Element;
    const embeddeds = find(message, document);
    mutateHTMLCid(embeddeds, document);

    return document;
};

const encryptBody = async (content: string, publicKeys?: OpenPGPKey[], privateKeys?: OpenPGPKey[]) => {
    const { data } = await encryptMessage({
        data: content,
        publicKeys: [publicKeys?.[0]] as OpenPGPKey[],
        privateKeys: [privateKeys?.[0]] as OpenPGPKey[],
        // format: 'utf8',
        compression: enums.compression.zip
    });

    return data;
};

export const prepareAndEncryptBody = async (message: MessageExtended) => {
    const plainText = isPlainText(message.data);
    const document = plainText ? undefined : prepareExport(message);
    const content = plainText ? getPlainTextContent(message) : getDocumentContent(document);
    const encrypted = await encryptBody(content, message.publicKeys, message.privateKeys);
    return { document, content, encrypted };
};

export const encryptAttachmentKeyPackets = async (
    attachments: Attachment[],
    previousAddressPrivateKeys: OpenPGPKey[] = [],
    newAddressPublicKeys: OpenPGPKey[] = []
) => {
    const packets: { [key: string]: string } = {};

    await Promise.all(
        attachments
            .filter(({ ID = '' }) => ID.indexOf('PGPAttachment'))
            .map(async (attachment) => {
                const sessionKey = await getSessionKey(attachment, previousAddressPrivateKeys);
                const result = await encryptSessionKey({
                    data: sessionKey.data,
                    algorithm: sessionKey.algorithm,
                    publicKeys: newAddressPublicKeys
                });
                packets[attachment.ID || ''] = encodeBase64(
                    arrayToBinaryString(result.message.packets.write() as Uint8Array)
                );
            })
    );

    return packets;
};

export const createMessage = async (message: MessageExtended, api: Api): Promise<Message> => {
    const { encrypted: Body } = await prepareAndEncryptBody(message);
    const AttachmentKeyPackets = await encryptAttachmentKeyPackets(
        getAttachments(message.data),
        message.privateKeys,
        message.publicKeys
    );
    const { Message: updatedMessage } = await api(
        createDraft({
            Action: message.action !== MESSAGE_ACTIONS.NEW ? message.action : undefined,
            Message: { ...message.data, Body },
            ParentID: message.ParentID,
            AttachmentKeyPackets
        } as any)
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
    message: MessageExtended,
    senderHasChanged: boolean,
    previousAddressPrivateKeys: OpenPGPKey[],
    api: Api
): Promise<Message> => {
    const { encrypted: Body } = await prepareAndEncryptBody(message);
    const AttachmentKeyPackets = senderHasChanged
        ? await encryptAttachmentKeyPackets(
              getAttachments(message.data),
              previousAddressPrivateKeys,
              message.publicKeys
          )
        : undefined;
    const { Message: updatedMessage } = await api(
        updateDraft(message.data?.ID, { ...message.data, Body }, AttachmentKeyPackets)
    );
    return updatedMessage;
};

/**
 * Prepare a message a blob to download
 * Use mime format, don't encrypt,
 */
export const exportBlob = async (message: MessageExtended, attachmentsCache: AttachmentsCache, api: Api) => {
    const document = parseInDiv(message.decryptedBody || '');
    const mimeMessage = await constructMime({ ...message, document }, attachmentsCache, api, false);
    const { body, headers: mimeHeaders } = splitMail(mimeMessage);
    const headers = await combineHeaders(message.data?.Header || '', mimeHeaders);

    return new Blob([`${headers}\r\n${body}`], {
        type: 'data:text/plain;charset=utf-8;'
    });
};
