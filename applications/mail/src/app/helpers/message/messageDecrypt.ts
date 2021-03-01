import {
    decryptMessageLegacy,
    OpenPGPKey,
    OpenPGPSignature,
    verifyMessage as pmcryptoVerifyMessage,
    createCleartextMessage,
    DecryptResultPmcrypto,
} from 'pmcrypto';
import processMIMESource from 'pmcrypto/lib/message/processMIME';
import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import { Attachment, Message } from 'proton-shared/lib/interfaces/mail/Message';
import { getDate, getParsedHeadersFirstValue, getSender, isMIME } from 'proton-shared/lib/mail/messages';
import { c } from 'ttag';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { MessageErrors } from '../../models/message';
import { AttachmentMime } from '../../models/attachment';
import { convert } from '../attachment/attachmentConverter';
import { AttachmentsCache } from '../../containers/AttachmentProvider';

const { NOT_VERIFIED, NOT_SIGNED } = VERIFICATION_STATUS;

interface MimeProcessOptions {
    headerFilename?: string;
    sender?: string;
    publicKeys?: OpenPGPKey[];
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
        signature: decryption.signatures[0],
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
 * Also parse mime messages to look for embedded signature
 * The `publicKeys` are the public keys on which the compare the signature
 * The `message` is only used to detect mime format
 */
export const verifyMessage = async (
    decryptedRawContent: string,
    cryptoSignature: OpenPGPSignature | undefined,
    message: Message,
    publicKeys: OpenPGPKey[]
): Promise<{
    verified: VERIFICATION_STATUS;
    signature?: OpenPGPSignature;
    verificationErrors?: Error[];
}> => {
    try {
        let cryptoVerified: VERIFICATION_STATUS | undefined;
        let mimeSignature: OpenPGPSignature | undefined;
        let mimeVerified: VERIFICATION_STATUS | undefined;

        const contentType = getParsedHeadersFirstValue(message, 'Content-Type');

        if (publicKeys.length && cryptoSignature) {
            const cryptoVerify = await pmcryptoVerifyMessage({
                message: createCleartextMessage(decryptedRawContent),
                signature: cryptoSignature,
                publicKeys,
            });
            cryptoVerified = cryptoVerify.verified;
        }

        if (contentType === MIME_TYPES.MIME) {
            const mimeVerify = await processMIME({ publicKeys }, decryptedRawContent);
            [mimeSignature] = mimeVerify.signatures;
            mimeVerified = mimeVerify.verified;
        }

        if (!cryptoSignature && !mimeSignature) {
            return { verified: NOT_SIGNED, signature: undefined };
        }

        if (!publicKeys.length) {
            return { verified: NOT_VERIFIED, signature: cryptoSignature };
        }

        if (cryptoSignature) {
            return { verified: cryptoVerified as VERIFICATION_STATUS, signature: cryptoSignature };
        }

        // mimeSignature can't be undefined at this point
        return { verified: mimeVerified as VERIFICATION_STATUS, signature: mimeSignature };
    } catch (error) {
        return {
            verified: NOT_VERIFIED,
            verificationErrors: [error],
        };
    }
};
