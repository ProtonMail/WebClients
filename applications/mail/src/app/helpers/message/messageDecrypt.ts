import { c } from 'ttag';

import type {
    WorkerProcessMIMEResult as MimeProcessResult,
    PrivateKeyReference,
    PublicKeyReference,
    WorkerDecryptionResult,
} from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { utf8ArrayToString } from '@proton/crypto/lib/utils';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { getParsedHeadersFirstValue, getSender, isAutoForwardee, isMIME } from '@proton/shared/lib/mail/messages';

import type { MessageErrors } from '../../store/messages/messagesTypes';
import { convert } from '../attachment/attachmentConverter';

const { NOT_VERIFIED, NOT_SIGNED } = VERIFICATION_STATUS;

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
    onUpdateAttachment?: (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => void
): Promise<DecryptMessageResult> => {
    const headerFilename = c('Encrypted Headers').t`Encrypted Headers filename`;
    const sender = getSender(message)?.Address;

    try {
        const decryption = await CryptoProxy.decryptMessage({
            armoredMessage: message.Body,
            decryptionKeys: privateKeys,
            verificationKeys: [],
            format: 'binary',
        });

        const decryptedStringData = binaryToString(decryption.data);
        let processing: MimeProcessResult;
        try {
            processing = await CryptoProxy.processMIME({
                data: decryptedStringData,
                headerFilename,
                sender,
            });
        } catch (e) {
            console.log('Failed to process decrypted MIME message:', decryptedStringData);
            throw e;
        }

        const decryptedRawContent = decryption.data;
        return {
            decryptedBody: processing.body,
            decryptedRawContent,
            attachments: onUpdateAttachment
                ? convert(message, processing.attachments, 0, onUpdateAttachment)
                : undefined,
            decryptedSubject: processing.encryptedSubject,
            signature: decryption.signatures[0],
            mimetype: processing.mimeType as MIME_TYPES,
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

/**
 * Decrypt a message body of any kind: plaintext/html, multipart/simple, as well as EO.
 * Willingly not dealing with public keys and signature verification
 * It will be done separately when public keys will be ready
 */
export const decryptMessage = async (
    message: Message,
    privateKeys: PrivateKeyReference[],
    onUpdateAttachment?: (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => void,
    password?: string
): Promise<DecryptMessageResult> => {
    if (isMIME(message)) {
        return decryptMimeMessage(message, privateKeys, onUpdateAttachment);
    }

    try {
        const decryption = await CryptoProxy.decryptMessage({
            armoredMessage: message.Body,
            decryptionKeys: privateKeys,
            verificationKeys: [],
            passwords: password, // EO messages
            format: 'binary',
            config: {
                allowForwardedMessages: isAutoForwardee(message),
            },
        });

        const {
            data: decryptedRawContent,
            signatures: [signature],
        } = decryption;

        const decryptedBody = binaryToString(decryptedRawContent);

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
export const getMessageDecryptionKeyIDFromAddress = async (address: Address, message: Message) => {
    const { encryptionKeyIDs } = await CryptoProxy.getMessageInfo({
        armoredMessage: message.Body,
    });

    for (const { PrivateKey: armoredKey } of address.Keys) {
        const { keyIDs: addressKeyIDs } = await CryptoProxy.getKeyInfo({ armoredKey });
        const matchingKeyID = addressKeyIDs.find((keyID) => encryptionKeyIDs.includes(keyID));

        if (matchingKeyID) {
            return matchingKeyID;
        }
    }
};
