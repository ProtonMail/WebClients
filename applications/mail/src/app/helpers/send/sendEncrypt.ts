import { CryptoProxy, PublicKeyReference, SessionKey } from '@proton/crypto';
import { AES256, MIME_TYPES, PACKAGE_TYPE } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { Package, Packages } from '@proton/shared/lib/interfaces/mail/crypto';
import { getAttachments } from '@proton/shared/lib/mail/messages';
import { getSessionKey } from '@proton/shared/lib/mail/send/attachments';
import isTruthy from '@proton/utils/isTruthy';

import { MessageState, PublicPrivateKey } from '../../logic/messages/messagesTypes';
import { arrayToBase64 } from '../base64';

const MEGABYTE = 1024 * 1024;

// Reference: Angular/src/app/composer/services/encryptPackages.js

interface AttachmentKeys {
    Attachment: Attachment;
    SessionKey: SessionKey;
}

const { SEND_CLEAR, SEND_EO, SEND_CLEAR_MIME } = PACKAGE_TYPE;

const packToBase64 = ({ data, algorithm: Algorithm = AES256 }: SessionKey) => {
    return { Key: arrayToBase64(data), Algorithm };
};

const encryptKeyPacket = async ({
    sessionKeys = [],
    publicKeys = [],
    passwords = [],
}: {
    sessionKeys?: SessionKey[];
    publicKeys?: PublicKeyReference[];
    passwords?: string[];
}) =>
    Promise.all(
        sessionKeys.map(async (sessionKey) => {
            const encryptedSessionKey = await CryptoProxy.encryptSessionKey({
                data: sessionKey.data,
                algorithm: sessionKey.algorithm,
                encryptionKeys: publicKeys,
                passwords,
                format: 'binary',
            });
            return arrayToBase64(encryptedSessionKey);
        })
    );

/**
 * Encrypt the attachment session keys and add them to the package
 */
const encryptAttachmentKeys = async (pack: Package, message: MessageState, attachmentKeys: AttachmentKeys[]) => {
    // multipart/mixed bodies already include the attachments so we don't add them here
    if (pack.MIMEType === MIME_TYPES.MIME) {
        return;
    }

    const promises = Object.values(pack.Addresses || {}).map(async (address) => {
        const isEo = hasBit(address.Type, PACKAGE_TYPE.SEND_EO);

        if (!(isEo || address.PublicKey)) {
            return;
        }

        const keys = await encryptKeyPacket({
            sessionKeys: attachmentKeys.map(({ SessionKey }) => SessionKey),
            passwords: isEo ? [message.data?.Password || ''] : undefined,
            publicKeys: isEo ? undefined : [address.PublicKey as PublicKeyReference],
        });

        const AttachmentKeyPackets: { [AttachmentID: string]: string } = {};
        attachmentKeys.forEach(({ Attachment }, i) => {
            AttachmentKeyPackets[Attachment.ID || ''] = keys[i];
        });
        address.AttachmentKeyPackets = AttachmentKeyPackets;
    });

    if (hasBit(pack.Type, PACKAGE_TYPE.SEND_CLEAR)) {
        const AttachmentKeys: { [AttachmentID: string]: { Key: string; Algorithm: string } } = {};
        attachmentKeys.forEach(({ Attachment, SessionKey }) => {
            AttachmentKeys[Attachment.ID || ''] = packToBase64(SessionKey);
        });
        pack.AttachmentKeys = AttachmentKeys;
    }

    return Promise.all(promises);
};

/**
 * Generate random session key in the format openpgp creates them
 */
const generateSessionKeyHelper = async (): Promise<SessionKey> => ({
    algorithm: AES256,
    data: await CryptoProxy.generateSessionKeyForAlgorithm(AES256),
});

/**
 * Encrypt the body in the given package. Should only be used if the package body differs from message body
 * (i.e. the draft body)
 */
