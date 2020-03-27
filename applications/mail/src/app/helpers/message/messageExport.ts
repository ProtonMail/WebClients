import { encryptSessionKey, encryptMessage, OpenPGPKey, encodeBase64, arrayToBinaryString } from 'pmcrypto';
import { enums } from 'openpgp';
import { c } from 'ttag';
import { createDraft, updateDraft } from 'proton-shared/lib/api/messages';
import { Api } from 'proton-shared/lib/interfaces';

import { MessageExtended, Message } from '../../models/message';
import { mutateHTMLCid } from '../embedded/embeddedParser';
import { find } from '../embedded/embeddedFinder';
import { MESSAGE_ACTIONS } from '../../constants';
import { isPlainText, getAttachments } from './messages';
import { getDocumentContent, getContent, getPlainTextContent } from './messageContent';
import { getSessionKey } from '../attachment/attachmentLoader';
import { wait } from 'proton-shared/lib/helpers/promise';

const prepareExport = (message: MessageExtended) => {
    if (!message.document) {
        return;
    }

    const document = message.document.cloneNode(true) as Element;

    find(message, document);
    mutateHTMLCid(message.embeddeds, document);

    return document;
};

const encryptBody = async (content: string, publicKeys?: OpenPGPKey[], privateKeys?: OpenPGPKey[]) => {
    const { data } = await encryptMessage({
        data: content,
        publicKeys: [publicKeys?.[0]] as OpenPGPKey[],
        privateKeys: privateKeys,
        // format: 'utf8',
        compression: enums.compression.zip
    });

    return data;
};

export const prepareAndEncryptBody = async (message: MessageExtended) => {
    const plainText = isPlainText(message.data);
    const document = plainText ? undefined : prepareExport(message);
    const content = plainText ? getPlainTextContent(message) : getDocumentContent(document);
    const encrypted = await encryptBody(getContent(message), message.publicKeys, message.privateKeys);
    return { document, content, encrypted };
};

const encryptAttachmentKeyPackets = async (message: MessageExtended, passwords = []) => {
    const packets: { [key: string]: string } = {};
    const Attachments = getAttachments(message.data);

    await Promise.all(
        Attachments.filter(({ ID = '' }) => ID.indexOf('PGPAttachment')).map(async (attachment) => {
            const sessionKey = await getSessionKey(attachment, message);

            const result = await encryptSessionKey({
                data: sessionKey.data,
                algorithm: sessionKey.algorithm,
                publicKeys: message.publicKeys,
                passwords
            });

            packets[attachment.ID || ''] = encodeBase64(
                arrayToBinaryString(result.message.packets.write() as Uint8Array)
            );
        })
    );

    return packets;
};

export const createMessage = async (
    message: MessageExtended,
    api: Api,
    updateStatus: (status: string) => void
): Promise<Message> => {
    updateStatus(c('Info').t`Encrypting`);
    const { encrypted: Body } = await prepareAndEncryptBody(message);
    const AttachmentKeyPackets = await encryptAttachmentKeyPackets(message);
    updateStatus(c('Info').t`Saving`);
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

export const updateMessage = async (
    message: MessageExtended,
    api: Api,
    updateStatus: (status: string) => void
): Promise<Message> => {
    updateStatus(c('Info').t`Encrypting`);
    const { encrypted: Body } = await prepareAndEncryptBody(message);
    updateStatus(c('Info').t`Saving`);
    await wait(2000);
    const { Message: updatedMessage } = await api(updateDraft(message.data?.ID, { ...message.data, Body }));
    return updatedMessage;
};
