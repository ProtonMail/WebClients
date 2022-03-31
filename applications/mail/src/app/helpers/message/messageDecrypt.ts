import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';
import {
    CryptoProxy,
    PrivateKeyReference,
    PublicKeyReference,
    WorkerDecryptionResult,
} from '@proton/crypto';
import processMIMESource from 'pmcrypto/lib/message/processMIME';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getDate, getParsedHeadersFirstValue, getSender, isMIME } from '@proton/shared/lib/mail/messages';
import { c } from 'ttag';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Address } from '@proton/shared/lib/interfaces';
import { AttachmentMime } from '../../models/attachment';
import { convert } from '../attachment/attachmentConverter';
import { MessageErrors, MessageStateWithData } from '../../logic/messages/messagesTypes';

const { NOT_VERIFIED, NOT_SIGNED } = VERIFICATION_STATUS;

// decrypted data is always a string for legacy message, regardless of 'format' input option
interface MaybeLegacyDecryptResult extends WorkerDecryptionResult<string | Uint8Array> {}

interface MimeProcessOptions {
    headerFilename?: string;
    sender?: string;
    publicKeys?: PublicKeyReference[];
}
interface MimeProcessResult {
    body: string;
    attachments: AttachmentMime[];
    verified: VERIFICATION_STATUS;
    encryptedSubject: string;
    mimetype: MIME_TYPES;
    signatures: Uint8Array[];
}
const processMIME = processMIMESource as (options: MimeProcessOptions, data: string) => Promise<MimeProcessResult>;

const binaryToString = (data: Uint8Array) =>
    utf8ArrayToString(data)
        .replace(/\r\n/g, '\n')
        // nbsp can be contained in message body and "crash" DOMPurify
        .replace(/\u00A0/g, ' ');

export interface DecryptMessageResult {
    decryptedBody: string;
    decryptedRawContent: Uint8Array;
    attachments?: Attachment[];
    decryptedSubject?: string;
    signature?: Uint8Array;
    errors?: MessageErrors;
    mimetype?: MIME_TYPES;
}