const encryptBodyPackage = async (
    pack: Package,
    messageKeys: PublicPrivateKey,
    publicKeys: (PublicKeyReference | undefined)[],
    message: MessageState,
    scheduledTime?: number,
    canUseScheduledTime = false
) => {
    const cleanPublicKeys = publicKeys.filter(isTruthy);

    // Always encrypt with a single private key
    const privateKeys = messageKeys.privateKeys.slice(0, 1);

    const containsEmbeddedAttachments = pack.MIMEType === MIME_TYPES.MIME && getAttachments(message.data).length > 0; // NB: `Message.NumAttachments` is a server-controlled value, so we cannot rely on it here
    // We enable compression for MIME messages that include attachments to reduce the size of the inlined base64 attachment data,
    // when the body is larger than 1MB. This is also to avoid enabling compression when the attached data is just the sender's public key,
    // since its value is constant and known to the server, hence compressing it won't necessarily limit compression-based information leakage.
    const shouldCompress = containsEmbeddedAttachments && pack.Body!.length > MEGABYTE;

    /*
     * Used to disable temporary the usage of the scheduled date in the signature
     * Because on the BE we cannot have a signature date in the future
     */
    const canUseScheduledTimeInSignature = scheduledTime && canUseScheduledTime;

    const sessionKey = cleanPublicKeys.length
        ? await CryptoProxy.generateSessionKey({ recipientKeys: cleanPublicKeys })
        : await generateSessionKeyHelper();

    const data = pack.Body || '';
    const dataType = data instanceof Uint8Array ? 'binaryData' : 'textData';
    // we encrypt using `sessionKey` directly instead of `encryptionKeys` so that returned message only includes
    // symmetrically encrypted data
    const { message: encryptedData } = await CryptoProxy.encryptMessage({
        [dataType]: data,
        sessionKey,
        signingKeys: privateKeys,
        date: canUseScheduledTimeInSignature ? new Date(scheduledTime) : undefined,
        format: 'binary',
        compress: shouldCompress,
    });

    // encrypt to each public key separetely to get separate serialized session keys
    const encryptedSessionKeys = await Promise.all(
        cleanPublicKeys.map((publicKey) =>
            CryptoProxy.encryptSessionKey({
                ...sessionKey,
                encryptionKeys: publicKey,
                format: 'binary',
            })
        )
    );

    return { keys: encryptedSessionKeys, encrypted: encryptedData, sessionKey };
};

/**
 * Encrypts the draft body. This is done separately from the other bodies so we can make sure that the send body
 * (the encrypted body in the message object) is the same as the other emails so we can use 1 blob for them in the api
 * (i.e. deduplication)
 */
const encryptDraftBodyPackage = async (
    pack: Package,
    messageKeys: PublicPrivateKey,
    publicKeys: (PublicKeyReference | undefined)[],
    scheduledTime?: number,
    canUseScheduledTime = false
) => {
    const cleanPublicAndMessageKeys = [...messageKeys.publicKeys, ...publicKeys].filter(isTruthy);
    const cleanPublicKeys = publicKeys.filter(isTruthy);

    // Always encrypt with a single private key
    const privateKeys = messageKeys.privateKeys.slice(0, 1);

    /*
     * Used to disable temporary the usage of the scheduled date in the signature
     * Because on the BE we cannot have a signature date in the future
     */
    const canUseScheduledTimeInSignature = scheduledTime && canUseScheduledTime;

    // pass both messageKeys and publicKeys to make sure the generated session key is compatible with them all
    const sessionKey = await CryptoProxy.generateSessionKey({ recipientKeys: cleanPublicAndMessageKeys });

    const data = pack.Body || '';
    const dataType = data instanceof Uint8Array ? 'binaryData' : 'textData';
    // we encrypt using `sessionKey` directly instead of `encryptionKeys` so that returned message only includes
    // symmetrically encrypted data
    const { message: encryptedData } = await CryptoProxy.encryptMessage({
        [dataType]: data,
        sessionKey,
        signingKeys: privateKeys,
        date: canUseScheduledTimeInSignature ? new Date(scheduledTime) : undefined,
        format: 'binary',
    });

    // Encrypt to each recipient's public key separetely to get separate serialized session keys.
    const encryptedSessionKeys = await Promise.all(
        cleanPublicKeys.map((publicKey) =>
            CryptoProxy.encryptSessionKey({
                ...sessionKey,
                encryptionKeys: publicKey,
                format: 'binary',
            })
        )
    );

    return { keys: encryptedSessionKeys, encrypted: encryptedData, sessionKey };
};

