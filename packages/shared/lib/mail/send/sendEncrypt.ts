/**
 * Currently this is basically a copy of sendEncrypt from the mail repo. TO BE IMPROVED
 */
import {
    encryptMessage,
    splitMessage,
    armorBytes,
    concatArrays,
    generateSessionKey,
    SessionKey,
    OpenPGPKey,
    encryptSessionKey,
} from 'pmcrypto';
import { enums } from 'openpgp';
import { hasBit } from '../../helpers/bitset';
import { uint8ArrayToBase64String } from '../../helpers/encoding';
import { identity } from '../../helpers/function';
import isTruthy from '../../helpers/isTruthy';
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
    publicKeys?: OpenPGPKey[];
    passwords?: string[];
}) =>
    Promise.all(
        sessionKeys.map(async (sessionKey) => {
            const { message } = await encryptSessionKey({
                data: sessionKey.data,
                algorithm: sessionKey.algorithm,
                publicKeys: publicKeys.length > 0 ? publicKeys : undefined,
                passwords,
            });
            const data = message.packets.write();
            return uint8ArrayToBase64String(data as Uint8Array);
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
    data: await generateSessionKey(AES256),
});

/**
 * Encrypts the draft body. This is done separately from the other bodies so we can make sure that the send body
 * (the encrypted body in the message object) is the same as the other emails so we can use 1 blob for them in the api
 * (i.e. deduplication)
 */
const encryptDraftBodyPackage = async ({
    pack,
    publicKeys,
    privateKeys,
    publicKeysList,
    message,
}: {
    pack: PackageDirect;
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
    publicKeysList: OpenPGPKey[];
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
}) => {
    const cleanPublicKeys = [...publicKeys, ...publicKeysList].filter(identity);

    const { data, sessionKey } = await encryptMessage({
        data: pack.Body || '',
        publicKeys: cleanPublicKeys,
        privateKeys,
        returnSessionKey: true,
        compression: enums.compression.zip,
    });

    const packets = await splitMessage(data);

    const { asymmetric, encrypted } = packets;

    // rebuild the data without the send keypackets
    packets.asymmetric = packets.asymmetric.slice(0, publicKeys.length);
    // combine message
    const value = concatArrays(Object.values(packets).flat() as Uint8Array[]);
    // _.flowRight(concatArrays, _.flatten, _.values)(packets);

    message.Body = await armorBytes(value);

    return { keys: asymmetric.slice(publicKeys.length), encrypted, sessionKey };
};

/**
 * Encrypt the body in the given package. Should only be used if the package body differs from message body
 * (i.e. the draft body)
 */
const encryptBodyPackage = async ({
    pack,
    publicKeys,
    privateKeys,
    publicKeysList,
    message,
}: {
    pack: PackageDirect;
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
    publicKeysList: OpenPGPKey[];
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
}) => {
    // we need to encrypt the draft body as well
    await encryptDraftBodyPackage({ pack, publicKeys, privateKeys, publicKeysList, message });
    const cleanPublicKeys = publicKeysList.filter(identity);

    const { data, sessionKey } = await encryptMessage({
        data: pack.Body || '',
        publicKeys: cleanPublicKeys,
        sessionKey: cleanPublicKeys.length ? undefined : await generateSessionKeyHelper(),
        privateKeys,
        returnSessionKey: true,
        compression: enums.compression.zip,
    });

    const { asymmetric: keys, encrypted } = await splitMessage(data);
    return { keys, encrypted, sessionKey };
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
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
}): Promise<void> => {
    const addressKeys = Object.keys(pack.Addresses || {}).filter(isTruthy);
    const addresses = Object.values(pack.Addresses || {}).filter(isTruthy);
    const publicKeysList = addresses.map(({ PublicKey }) => PublicKey as OpenPGPKey);

    const encryptPack = message.MIMEType === pack.MIMEType ? encryptDraftBodyPackage : encryptBodyPackage;

    const { keys, encrypted, sessionKey } = await encryptPack({
        pack,
        publicKeys,
        privateKeys,
        publicKeysList,
        message,
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
    pack.Body = uint8ArrayToBase64String(encrypted[0]);
};

const encryptPackage = async ({
    pack,
    publicKeys,
    privateKeys,
    attachmentKeys,
    message,
}: {
    pack: PackageDirect;
    publicKeys: OpenPGPKey[];
    privateKeys: OpenPGPKey[];
    attachmentKeys: AttachmentKeys[];
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
}): Promise<PackageDirect> => {
    await Promise.all([
        encryptBody({ pack, publicKeys, privateKeys, message }),
        encryptAttachmentKeys({ pack, attachmentKeys }),
    ]);

    Object.values(pack.Addresses || {}).forEach((address: any) => delete address.PublicKey);

    return pack;
};

const getAttachmentKeys = async (attachments: Attachment[], privateKeys: OpenPGPKey[]): Promise<AttachmentKeys[]> =>
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
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
}): Promise<SimpleMap<PackageDirect>> => {
    const attachmentKeys = await getAttachmentKeys(attachments, privateKeys);
    const packageList = Object.values(packages) as PackageDirect[];
    await Promise.all(
        packageList.map((pack) => encryptPackage({ pack, privateKeys, publicKeys, attachmentKeys, message }))
    );

    return packages;
};
