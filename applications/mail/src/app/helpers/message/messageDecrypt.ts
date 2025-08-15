import { c } from 'ttag';

import type {
    WorkerProcessMIMEResult as MimeProcessResult,
    PrivateKeyReference,
    PublicKeyReference,
    VERIFICATION_STATUS,
} from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { utf8ArrayToString } from '@proton/crypto/lib/utils';
import type { MessageErrors } from '@proton/mail/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { getParsedHeadersFirstValue, getSender, isAutoForwardee, isMIME } from '@proton/shared/lib/mail/messages';
import { getMailVerificationStatus } from '@proton/shared/lib/mail/signature';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import type { DecryptedAttachment } from 'proton-mail/store/attachments/attachmentsTypes';

import { convert } from '../attachment/attachmentConverter';

const { NOT_VERIFIED, NOT_SIGNED } = MAIL_VERIFICATION_STATUS;

const binaryToString = (data: Uint8Array<ArrayBuffer>) =>
    utf8ArrayToString(data)
        .replace(/\r\n/g, '\n')
        // nbsp can be contained in message body and "crash" DOMPurify
        .replace(/\u00A0/g, ' ');

export interface DecryptMessageResult {
    decryptedBody: string;
    decryptedRawContent: Uint8Array<ArrayBuffer>;
    attachments?: Attachment[];
    decryptedSubject?: string;
    signature?: Uint8Array<ArrayBuffer>;
    errors?: MessageErrors;
    mimetype?: MIME_TYPES;
}

const decryptMimeMessage = async (
    message: Message,
    privateKeys: PrivateKeyReference[],
    onUpdateAttachment?: (ID: string, attachment: DecryptedAttachment) => void
): Promise<DecryptMessageResult> => {
    const headerFilename = c('Encrypted Headers').t`Encrypted Headers filename`;
    const sender = getSender(message)?.Address;

    try {
        const decryption = await CryptoProxy.decryptMessage({
            armoredMessage: message.Body,
            decryptionKeys: privateKeys,
            verificationKeys: [],
            format: 'binary',
            config: {
                allowForwardedMessages: isAutoForwardee(message),
            },
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
            attachments: onUpdateAttachment ? convert(message, processing.attachments, onUpdateAttachment) : undefined,
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
    onUpdateAttachment?: (ID: string, attachment: DecryptedAttachment) => void,
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

        const { data: decryptedRawContent, signatures } = decryption;

        const decryptedBody = binaryToString(decryptedRawContent);

        return {
            decryptedBody,
            decryptedRawContent,
            signature: signatures.length > 0 ? mergeUint8Arrays(signatures) : undefined,
        };
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
    decryptedRawContent: Uint8Array<ArrayBuffer>,
    cryptoSignature: Uint8Array<ArrayBuffer> | undefined,
    message: Message,
    publicKeys: PublicKeyReference[]
): Promise<{
    verificationStatus: MAIL_VERIFICATION_STATUS;
    signature?: Uint8Array<ArrayBuffer>;
    verificationErrors?: Error[];
}> => {
    try {
        let cryptoVerified: VERIFICATION_STATUS | undefined;
        let mimeSignature: Uint8Array<ArrayBuffer> | undefined;
        let mimeVerified: VERIFICATION_STATUS | undefined;

        const contentType = getParsedHeadersFirstValue(message, 'Content-Type');

        if (publicKeys.length && cryptoSignature) {
            const cryptoVerify = await CryptoProxy.verifyMessage({
                binaryData: decryptedRawContent,
                binarySignature: cryptoSignature,
                verificationKeys: publicKeys,
            });
            cryptoVerified = cryptoVerify.verificationStatus;
        }

        if (contentType === MIME_TYPES.MIME) {
            const mimeVerify = await CryptoProxy.processMIME({
                data: binaryToString(decryptedRawContent),
                verificationKeys: publicKeys,
            });
            [mimeSignature] = mimeVerify.signatures;
            mimeVerified = mimeVerify.verificationStatus;
        }

        if (!cryptoSignature && !mimeSignature) {
            return { verificationStatus: NOT_SIGNED, signature: undefined };
        }

        if (!publicKeys.length) {
            return { verificationStatus: NOT_VERIFIED, signature: cryptoSignature };
        }

        if (cryptoSignature) {
            return { verificationStatus: getMailVerificationStatus(cryptoVerified!), signature: cryptoSignature };
        }

        // mimeSignature can't be undefined at this point
        return { verificationStatus: getMailVerificationStatus(mimeVerified!), signature: mimeSignature };
    } catch (error: any) {
        return {
            verificationStatus: NOT_VERIFIED,
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
