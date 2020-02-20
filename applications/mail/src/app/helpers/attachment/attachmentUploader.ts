import { c } from 'ttag';
import { encryptMessage, splitMessage, OpenPGPKey } from 'pmcrypto';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { Api } from 'proton-shared/lib/interfaces';

import { MessageExtended } from '../../models/message';
import { getAttachments } from '../message/messages';
import { readFileAsBuffer } from '../file';
import { uploadAttachment } from '../../api/attachments';
import { Attachment } from '../../models/attachment';
import { generateCid, readCID, createBlob, createEmbeddedMap, isEmbeddable } from '../embedded/embeddeds';
import { generateUID } from '../string';
import { Computation } from '../../hooks/useMessage';

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
    Preview: Uint8Array;
    keys: Uint8Array;
    data: Uint8Array;
}

export interface UploadResult {
    attachment: Attachment;
    packets: Packets;
}

const encrypt = async (
    data: Uint8Array,
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
        return encrypt(new Uint8Array(result), file, inline, pubKeys, privKey);
    } catch (e) {
        throw new Error(c('Error').t`Failed to encrypt attachment. Please try again.`);
    }
};

/**
 * Add a new attachment, upload it to the server
 */
const uploadFile = async (
    file: File,
    message: MessageExtended,
    inline: boolean,
    api: Api,
    cid = ''
): Promise<UploadResult> => {
    const titleImage = c('Title').t`Image`;

    const filename = file.name || `${titleImage} ${getAttachments(message.data).length + 1}`;
    const ContentID = inline ? cid || generateCid(generateUID(), message.data?.Sender?.Address || '') : '';

    const publicKeys = message.publicKeys && message.publicKeys.length > 0 ? [message.publicKeys[0]] : [];

    const packets = await encryptFile(file, inline, publicKeys, message.privateKeys || []);

    const { Attachment } = await (api(
        uploadAttachment({
            Filename: packets.Filename || filename,
            MessageID: message.data?.ID || '',
            ContentID,
            MIMEType: packets.MIMEType,
            KeyPackets: new Blob([packets.keys] as any),
            DataPacket: new Blob([packets.data] as any),
            Signature: packets.signature ? new Blob([packets.signature] as any) : undefined
        })
    ) as UploadQueryResult);

    // TODO
    // if (isAborted) {
    //     return;
    // }

    return { attachment: Attachment, packets };
};

/**
 * Upload a list of attachments [...File]
 */
export const upload = async (
    files: File[] = [],
    message: MessageExtended = {},
    action = ATTACHMENT_ACTION.ATTACHMENT,
    api: Api,
    cid = ''
) => {
    return await Promise.all(
        files.map((file) => {
            const inline = isEmbeddable(file.type) && action === ATTACHMENT_ACTION.INLINE;
            return uploadFile(file, message, inline, api, cid);
        })
    );
};

export const getUpdateAttachmentsComputation = (
    uploads: UploadResult[],
    action = ATTACHMENT_ACTION.ATTACHMENT
): Computation => (message: MessageExtended) => {
    // New attachment list
    const newAttachments = uploads.map((upload) => upload.attachment);
    const attachments = [...getAttachments(message.data), ...newAttachments];

    // Update embeddeds map if embedded attachments
    const embeddeds = message.embeddeds || createEmbeddedMap();

    if (action === ATTACHMENT_ACTION.INLINE) {
        uploads.forEach((upload) =>
            embeddeds.set(readCID(upload.attachment), {
                attachment: upload.attachment,
                url: createBlob(upload.attachment, upload.packets.Preview)
            })
        );
    }

    return { data: { ...message.data, Attachments: attachments }, embeddeds };
};