const decryptMimeMessage = async (
    message: Message,
    privateKeys: PrivateKeyReference[],
    getAttachment?: (ID: string) => WorkerDecryptionResult<Uint8Array> | undefined,
    onUpdateAttachment?: (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => void,
    password?: string
): Promise<DecryptMessageResult> => {
    const headerFilename = c('Encrypted Headers').t`Encrypted Headers filename`;
    const sender = getSender(message)?.Address;

    let decryption: MaybeLegacyDecryptResult;
    let processing: MimeProcessResult;

    try {
        if (!password) {
            // TODO lara: the types were wrong, as a legacy message always returns a string. for daniel: can we return format: 'utf8' and then convert to binary? do we need to use decryptLegacyMessage here??
            // re: https://jira.protontech.ch/browse/MAILWEB-3018 which was fixed only in the function below
            decryption = await CryptoProxy.decryptMessageLegacy({
                armoredMessage: message?.Body,
                messageDate: getDate(message),
                decryptionKeys: privateKeys,
                verificationKeys: [],
                format: 'binary',
            });
        } else {
            decryption = await CryptoProxy.decryptMessageLegacy({
                armoredMessage: message?.Body,
                messageDate: getDate(message),
                passwords: [...password],
                format: 'binary',
            });
        }

        const decryptedStringData =
            decryption.data instanceof Uint8Array ? binaryToString(decryption.data) : decryption.data;
        processing = await processMIME(
            {
                headerFilename,
                sender,
            },
            decryptedStringData
        );

        const decryptedRawContent =
            decryption.data instanceof Uint8Array ? decryption.data : stringToUtf8Array(decryption.data);
        return {
            decryptedBody: processing.body,
            decryptedRawContent,
            attachments: !onUpdateAttachment
                ? undefined
                : convert(message, processing.attachments, 0, onUpdateAttachment),
            decryptedSubject: processing.encryptedSubject,
            signature: decryption.signatures[0],
            mimetype: processing.mimetype as MIME_TYPES,
        };
    } catch (error: any) {
        return {
            decryptedBody: '',
            decryptedRawContent: new Uint8Array(),
            attachments: [],
            errors: {
                decryption: [error],
            },
        };
    }
};

const decryptLegacyMessage = async (
    message: Message,
    privateKeys: PrivateKeyReference[],
    password?: string
): Promise<DecryptMessageResult> => {
    let result: MaybeLegacyDecryptResult;

    try {
        if (!password) {
            result = await CryptoProxy.decryptMessageLegacy({
                armoredMessage: message?.Body,
                messageDate: getDate(message),
                decryptionKeys: privateKeys,
                verificationKeys: [],
                format: 'binary',
            });
        } else {
            result = await CryptoProxy.decryptMessageLegacy({
                armoredMessage: message?.Body,
                messageDate: getDate(message),
                passwords: [password],
                format: 'binary',
            });
        }

        const {
            data,
            signatures: [signature],
        } = result;

        // Very old messages outputs as string
        const decryptedBody = data instanceof Uint8Array ? binaryToString(data) : data;
        const decryptedRawContent = data instanceof Uint8Array ? data : stringToUtf8Array(data);

        return { decryptedBody, decryptedRawContent, signature };
    } catch (error: any) {
        return {
            decryptedBody: '',
            decryptedRawContent: new Uint8Array(),
            errors: {
                decryption: [error],
            },
        };
    }
};

/**
 * Decrypt a message body of any kind: plaintext/html multipart/simple
 * Willingly not dealing with public keys and signature verification
 * It will be done separately when public keys will be ready
 */
export const decryptMessage = async (
    message: Message,
    privateKeys: PrivateKeyReference[],
    getAttachment?: (ID: string) => WorkerDecryptionResult<Uint8Array> | undefined,
    onUpdateAttachment?: (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => void,
    password?: string
): Promise<DecryptMessageResult> => {
    if (isMIME(message)) {
        return decryptMimeMessage(message, privateKeys, getAttachment, onUpdateAttachment, password);
    }
    return decryptLegacyMessage(message, privateKeys, password);
};

/**
 * Verify the extracted `signature` of a decryption result against its `decryptedRawContent`
 * Also parse mime messages to look for embedded signature
 * The `publicKeys` are the public keys on which the compare the signature
 * The `message` is only used to detect mime format
 */
export const verifyMessage = async (
    decryptedRawContent: Uint8Array,
    cryptoSignature: Uint8Array | undefined,
    message: Message,
    publicKeys: PublicKeyReference[]
): Promise<{
    verified: VERIFICATION_STATUS;
    signature?: Uint8Array;
    verificationErrors?: Error[];
}> => {
    try {
        let cryptoVerified: VERIFICATION_STATUS | undefined;
        let mimeSignature: Uint8Array | undefined;
        let mimeVerified: VERIFICATION_STATUS | undefined;

        const contentType = getParsedHeadersFirstValue(message, 'Content-Type');

        if (publicKeys.length && cryptoSignature) {
            const cryptoVerify = await CryptoProxy.verifyMessage({
                binaryData: decryptedRawContent,
                binarySignature: cryptoSignature,
                verificationKeys: publicKeys,
            });
            cryptoVerified = cryptoVerify.verified;
        }

        if (contentType === MIME_TYPES.MIME) {
            const mimeVerify = await CryptoProxy.processMIME({
                data: binaryToString(decryptedRawContent),
                verificationKeys: publicKeys,
            });
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
    } catch (error: any) {
        return {
            verified: NOT_VERIFIED,
            verificationErrors: [error],
        };
    }
};

/**
 * Try to get the key responsible for the message encryption from user's keys
 * keyFound contains the address, the key and keyIds of the key in case we need to display which key is needed to the user
 * matchingKey is the keyID of the key that we need to store in localStorage
 */
export const getMessageDecryptionKeyIDFromAddress = async (address: Address, message: MessageStateWithData) => {
    const { encryptionKeyIDs } = await CryptoProxy.getMessageInfo({
        armoredMessage: message.data.Body,
    });

    for (const { PrivateKey: armoredKey } of address.Keys) {
        const { keyIDs: addressKeyIDs } = await CryptoProxy.getKeyInfo({ armoredKey });
        const matchingKeyID = addressKeyIDs.find((keyID) => encryptionKeyIDs.includes(keyID));

        if (matchingKeyID) {
            return matchingKeyID;
        }
    }
};
