import {
    decryptMIMEMessage,
    decryptMessageLegacy,
    OpenPGPKey,
    OpenPGPSignature,
    verifyMessage as pmcryptoVerifyMessage,
    createCleartextMessage,
    DecryptResultPmcrypto,
} from 'pmcrypto';
import { Attachment, Message } from 'proton-shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import { getDate, getSender, isMIME } from 'proton-shared/lib/mail/messages';
import { c } from 'ttag';
import { MIME_TYPES } from 'proton-shared/lib/constants';

import { MessageErrors } from '../../models/message';
import { convert } from '../attachment/attachmentConverter';
import { AttachmentsCache } from '../../containers/AttachmentProvider';

const { NOT_VERIFIED } = VERIFICATION_STATUS;

export interface DecryptMessageResult {
    decryptedBody: string;
    Attachments?: Attachment[];
    decryptedSubject?: string;
    signature?: OpenPGPSignature;
    errors?: MessageErrors;
    mimetype?: MIME_TYPES;
}

const decryptMimeMessage = async (message: Message, privateKeys: OpenPGPKey[], attachmentsCache: AttachmentsCache) => {
    const headerFilename = c('Encrypted Headers').t`Encrypted Headers filename`;
    const sender = getSender(message)?.Address;

    // TS trick to get decrypt return value type
    type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;
    type DecryptMimeResult = ThenArg<ReturnType<typeof decryptMIMEMessage>>;
    let result: DecryptMimeResult;

    try {
        result = await decryptMIMEMessage({
            message: message?.Body,
            messageDate: getDate(message),
            privateKeys,
            publicKeys: [], // mandatory, even empty unless there is an error in openpgp
            headerFilename,
            sender,
        });
    } catch (error) {
        return {
            decryptedBody: '',
            Attachments: [],
            verified: NOT_VERIFIED,
            errors: {
                decryption: [error],
            },
        };
    }

    const { body: decryptedBody = c('Message empty').t`Message content is empty`, mimetype = MIME_TYPES.PLAINTEXT } =
        (await result.getBody()) || {};

    const verified = await result.verify();
    const errors = await result.errors();
    const [signature] = (result as any).signatures;

    const Attachments = convert(message, await result.getAttachments(), verified, attachmentsCache);
    const decryptedSubject = await result.getEncryptedSubject();

    return {
        decryptedBody,
        Attachments,
        decryptedSubject,
        signature,
        mimetype: mimetype as MIME_TYPES,
        errors: errors?.length ? { decryption: errors } : undefined,
    };
};

const decryptLegacyMessage = async (message: Message, privateKeys: OpenPGPKey[]) => {
    let result: DecryptResultPmcrypto;

    try {
        result = await decryptMessageLegacy({
            message: message?.Body,
            messageDate: getDate(message),
            privateKeys,
            publicKeys: [],
        });
    } catch (error) {
        return {
            decryptedBody: '',
            errors: {
                decryption: [error],
            },
        };
    }

    const {
        data,
        signatures: [signature],
    } = result;

    return { decryptedBody: data, signature };
};

/**
 * Decrypt a message body of any kind: plaintext/html multipart/simple
 * Willingly not dealing with public keys and signature verification
 * It will be done separately when public keys will be ready
 */
export const decryptMessage = async (
    message: Message,
    privateKeys: OpenPGPKey[],
    attachmentsCache: AttachmentsCache
): Promise<DecryptMessageResult> => {
    if (isMIME(message)) {
        return decryptMimeMessage(message, privateKeys, attachmentsCache);
    }
    return decryptLegacyMessage(message, privateKeys);
};

export const verifyMessage = async (
    decryptedBody: string,
    signature: OpenPGPSignature | undefined,
    message: Message,
    publicKeys: OpenPGPKey[],
    privateKeys: OpenPGPKey[] = []
): Promise<{
    verified: VERIFICATION_STATUS;
    signature?: OpenPGPSignature;
    verificationErrors?: Error[];
}> => {
    let result;

    try {
        if (message.ParsedHeaders['Content-Type'] === MIME_TYPES.MIME) {
            result = await decryptMessageLegacy({
                message: message.Body,
                messageDate: getDate(message),
                signature,
                publicKeys,
                privateKeys,
            });
        } else {
            result = await pmcryptoVerifyMessage({
                message: createCleartextMessage(decryptedBody),
                date: getDate(message),
                signature,
                publicKeys,
            });
        }
    } catch (error) {
        return {
            verified: NOT_VERIFIED,
            verificationErrors: [error],
        };
    }

    return {
        verified: result.verified,
        signature,
    };
};