/**
 * Encrypts the body of the package and then overwrites the body in the package and adds the encrypted session keys
 * to the subpackages. If we send clear message the unencrypted session key is added to the (top-level) package too.
 */
const encryptBody = async (pack: Package, messageKeys: PublicPrivateKey, message: MessageState): Promise<void> => {
    const addressKeys = Object.keys(pack.Addresses || {});
    const addresses = Object.values(pack.Addresses || {});
    const publicKeysList = addresses.map(({ PublicKey }) => PublicKey);

    const scheduledTime = message.draftFlags?.scheduledAt ? message.draftFlags?.scheduledAt * 1000 : undefined;

    /*
     * Special case: reuse the encryption packet from the draft, this allows us to do deduplication on the back-end.
     * In fact, this will be the most common case.
     */
    const { keys, encrypted, sessionKey } =
        message.data?.MIMEType === pack.MIMEType
            ? await encryptDraftBodyPackage(pack, messageKeys, publicKeysList, scheduledTime)
            : await encryptBodyPackage(pack, messageKeys, publicKeysList, message, scheduledTime);

    let counter = 0;
    publicKeysList.forEach((publicKey, index) => {
        if (!publicKey) {
            return;
        }

        const key = keys[counter++];
        (pack.Addresses || {})[addressKeys[index]].BodyKeyPacket = arrayToBase64(key);
    });

    await Promise.all(
        addresses.map(async (subPack) => {
            if (subPack.Type !== SEND_EO) {
                return;
            }
            const [BodyKeyPacket] = await encryptKeyPacket({
                sessionKeys: [sessionKey],
                passwords: [message.data?.Password || ''],
            });

            // eslint-disable-next-line require-atomic-updates
            subPack.BodyKeyPacket = BodyKeyPacket;
        })
    );

    if ((pack.Type || 0) & (SEND_CLEAR | SEND_CLEAR_MIME)) {
        // eslint-disable-next-line require-atomic-updates
        pack.BodyKey = packToBase64(sessionKey);
    }

    pack.Body = encrypted;
};

const encryptPackage = async (
    pack: Package,
    message: MessageState,
    messageKeys: PublicPrivateKey,
    attachmentKeys: AttachmentKeys[]
): Promise<Package> => {
    await Promise.all([encryptBody(pack, messageKeys, message), encryptAttachmentKeys(pack, message, attachmentKeys)]);

    Object.values(pack.Addresses || {}).forEach((address: any) => delete address.PublicKey);

    return pack;
};

const getAttachmentKeys = async (message: MessageState, messageKeys: PublicPrivateKey): Promise<AttachmentKeys[]> =>
    Promise.all(
        getAttachments(message.data).map(async (attachment) => ({
            Attachment: attachment,
            SessionKey: await getSessionKey(attachment, messageKeys.privateKeys),
        }))
    );

/**
 * Encrypts the packages and removes all temporary values that should not be send to the API
 */
export const encryptPackages = async (
    message: MessageState,
    messageKeys: PublicPrivateKey,
    packages: Packages
): Promise<Packages> => {
    const attachmentKeys = await getAttachmentKeys(message, messageKeys);
    const packageList = Object.values(packages) as Package[];
    await Promise.all(packageList.map((pack) => encryptPackage(pack, message, messageKeys, attachmentKeys)));
    return packages;
};
