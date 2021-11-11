import {
    decryptMessage,
    getMessage,
    encryptMessage,
    generateKey,
    binaryStringToArray,
    stringToUtf8Array,
    signMessage,
    arrayToHexString,
    SHA256,
    OpenPGPKey,
    SessionKey,
} from 'pmcrypto';
import { openpgp } from 'pmcrypto/lib/openpgp';
import { ReadableStream as PolyfillReadableStream } from 'web-streams-polyfill';
import { createReadableStreamWrapper } from '@mattiasbuelens/web-streams-adapter';

import { ENCRYPTION_CONFIGS, ENCRYPTION_TYPES } from '../constants';
import { generatePassphrase } from './calendarKeys';
import { createSessionKey, getEncryptedSessionKey } from '../calendar/encrypt';
import { uint8ArrayToBase64String } from '../helpers/encoding';

const toPolyfillReadable = createReadableStreamWrapper(PolyfillReadableStream);

interface UnsignedEncryptionPayload {
    message: string;
    publicKey: OpenPGPKey;
}

export const sign = async (data: string | Uint8Array, privateKeys: OpenPGPKey | OpenPGPKey[]) => {
    const { signature } = await signMessage({
        data,
        privateKeys,
        armor: true,
        detached: true,
    });
    return signature;
};

export const encryptUnsigned = async ({ message, publicKey }: UnsignedEncryptionPayload) => {
    const { data: encryptedToken } = await encryptMessage({
        data: message,
        publicKeys: publicKey,
    });
    return encryptedToken as string;
};

export const encryptName = async (name: string, parentPublicKey: OpenPGPKey, addressPrivateKey: OpenPGPKey) => {
    const { data: Name } = await encryptMessage({
        data: name,
        publicKeys: parentPublicKey,
        privateKeys: addressPrivateKey,
    });

    return Name;
};

export const getStreamMessage = (stream: ReadableStream<Uint8Array> | PolyfillReadableStream<Uint8Array>) => {
    return openpgp.message.read(toPolyfillReadable(stream) as ReadableStream<Uint8Array>);
};

interface UnsignedDecryptionPayload {
    armoredMessage: string | Uint8Array;
    privateKey: OpenPGPKey | OpenPGPKey[];
}

/**
 * Decrypts unsigned armored message, in the context of drive it's share's passphrase and folder's contents.
 */
export const decryptUnsigned = async ({ armoredMessage, privateKey }: UnsignedDecryptionPayload) => {
    const { data: decryptedMessage } = await decryptMessage({
        message: await getMessage(armoredMessage),
        privateKeys: privateKey,
    });

    return decryptedMessage as string;
};

export const generateDriveKey = async (rawPassphrase: string) => {
    const encryptionConfigs = ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.CURVE25519];
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name: 'Drive key' }],
        passphrase: rawPassphrase,
        ...encryptionConfigs,
    });

    await privateKey.decrypt(rawPassphrase);

    return { privateKey, privateKeyArmored };
};

export const generateLookupHash = async (name: string, hashKey: string) => {
    const key = await crypto.subtle.importKey(
        'raw',
        binaryStringToArray(hashKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );

    const signature = await crypto.subtle.sign(
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        key,
        stringToUtf8Array(name)
    );
    return arrayToHexString(new Uint8Array(signature));
};

export const generateNodeHashKey = async (publicKey: OpenPGPKey, addressPrivateKey: OpenPGPKey) => {
    const { data: NodeHashKey } = await encryptMessage({
        data: generatePassphrase(),
        publicKeys: publicKey,
        privateKeys: addressPrivateKey,
        detached: false,
    });

    return { NodeHashKey };
};

export const encryptPassphrase = async (
    parentKey: OpenPGPKey,
    addressKey: OpenPGPKey = parentKey,
    rawPassphrase = generatePassphrase(),
    passphraseSessionKey?: SessionKey
) => {
    const {
        data: NodePassphrase,
        signature: NodePassphraseSignature,
        sessionKey,
    } = await encryptMessage({
        data: rawPassphrase,
        privateKeys: addressKey,
        publicKeys: parentKey.toPublic(),
        detached: true,
        returnSessionKey: true,
        ...(passphraseSessionKey && { sessionKey: passphraseSessionKey }),
    });

    return { NodePassphrase, NodePassphraseSignature, sessionKey };
};

export const generateNodeKeys = async (parentKey: OpenPGPKey, addressKey: OpenPGPKey = parentKey) => {
    const rawPassphrase = generatePassphrase();
    const [{ NodePassphrase, NodePassphraseSignature, sessionKey }, { privateKey, privateKeyArmored: NodeKey }] =
        await Promise.all([encryptPassphrase(parentKey, addressKey, rawPassphrase), generateDriveKey(rawPassphrase)]);

    return { privateKey, NodeKey, NodePassphrase, NodePassphraseSignature, sessionKey };
};

export const generateContentHash = async (content: Uint8Array) => {
    const data = await SHA256(content);
    return { HashType: 'sha256', BlockHash: data };
};

export const generateContentKeys = async (nodeKey: OpenPGPKey, addressPrivateKey: OpenPGPKey) => {
    const publicKey = nodeKey.toPublic();
    const sessionKey = await createSessionKey(publicKey);
    const sessionKeySignature = await sign(sessionKey.data, addressPrivateKey);
    const contentKeys = await getEncryptedSessionKey(sessionKey, publicKey);
    const ContentKeyPacket = uint8ArrayToBase64String(contentKeys);
    return { sessionKey, ContentKeyPacket, ContentKeyPacketSignature: sessionKeySignature };
};

export const generateDriveBootstrap = async (addressPrivateKey: OpenPGPKey) => {
    const {
        NodeKey: ShareKey,
        NodePassphrase: SharePassphrase,
        privateKey: sharePrivateKey,
        NodePassphraseSignature: SharePassphraseSignature,
    } = await generateNodeKeys(addressPrivateKey);

    const {
        NodeKey: FolderKey,
        NodePassphrase: FolderPassphrase,
        privateKey: folderPrivateKey,
        NodePassphraseSignature: FolderPassphraseSignature,
    } = await generateNodeKeys(sharePrivateKey, addressPrivateKey);

    const FolderName = await encryptName('root', sharePrivateKey.toPublic(), addressPrivateKey);

    return {
        bootstrap: {
            SharePassphrase,
            SharePassphraseSignature,
            FolderPassphrase,
            FolderPassphraseSignature,
            ShareKey,
            FolderKey,
            FolderName,
        },
        sharePrivateKey,
        folderPrivateKey,
    };
};
