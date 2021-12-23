import { OpenPGPKey } from 'pmcrypto';
import { uploadAttachment } from '@proton/shared/lib/api/attachments';
import { readFileAsBuffer } from '@proton/shared/lib/helpers/file';
import { generateProtonWebUID } from '@proton/shared/lib/helpers/uid';
import { Packets } from '@proton/shared/lib/interfaces/mail/crypto';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getAttachments } from '@proton/shared/lib/mail/messages';
import { encryptAttachment } from '@proton/shared/lib/mail/send/attachments';
import generateUID from '@proton/shared/lib/helpers/generateUID';
import { c } from 'ttag';
import {
    ATTACHMENT_MAX_SIZE,
    MESSAGE_ALREADY_SENT_INTERNAL_ERROR,
    UPLOAD_ATTACHMENT_ERROR_CODES,
} from '../../constants';
import { generateCid, isEmbeddable } from '../message/messageEmbeddeds';
import { RequestParams, upload as uploadHelper, Upload } from '../upload';
import { MessageState, MessageStateWithData, PublicPrivateKey } from '../../logic/messages/messagesTypes';

// Reference: Angular/src/app/attachments/factories/attachmentModel.js

type UploadQueryResult = Promise<{
    Code: number;
    Attachment: Attachment;
    Error?: string;
}>;

export enum ATTACHMENT_ACTION {
    ATTACHMENT = 'attachment',
    INLINE = 'inline',
}

export interface UploadResult {
    attachment: Attachment;
    packets: Packets;
    addressID: string; // The addressID used to encrypt packets
}

/**
 * Read the file locally, and encrypt it. return the encrypted file.
 */
export const encryptFile = async (file: File, inline: boolean, pubKeys: OpenPGPKey[], privKey?: OpenPGPKey[]) => {
    if (!file) {
        throw new TypeError(c('Error').t`You did not provide a file.`);
    }
    try {
        const result = await readFileAsBuffer(file);
        return await encryptAttachment(new Uint8Array(result), file, inline, pubKeys, privKey);
    } catch (e: any) {
        throw new Error(c('Error').t`Failed to encrypt attachment. Please try again.`);
    }
};

/**
 * Add a new attachment, upload it to the server
 */
const uploadFile = (
    file: File,
    message: MessageStateWithData,
    messageKeys: PublicPrivateKey,
    inline: boolean,
    uid: string,
    cid = ''
): Upload<UploadResult> => {
    const titleImage = c('Title').t`Image`;

    const filename = file.name || `${titleImage} ${getAttachments(message.data).length + 1}`;
    const ContentID = inline ? cid || generateCid(generateProtonWebUID(), message.data?.Sender?.Address || '') : '';

    const publicKeys = messageKeys.publicKeys && messageKeys.publicKeys.length > 0 ? [messageKeys.publicKeys[0]] : [];
    const privateKeys =
        messageKeys.privateKeys && messageKeys.privateKeys.length > 0 ? [messageKeys.privateKeys[0]] : [];

    let packets: Packets;

    const getParams = async () => {
        packets = await encryptFile(file, inline, publicKeys, privateKeys);

        return uploadAttachment({
            Filename: packets.Filename || filename,
            MessageID: message.data.ID,
            ContentID,
            MIMEType: packets.MIMEType,
            KeyPackets: new Blob([packets.keys]),
            DataPacket: new Blob([packets.data]),
            Signature: packets.signature ? new Blob([packets.signature]) : undefined,
        }) as RequestParams;
    };

    const upload = uploadHelper(uid, getParams()) as Upload<UploadQueryResult>;

    const attachPackets = async () => {
        const result = await upload.resultPromise;

        if (result.Code === UPLOAD_ATTACHMENT_ERROR_CODES.MESSAGE_ALREADY_SENT) {
            throw new Error(MESSAGE_ALREADY_SENT_INTERNAL_ERROR);
        }

        return { attachment: result.Attachment, packets, addressID: message.data.AddressID };
    };

    return {
        ...upload,
        resultPromise: attachPackets(),
    };
};

const buildHeaders = ({ Inline }: Packets, message: MessageStateWithData) => {
    if (!Inline) {
        return {};
    }

    const cid = generateCid(generateProtonWebUID(), message.data?.Sender?.Address || '');
    return {
        'content-disposition': 'inline',
        'content-id': cid,
    };
};

const packetToAttachment = (packet: Packets, message: MessageStateWithData) => {
    return {
        ID: generateUID('att'),
        Name: packet.Filename,
        Size: packet.FileSize,
        MIMEType: packet.MIMEType,
        KeyPackets: new Blob([packet.keys]),
        DataPacket: new Blob([packet.data]),
        Preview: packet.Preview,
        Headers: buildHeaders(packet, message),
    };
};

/**
 * Add a new EO attachment
 */
const uploadEOFile = (
    file: File,
    message: MessageStateWithData,
    publicKeys: OpenPGPKey[],
    inline: boolean
): Promise<{ attachment: Attachment; packets: Packets }> => {
    const getAttachment = async () => {
        const packets = (await encryptFile(file, inline, publicKeys)) as Packets;

        return { attachment: packetToAttachment(packets, message) as Attachment, packets };
    };

    return getAttachment();
};

/**
 * Upload a list of attachments [...File]
 */
export const upload = (
    files: File[] = [],
    message: MessageStateWithData,
    messageKeys: PublicPrivateKey,
    action = ATTACHMENT_ACTION.ATTACHMENT,
    uid: string,
    cid = ''
): Upload<UploadResult>[] => {
    return files.map((file) => {
        const inline = isEmbeddable(file.type) && action === ATTACHMENT_ACTION.INLINE;
        return uploadFile(file, message, messageKeys, inline, uid, cid);
    });
};

export const uploadEO = (
    file: File,
    message: MessageStateWithData,
    publicKey: OpenPGPKey[],
    action = ATTACHMENT_ACTION.ATTACHMENT
) => {
    const inline = isEmbeddable(file.type) && action === ATTACHMENT_ACTION.INLINE;
    return uploadEOFile(file, message, publicKey, inline);
};

/**
 * Is current attachments plus eventual files to upload will exceed the max size
 */
export const isSizeExceeded = (message: MessageState, files: File[] = []) => {
    const attachments = getAttachments(message.data);
    const attachmentsSize = attachments.reduce((acc, attachment) => acc + (attachment.Size || 0), 0);
    const filesSize = files.reduce((acc, file) => acc + (file.size || 0), 0);
    return attachmentsSize + filesSize > ATTACHMENT_MAX_SIZE;
};

export const checkSize = (
    createNotification: any,
    message: MessageState,
    files: File[],
    pendingUploadFiles: File[] = []
) => {
    const sizeExcedeed = isSizeExceeded(message, [...files, ...pendingUploadFiles]);
    if (sizeExcedeed) {
        createNotification({
            type: 'error',
            text: c('Error').t`Attachments are limited to 25 MB`,
        });
    }
    return sizeExcedeed;
};
