/**
 * Currently this is basically a copy of sendEncrypt from the mail repo. TO BE IMPROVED
 */
import type { AddressKeysByUsage } from '@proton/components/hooks/useGetAddressKeysByUsage';
import type { PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { PACKAGE_TYPE } from '@proton/shared/lib/mail/mailSettings';
import isTruthy from '@proton/utils/isTruthy';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { AES256, MIME_TYPES } from '../../constants';
import { hasBit } from '../../helpers/bitset';
import { uint8ArrayToBase64String } from '../../helpers/encoding';
import type { Attachment, Message } from '../../interfaces/mail/Message';
import type { PackageDirect } from '../../interfaces/mail/crypto';
import type { RequireOnly, SimpleMap } from '../../interfaces/utils';
import { getSessionKey } from './attachments';

interface AttachmentKeys {
    Attachment: Attachment;
    SessionKey: SessionKey;
}

const { SEND_CLEAR, SEND_CLEAR_MIME } = PACKAGE_TYPE;

const packToBase64 = ({ data, algorithm: Algorithm = AES256 }: SessionKey) => {
    return { Key: uint8ArrayToBase64String(data), Algorithm };
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

            return uint8ArrayToBase64String(encryptedSessionKey);
        })
    );

/**
 * Encrypt the attachment session keys and add them to the package
 */
