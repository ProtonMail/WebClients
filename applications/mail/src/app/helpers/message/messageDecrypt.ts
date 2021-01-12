import {
    decryptMessageLegacy,
    OpenPGPKey,
    OpenPGPSignature,
    verifyMessage as pmcryptoVerifyMessage,
    createCleartextMessage,
    DecryptResultPmcrypto,
} from 'pmcrypto';
import processMIMESource from 'pmcrypto/lib/message/processMIME';
import { Attachment, Message } from 'proton-shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import { getDate, getSender, isMIME } from 'proton-shared/lib/mail/messages';
import { c } from 'ttag';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { MessageErrors } from '../../models/message';
import { AttachmentMime } from '../../models/attachment';
import { convert } from '../attachment/attachmentConverter';
import { AttachmentsCache } from '../../containers/AttachmentProvider';

const { NOT_VERIFIED } = VERIFICATION_STATUS;

interface MimeProcessOptions {
    headerFilename?: string;
    sender?: string;
}
interface MimeProcessResult {
    body: string;
    attachments: AttachmentMime[];
    verified: VERIFICATION_STATUS;
    encryptedSubject: string;
    mimetype: MIME_TYPES;
    signatures: OpenPGPSignature[];
}
const processMIME = processMIMESource as (options: MimeProcessOptions, data: string) => Promise<MimeProcessResult>;

export interface DecryptMessageResult {
    decryptedBody: string;
    decryptedRawContent: string;
    attachments?: Attachment[];
    decryptedSubject?: string;
    signature?: OpenPGPSignature;
    errors?: MessageErrors;
    mimetype?: MIME_TYPES;
}

const decryptMimeMessage = async (
    message: Message,
    privateKeys: OpenPGPKey[],
    attachmentsCache: AttachmentsCache
): Promise<DecryptMessageResult> => {
    const headerFilename = c('Encrypted Headers').t`Encrypted Headers filename`;
    const sender = getSender(message)?.Address;

    let decryption: DecryptResultPmcrypto;
    let processing: MimeProcessResult;

    try {
        decryption = await decryptMessageLegacy({
            message: message?.Body,
            messageDate: getDate(message),
            privateKeys,
            publicKeys: [],
        });

        processing = await processMIME(
            {
                headerFilename,
                sender,
            },
            decryption.data
        );
    } catch (error) {
        return {
            decryptedBody: '',
            decryptedRawContent: '',
            attachments: [],
            errors: {
                decryption: [error],
            },
        };
    }

    return {
        decryptedBody: processing.body,
        decryptedRawContent: decryption.data,
        attachments: convert(message, processing.attachments, 0, attachmentsCache),
        decryptedSubject: processing.encryptedSubject,
        signature: decryption.signatures[0] || processing.signatures[0],
        mimetype: processing.mimetype,
        errors: decryption.errors?.length ? { decryption: decryption.errors } : undefined,
    };
};

const decryptLegacyMessage = async (message: Message, privateKeys: OpenPGPKey[]): Promise<DecryptMessageResult> => {
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
            decryptedRawContent: '',
            errors: {
                decryption: [error],
            },
        };
    }

    const {
        data,
        signatures: [signature],
    } = result;

    return { decryptedBody: data, decryptedRawContent: data, signature };
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

/**
 * Verify the extracted `signature` of a decryption result against its `decryptedRawContent`
 * The `publicKeys` are the public keys on which the compare the signature
 * The `message` is only used to get the date which is needed for the verification
 */
export const verifyMessage = async (
    decryptedRawContent: string,
    signature: OpenPGPSignature | undefined,
    message: Message,
    publicKeys: OpenPGPKey[]
): Promise<{
    verified: VERIFICATION_STATUS;
    signature?: OpenPGPSignature;
    verificationErrors?: Error[];
}> => {
    let result;

    try {
        result = await pmcryptoVerifyMessage({
            message: createCleartextMessage(decryptedRawContent),
            signature,
            publicKeys,
        });
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
