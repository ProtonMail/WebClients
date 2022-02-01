import {
    decryptMessageLegacy,
    OpenPGPKey,
    OpenPGPSignature,
    verifyMessage as pmcryptoVerifyMessage,
    createMessage,
    DecryptResultPmcrypto,
    getKeys,
    getMessage,
} from 'pmcrypto';
import processMIMESource from 'pmcrypto/lib/message/processMIME';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getDate, getParsedHeadersFirstValue, getSender, isMIME } from '@proton/shared/lib/mail/messages';
import { c } from 'ttag';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { KeyId } from '@proton/shared/lib/contacts/keyVerifications';
import { Address, Key } from '@proton/shared/lib/interfaces';
import { utf8ArrayToString } from 'pmcrypto/lib/utils';
import { AttachmentMime } from '../../models/attachment';
import { convert } from '../attachment/attachmentConverter';
import { MessageErrors, MessageStateWithData } from '../../logic/messages/messagesTypes';

const { NOT_VERIFIED, NOT_SIGNED } = VERIFICATION_STATUS;

interface DecryptBinaryResult extends DecryptResultPmcrypto {
    data: Uint8Array;
}
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
    signature?: OpenPGPSignature;
    errors?: MessageErrors;
    mimetype?: MIME_TYPES;
}

const decryptMimeMessage = async (
    message: Message,
    privateKeys: OpenPGPKey[],
    getAttachment?: (ID: string) => DecryptResultPmcrypto | undefined,
    onUpdateAttachment?: (ID: string, attachment: DecryptResultPmcrypto) => void,
    password?: string
): Promise<DecryptMessageResult> => {
    const headerFilename = c('Encrypted Headers').t`Encrypted Headers filename`;
    const sender = getSender(message)?.Address;

    let decryption: DecryptBinaryResult;
    let processing: MimeProcessResult;

    try {
        if (!password) {
            decryption = await decryptMessageLegacy({
                message: message?.Body,
                messageDate: getDate(message),
                privateKeys,
                publicKeys: [],
                format: 'binary',
            });
        } else {
            decryption = await decryptMessageLegacy({
                message: message?.Body,
                messageDate: getDate(message),
                passwords: [...password],
                format: 'binary',
            });
        }

        processing = await processMIME(
            {
                headerFilename,
                sender,
            },
            binaryToString(decryption.data)
        );

        return {
            decryptedBody: processing.body,
            decryptedRawContent: decryption.data,
            attachments: !onUpdateAttachment
                ? undefined
                : convert(message, processing.attachments, 0, onUpdateAttachment),
            decryptedSubject: processing.encryptedSubject,
            signature: decryption.signatures[0],
            mimetype: processing.mimetype,
            errors: decryption.errors?.length ? { decryption: decryption.errors } : undefined,
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
    privateKeys: OpenPGPKey[],
    password?: string
): Promise<DecryptMessageResult> => {
    let result: DecryptBinaryResult;

    try {
        if (!password) {
            result = await decryptMessageLegacy({
                message: message?.Body,
                messageDate: getDate(message),
                privateKeys,
                publicKeys: [],
                format: 'binary',
            });
        } else {
            result = await decryptMessageLegacy({
                message: message?.Body,
                messageDate: getDate(message),
                passwords: [password],
                format: 'binary',
            });
        }

        const {
            data,
            signatures: [signature],
        } = result;

        return { decryptedBody: binaryToString(data), decryptedRawContent: data, signature };
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
    privateKeys: OpenPGPKey[],
    getAttachment?: (ID: string) => DecryptResultPmcrypto | undefined,
    onUpdateAttachment?: (ID: string, attachment: DecryptResultPmcrypto) => void,
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
                message: createMessage(decryptedRawContent),
                signature: cryptoSignature,
                publicKeys,
            });
            cryptoVerified = cryptoVerify.verified;
        }

        if (contentType === MIME_TYPES.MIME) {
            const mimeVerify = await processMIME({ publicKeys }, binaryToString(decryptedRawContent));
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
export const getMessageDecryptionKeyFromAddress = async (address: Address, message: MessageStateWithData) => {
    const cryptoMessage = await getMessage(message.data.Body);
    const encryptionKeyIDs = cryptoMessage.getEncryptionKeyIds() as KeyId[];

    const addressKeyIDs: { address: Address; key: Key; keyIDs: KeyId[] }[] = [];
    await Promise.all(
        address.Keys.map(async (key) => {
            const compiled = await getKeys(key.PrivateKey);
            compiled.forEach((openPGPKey) => {
                const keyIDs = openPGPKey.getKeyIds() as KeyId[];
                addressKeyIDs.push({ address, key, keyIDs });
            });
        })
    );

    let matchingKey: KeyId | undefined;

    const keyFound = addressKeyIDs.find(({ keyIDs }) => {
        return keyIDs.some((keyID) =>
            encryptionKeyIDs.some((encryptionKeyID) => {
                const isFound = encryptionKeyID.equals(keyID);
                if (isFound) {
                    matchingKey = keyID;
                }
                return isFound;
            })
        );
    });

    return { keyFound, matchingKey };
};
