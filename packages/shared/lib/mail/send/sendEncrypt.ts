/**
 * Currently this is basically a copy of sendEncrypt from the mail repo. TO BE IMPROVED
 */
import { CryptoProxy, PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { concatArrays } from '@proton/crypto/lib/utils';
import isTruthy from '@proton/utils/isTruthy';
import { hasBit } from '../../helpers/bitset';
import { uint8ArrayToBase64String } from '../../helpers/encoding';
import { PackageDirect } from '../../interfaces/mail/crypto';
import { Message, Attachment } from '../../interfaces/mail/Message';
import { RequireOnly, SimpleMap } from '../../interfaces/utils';
import { AES256, MIME_TYPES, PACKAGE_TYPE } from '../../constants';

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
    publicKeys,
    privateKeys,
    publicKeysList = [],
}: {
    body?: string;
    privateKeys: PrivateKeyReference[];
    publicKeys: PublicKeyReference[];
    publicKeysList?: (PublicKeyReference | undefined)[];
}) => {
    const cleanPublicKeys = [...publicKeys, ...publicKeysList].filter(isTruthy);

    // pass all public keys to make sure the generated session key is compatible with them all
    const sessionKey = await CryptoProxy.generateSessionKey({ recipientKeys: cleanPublicKeys });
    // we encrypt using `sessionKey` directly instead of `encryptionKeys` so that returned message only includes
    // symmetrically encrypted data
    const { message: encryptedData } = await CryptoProxy.encryptMessage({
        textData: body || '',
        stripTrailingSpaces: true,
        sessionKey,
        signingKeys: privateKeys,
        format: 'binary',
    });

    // Encrypt to each public key separetely to get separate serialized session keys.
    const encryptedSessionKeys = await Promise.all(
        cleanPublicKeys.map((publicKey) =>
            CryptoProxy.encryptSessionKey({
                ...sessionKey,
                encryptionKeys: publicKey,
                format: 'binary',
            })
        )
    );

    // combine message
    const value = concatArrays([...encryptedSessionKeys.slice(0, publicKeys.length), encryptedData]);
    // _.flowRight(concatArrays, _.flatten, _.values)(packets);

    const armoredBody = await CryptoProxy.getArmoredMessage({ binaryMessage: value });

    return { keys: encryptedSessionKeys.slice(publicKeys.length), encrypted: encryptedData, sessionKey, armoredBody };
};

/**
 * Encrypt the body in the given package. Should only be used if the package body differs from message body
 * (i.e. the draft body)
 */
const encryptBodyPackage = async ({
    body,
    privateKeys,
    publicKeysList,
}: {
    body?: string;
    privateKeys: PrivateKeyReference[];
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
        signingKeys: privateKeys,
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
    publicKeys,
    privateKeys,
    message,
}: {
    privateKeys: PrivateKeyReference[];
    publicKeys: PublicKeyReference[];
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
}) => {
    const { armoredBody } = await encryptDraftBodyPackage({ body: message.Body, publicKeys, privateKeys });
    message.Body = armoredBody;
};

/**
 * Encrypts the body of the package and then overwrites the body in the package and adds the encrypted session keys
 * to the subpackages. If we send clear message the unencrypted session key is added to the (top-level) package too.
 */
const encryptBody = async ({
    pack,
    privateKeys,
    publicKeys,
    message,
}: {
    pack: PackageDirect;
    privateKeys: PrivateKeyReference[];
    publicKeys: PublicKeyReference[];
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
}): Promise<void> => {
    const addressKeys = Object.keys(pack.Addresses || {}).filter(isTruthy);
    const addresses = Object.values(pack.Addresses || {}).filter(isTruthy);
    const publicKeysList = addresses.map(({ PublicKey }) => PublicKey);

    const { keys, encrypted, sessionKey } =
        message.MIMEType === pack.MIMEType
            ? await encryptDraftBodyPackage({
                  body: pack.Body,
                  publicKeys,
                  privateKeys,
                  publicKeysList,
              })
            : await encryptBodyPackage({
                  body: pack.Body,
                  privateKeys,
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
        // eslint-disable-next-line require-atomic-updates
        pack.BodyKey = packToBase64(sessionKey);
    }
    // eslint-disable-next-line require-atomic-updates
    pack.Body = uint8ArrayToBase64String(encrypted);
};

const encryptPackage = async ({
    pack,
    publicKeys,
    privateKeys,
    attachmentKeys,
    message,
}: {
    pack: PackageDirect;
    publicKeys: PublicKeyReference[];
    privateKeys: PrivateKeyReference[];
    attachmentKeys: AttachmentKeys[];
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
}): Promise<void> => {
    await Promise.all([
        encryptBody({ pack, publicKeys, privateKeys, message }),
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
    privateKeys,
    publicKeys,
    message,
}: {
    packages: SimpleMap<PackageDirect>;
    attachments: Attachment[];
    privateKeys: PrivateKeyReference[];
    publicKeys: PublicKeyReference[];
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
}): Promise<SimpleMap<PackageDirect>> => {
    const attachmentKeys = await getAttachmentKeys(attachments, privateKeys);
    const packageList = Object.values(packages) as PackageDirect[];
    await Promise.all([
        ...packageList.map((pack) => encryptPackage({ pack, privateKeys, publicKeys, attachmentKeys, message })),
        encryptDraftBody({ publicKeys, privateKeys, message }),
    ]);

    return packages;
};
