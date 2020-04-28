import { decryptMIMEMessage, decryptMessageLegacy, OpenPGPKey, OpenPGPSignature } from 'pmcrypto';
import { c } from 'ttag';

import { Message } from '../../models/message';
import { convert } from '../attachment/attachmentConverter';
import { VERIFICATION_STATUS } from '../../constants';
import { getDate, getSender, isMIME } from './messages';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { Attachment } from '../../models/attachment';

const { NOT_SIGNED } = VERIFICATION_STATUS;

const decryptMimeMessage = async (
    message: Message,
    publicKeys: OpenPGPKey[],
    privateKeys: OpenPGPKey[],
    attachmentsCache: AttachmentsCache
) => {
    const headerFilename = c('Encrypted Headers').t`Encrypted Headers filename`;
    const sender = getSender(message)?.Address;

    const result = await decryptMIMEMessage({
        message: message?.Body,
        messageDate: getDate(message),
        privateKeys: privateKeys,
        publicKeys: publicKeys,
        headerFilename,
        sender
    });

    const {
        body: decryptedBody = c('Message empty').t`Message content if empty`
        // , mimetype = MIME_TYPES.PLAINTEXT
    } = (await result.getBody()) || {};

    const verified = await result.verify();
    const errors = await result.errors();
    const [signature] = result.signatures;

    const Attachments = convert(message, await result.getAttachments(), verified, attachmentsCache);
    const encryptedSubject = await result.getEncryptedSubject();

    return {
        decryptedBody,
        Attachments,
        verified,
        encryptedSubject,
        errors,
        signature
        // mimetype
    };
};

const decryptLegacyMessage = async (message: Message, publicKeys: OpenPGPKey[], privateKeys: OpenPGPKey[]) => {
    const {
        data,
        signatures: [signature],
        verified = NOT_SIGNED,
        errors
    } = (await decryptMessageLegacy({
        message: message?.Body,
        messageDate: getDate(message),
        privateKeys: privateKeys,
        publicKeys: publicKeys
    })) as any;

    return { decryptedBody: data, verified, signature, errors };
};

export const decryptMessage = async (
    message: Message,
    publicKeys: OpenPGPKey[],
    privateKeys: OpenPGPKey[],
    attachmentsCache: AttachmentsCache
): Promise<{
    decryptedBody: string;
    Attachments?: Attachment[];
    verified?: VERIFICATION_STATUS;
    encryptedSubject?: string;
    errors?: Error[];
    signature?: OpenPGPSignature;
}> => {
    if (isMIME(message)) {
        return decryptMimeMessage(message, publicKeys, privateKeys, attachmentsCache);
    } else {
        return decryptLegacyMessage(message, publicKeys, privateKeys);
    }
};
