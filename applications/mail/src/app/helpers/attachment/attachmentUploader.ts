import { c } from 'ttag';
import { encryptMessage, splitMessage, OpenPGPKey } from 'pmcrypto';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { readFileAsBuffer } from 'proton-shared/lib/helpers/file';

import { MessageExtended, MessageExtendedWithData } from '../../models/message';
import { getAttachments } from '../message/messages';
import { uploadAttachment } from '../../api/attachments';
import { Attachment } from '../../models/attachment';
import { generateCid, isEmbeddable } from '../embedded/embeddeds';
import { generateProtonWebUID } from 'proton-shared/lib/helpers/uid';
import { Upload, upload as uploadHelper, RequestParams } from '../upload';
import { ATTACHMENT_MAX_SIZE } from '../../constants';

// Reference: Angular/src/app/attachments/factories/attachmentModel.js

type UploadQueryResult = Promise<{ Attachment: Attachment }>;

export enum ATTACHMENT_ACTION {
    ATTACHMENT = 'attachment',
    INLINE = 'inline'
}

interface Packets {
    Filename: string;
    MIMEType: MIME_TYPES;
    FileSize: number;
    Inline: boolean;
    signature?: Uint8Array;
    Preview: Uint8Array | string;
    keys: Uint8Array;
    data: Uint8Array;
}

export interface UploadResult {
    attachment: Attachment;
    packets: Packets;
}

export const encryptAttachment = async (
    data: Uint8Array | string,
    { name, type, size }: File = {} as File,
    inline: boolean,
    publicKeys: OpenPGPKey[],
    privateKeys: OpenPGPKey[]
): Promise<Packets> => {
    const { message, signature } = await encryptMessage({
        // filename: name,
        armor: false,
        detached: true,
        data,
        publicKeys,
        privateKeys
    });

    const { asymmetric, encrypted } = await splitMessage(message);

    return {
        Filename: name,
        MIMEType: type as MIME_TYPES,
        FileSize: size,
        Inline: inline,
        signature: signature ? (signature.packets.write() as Uint8Array) : undefined,
        Preview: data,
        keys: asymmetric[0],
        data: encrypted[0]
    };
};

/**
 * Read the file locally, and encrypt it. return the encrypted file.
 */
const encryptFile = async (file: File, inline: boolean, pubKeys: OpenPGPKey[], privKey: OpenPGPKey[]) => {
    if (!file) {
        throw new TypeError(c('Error').t`You did not provide a file.`);
    }
    try {
        const result = await readFileAsBuffer(file);
        return encryptAttachment(new Uint8Array(result), file, inline, pubKeys, privKey);
    } catch (e) {
        throw new Error(c('Error').t`Failed to encrypt attachment. Please try again.`);
    }
};

/**
 * Add a new attachment, upload it to the server
 */
const uploadFile = (
    file: File,
    message: MessageExtendedWithData,
    inline: boolean,
    uid: string,
    cid = ''
): Upload<UploadResult> => {
    const titleImage = c('Title').t`Image`;

    const filename = file.name || `${titleImage} ${getAttachments(message.data).length + 1}`;
    const ContentID = inline ? cid || generateCid(generateProtonWebUID(), message.data?.Sender?.Address || '') : '';

    const publicKeys = message.publicKeys && message.publicKeys.length > 0 ? [message.publicKeys[0]] : [];
    const privateKeys = message.privateKeys && message.privateKeys.length > 0 ? [message.privateKeys[0]] : [];

    let packets: Packets;

    const getParams = async () => {
        packets = await encryptFile(file, inline, publicKeys, privateKeys);

        return uploadAttachment({
            Filename: packets.Filename || filename,
            MessageID: message.data.ID,
            ContentID,
            MIMEType: packets.MIMEType,
            KeyPackets: new Blob([packets.keys] as any),
            DataPacket: new Blob([packets.data] as any),
            Signature: packets.signature ? new Blob([packets.signature] as any) : undefined
        }) as RequestParams;
    };

    const upload = uploadHelper(uid, getParams()) as Upload<UploadQueryResult>;

    const attachPackets = async () => {
        const result = await upload.resultPromise;
        return { attachment: result.Attachment, packets };
    };

    return {
        ...upload,
        resultPromise: attachPackets()
    };
};

/**
 * Upload a list of attachments [...File]
 */
export const upload = (
    files: File[] = [],
    message: MessageExtendedWithData,
    action = ATTACHMENT_ACTION.ATTACHMENT,
    uid: string,
    cid = ''
): Upload<UploadResult>[] => {
    return files.map((file) => {
        const inline = isEmbeddable(file.type) && action === ATTACHMENT_ACTION.INLINE;
        return uploadFile(file, message, inline, uid, cid);
    });
};

/**
 * Is current attachments plus eventual files to upload will exceed the max size
 */
export const isSizeExceeded = (message: MessageExtended, files: File[] = []) => {
    const attachments = getAttachments(message.data);
    const attachmentsSize = attachments.reduce((acc, attachment) => acc + (attachment.Size || 0), 0);
    const filesSize = files.reduce((acc, file) => acc + (file.size || 0), 0);
    return attachmentsSize + filesSize > ATTACHMENT_MAX_SIZE;
};
