import { decryptMIMEMessage, decryptMessageLegacy, OpenPGPKey, OpenPGPSignature } from 'pmcrypto';
import { c } from 'ttag';

import { Message, MessageErrors } from '../../models/message';
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

    let result;

    try {
        result = await decryptMIMEMessage({
            message: message?.Body,
            messageDate: getDate(message),
            privateKeys: privateKeys,
            publicKeys: publicKeys,
            headerFilename,
            sender
        });
    } catch (error) {
        return {
            decryptedBody: '',
            Attachments: [],
            verified: 0,
            errors: {
                decryption: [error]
            }
        };
    }

    const { body: decryptedBody = c('Message empty').t`Message content if empty` } = (await result.getBody()) || {};

    const verified = await result.verify();
    const errors = await result.errors();
    const [signature] = (result as any).signatures;

    const Attachments = convert(message, await result.getAttachments(), verified, attachmentsCache);
    const decryptedSubject = await result.getEncryptedSubject();

    return {
        decryptedBody,
        Attachments,
        verified,
        decryptedSubject,
        verificationErrors: errors,
        signature
    };
};

const decryptLegacyMessage = async (message: Message, publicKeys: OpenPGPKey[], privateKeys: OpenPGPKey[]) => {
    let result: any;

    try {
        result = await decryptMessageLegacy({
            message: message?.Body,
            messageDate: getDate(message),
            privateKeys: privateKeys,
            publicKeys: publicKeys
        });
    } catch (error) {
        return {
            decryptedBody: '',
            verified: 0,
            errors: {
                decryption: error
            }
        };
    }

    const {
        data,
        verified = NOT_SIGNED,
        signatures: [signature],
        errors
    } = result;

    return { decryptedBody: data, verified, signature, verificationErrors: errors };
};

export const decryptMessage = async (
    message: Message,
    publicKeys: OpenPGPKey[],
    privateKeys: OpenPGPKey[],
    attachmentsCache: AttachmentsCache
): Promise<{
    decryptedBody: string;
    Attachments?: Attachment[];
    verified: VERIFICATION_STATUS;
    decryptedSubject?: string;
    signature?: OpenPGPSignature;
    errors?: MessageErrors;
    verificationErrors?: Error[];
}> => {
    if (isMIME(message)) {
        return decryptMimeMessage(message, publicKeys, privateKeys, attachmentsCache);
    } else {
        return decryptLegacyMessage(message, publicKeys, privateKeys);
    }
};