const encryptAttachmentKeys = async ({
    pack,
    attachmentKeys,
}: {
    pack: PackageDirect;
    attachmentKeys: AttachmentKeys[];
}) => {
    // multipart/mixed bodies already include the attachments so we don't add them here
    if (pack.MIMEType === MIME_TYPES.MIME) {
        return;
    }

    const promises = Object.values(pack.Addresses || {}).map(async (address) => {
        if (!address?.PublicKey) {
            return;
        }

        const keys = await encryptKeyPacket({
            sessionKeys: attachmentKeys.map(({ SessionKey }) => SessionKey),
            publicKeys: [address.PublicKey],
        });

        address.AttachmentKeyPackets = keys;
    });

    if (hasBit(pack.Type, PACKAGE_TYPE.SEND_CLEAR)) {
        const AttachmentKeys: { Key: string; Algorithm: string }[] = [];
        attachmentKeys.forEach(({ SessionKey }) => {
            AttachmentKeys.push(packToBase64(SessionKey));
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
 * Encrypts the draft body. This is done separately from the other bodies so we can make sure that the send body
 * (the encrypted body in the message object) is the same as the other emails so we can use 1 blob for them in the api
 * (i.e. deduplication)
 */
const encryptDraftBodyPackage = async ({
    body,
    addressKeysByUsage,
    publicKeysList = [],
}: {
    body?: string;
    addressKeysByUsage: AddressKeysByUsage;
    publicKeysList?: (PublicKeyReference | undefined)[];
}) => {
    const cleanPublicKeys = [addressKeysByUsage.encryptionKey, ...publicKeysList].filter(isTruthy);

    // pass all public keys to make sure the generated session key is compatible with them all
    const sessionKey = await CryptoProxy.generateSessionKey({ recipientKeys: cleanPublicKeys });
    // we encrypt using `sessionKey` directly instead of `encryptionKeys` so that returned message only includes
    // symmetrically encrypted data
    const { message: encryptedData } = await CryptoProxy.encryptMessage({
        textData: body || '',
        stripTrailingSpaces: true,
        sessionKey,
        signingKeys: addressKeysByUsage.signingKeys,
        format: 'binary',
    });

    // Encrypt to each public key separetely to get separate serialized session keys.
    const [selfEncryptedSessionKey, ...otherEncryptedSessionKeys] = await Promise.all(
        cleanPublicKeys.map((publicKey) =>
            CryptoProxy.encryptSessionKey({
                ...sessionKey,
                encryptionKeys: publicKey,
                format: 'binary',
            })
        )
    );

    const armoredBody = await CryptoProxy.getArmoredMessage({
        binaryMessage: mergeUint8Arrays([selfEncryptedSessionKey, encryptedData]),
    });

    return { keys: otherEncryptedSessionKeys, encrypted: encryptedData, sessionKey, armoredBody };
};

/**
 * Encrypt the body in the given package. Should only be used if the package body differs from message body
 * (i.e. the draft body)
 */
const encryptBodyPackage = async ({
    body,
    signingKeys,
    publicKeysList,
}: {
    body?: string;
    signingKeys: PrivateKeyReference[];
    publicKeysList: (PublicKeyReference | undefined)[];
}) => {
    const cleanPublicKeys = publicKeysList.filter(isTruthy);

    const sessionKey = cleanPublicKeys.length
        ? await CryptoProxy.generateSessionKey({ recipientKeys: cleanPublicKeys })
        : await generateSessionKeyHelper();
    // we encrypt using `sessionKey` directly instead of `encryptionKeys` so that returned message only includes
    // symmetrically encrypted data
    const { message: encryptedData } = await CryptoProxy.encryptMessage({
        textData: body || '',
        stripTrailingSpaces: true,
        sessionKey,
        signingKeys,
        format: 'binary',
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
 * Temporary helper to encrypt the draft body. Get rid of this mutating function with refactor
 */
const encryptDraftBody = async ({
    addressKeysByUsage,
    message,
}: {
    addressKeysByUsage: AddressKeysByUsage;
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
}) => {
    const { armoredBody } = await encryptDraftBodyPackage({ body: message.Body, addressKeysByUsage });
    message.Body = armoredBody;
};

/**
 * Encrypts the body of the package and then overwrites the body in the package and adds the encrypted session keys
 * to the subpackages. If we send clear message the unencrypted session key is added to the (top-level) package too.
 */
const encryptBody = async ({
    pack,
    addressKeysByUsage,
    message,
}: {
    pack: PackageDirect;
    addressKeysByUsage: AddressKeysByUsage;
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
}): Promise<void> => {
    const addressKeys = Object.keys(pack.Addresses || {}).filter(isTruthy);
    const addresses = Object.values(pack.Addresses || {}).filter(isTruthy);
    const publicKeysList = addresses.map(({ PublicKey }) => PublicKey);

    const { keys, encrypted, sessionKey } =
        message.MIMEType === pack.MIMEType
            ? await encryptDraftBodyPackage({
                  body: pack.Body,
                  addressKeysByUsage,
                  publicKeysList,
              })
            : await encryptBodyPackage({
                  body: pack.Body,
                  signingKeys: addressKeysByUsage.signingKeys,
                  publicKeysList,
              });

    let counter = 0;
    publicKeysList.forEach((publicKey, index) => {
        if (!publicKey) {
            return;
        }

        const key = keys[counter++];
        const address = pack.Addresses?.[addressKeys[index]];
        if (!address) {
            return;
        }
        address.BodyKeyPacket = uint8ArrayToBase64String(key);
    });

    if ((pack.Type || 0) & (SEND_CLEAR | SEND_CLEAR_MIME)) {
        pack.BodyKey = packToBase64(sessionKey);
    }

    pack.Body = uint8ArrayToBase64String(encrypted);
};

const encryptPackage = async ({
    pack,
    addressKeysByUsage,
    attachmentKeys,
    message,
}: {
    pack: PackageDirect;
    addressKeysByUsage: AddressKeysByUsage;
    attachmentKeys: AttachmentKeys[];
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
}): Promise<void> => {
    await Promise.all([
        encryptBody({ pack, addressKeysByUsage, message }),
        encryptAttachmentKeys({ pack, attachmentKeys }),
    ]);

    Object.values(pack.Addresses || {}).forEach((address: any) => delete address.PublicKey);
};

const getAttachmentKeys = async (
    attachments: Attachment[],
    privateKeys: PrivateKeyReference[]
): Promise<AttachmentKeys[]> =>
    Promise.all(
        attachments.map(async (attachment) => ({
            Attachment: attachment,
            SessionKey: await getSessionKey(attachment, privateKeys),
        }))
    );

/**
 * Encrypts the packages and removes all temporary values that should not be send to the API
 */
export const encryptPackages = async ({
    packages,
    attachments,
    addressKeysByUsage,
    message,
}: {
    packages: SimpleMap<PackageDirect>;
    attachments: Attachment[];
    addressKeysByUsage: AddressKeysByUsage;
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
}): Promise<SimpleMap<PackageDirect>> => {
    const attachmentKeys = await getAttachmentKeys(attachments, addressKeysByUsage.decryptionKeys);
    const packageList = Object.values(packages) as PackageDirect[];
    await Promise.all([
        ...packageList.map((pack) =>
            encryptPackage({
                pack,
                addressKeysByUsage,
                attachmentKeys,
                message,
            })
        ),
        encryptDraftBody({ addressKeysByUsage, message }),
    ]);

    return packages;
};
