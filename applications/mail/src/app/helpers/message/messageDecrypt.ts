import {
    decryptMessageLegacy,
    OpenPGPKey,
    OpenPGPSignature,
    verifyMessage as pmcryptoVerifyMessage,
    createCleartextMessage,
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
import { Address, AddressKey } from '@proton/shared/lib/interfaces';
import { MessageErrors, MessageExtendedWithData } from '../../models/message';
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
    attachmentsCache: AttachmentsCache | undefined
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
        attachments: !attachmentsCache ? undefined : convert(message, processing.attachments, 0, attachmentsCache),
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
    attachmentsCache: AttachmentsCache | undefined
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

/**
 * Try to get the key responsible for the message encryption from user's keys
 * keyFound contains the address, the key and keyIds of the key in case we need to display which key is needed to the user
 * matchingKey is the keyID of the key that we need to store in localStorage
 */
export const getMessageDecryptionKeyFromAddress = async (address: Address, message: MessageExtendedWithData) => {
    const cryptoMessage = await getMessage(message.data.Body);
    const encryptionKeyIDs = cryptoMessage.getEncryptionKeyIds() as KeyId[];

    const addressKeyIDs: { address: Address; key: AddressKey; keyIDs: KeyId[] }[] = [];
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
