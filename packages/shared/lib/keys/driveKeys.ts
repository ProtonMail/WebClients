import type { PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { signData as computeHmacSignature, importKey as importHmacKey } from '@proton/crypto/lib/subtle/hmac';
import { arrayToHexString, stringToUtf8Array } from '@proton/crypto/lib/utils';

import { createSessionKey, getEncryptedSessionKey } from '../calendar/crypto/encrypt';
import { generatePassphrase } from '../calendar/crypto/keys/calendarKeys';
import { KEYGEN_CONFIGS, KEYGEN_TYPES } from '../constants';
import { uint8ArrayToBase64String } from '../helpers/encoding';

interface UnsignedEncryptionPayload {
    message: string | Uint8Array<ArrayBuffer>;
    publicKey: PublicKeyReference;
}

export const sign = async (data: string | Uint8Array<ArrayBuffer>, privateKeys: PrivateKeyReference | PrivateKeyReference[]) => {
    const dataType = data instanceof Uint8Array ? 'binaryData' : 'textData';
    const signature = await CryptoProxy.signMessage({
        [dataType]: data,
        stripTrailingSpaces: dataType === 'textData',
        signingKeys: privateKeys,
        detached: true,
    });
    return signature;
};

export const encryptUnsigned = async ({ message, publicKey }: UnsignedEncryptionPayload) => {
    const dataType = message instanceof Uint8Array ? 'binaryData' : 'textData';
    const { message: encryptedToken } = await CryptoProxy.encryptMessage({
        [dataType]: message,
        stripTrailingSpaces: dataType === 'textData',
        encryptionKeys: publicKey,
    });
    return encryptedToken;
};

export const encryptName = async (
    name: string,
    parentPublicKey: PublicKeyReference,
    addressPrivateKey: PrivateKeyReference
) => {
    const { message: Name } = await CryptoProxy.encryptMessage({
        textData: name,
        stripTrailingSpaces: true,
        encryptionKeys: parentPublicKey,
        signingKeys: addressPrivateKey,
    });

    return Name;
};

interface UnsignedDecryptionPayload {
    armoredMessage: string;
    privateKey: PrivateKeyReference | PrivateKeyReference[];
}

interface SignedDecryptionPayload<F extends 'utf8' | 'binary'> extends UnsignedDecryptionPayload {
    publicKey: PublicKeyReference | PublicKeyReference[];
    format?: F;
}

export const decryptSigned = async <F extends 'utf8' | 'binary' = 'utf8'>({
    armoredMessage,
    privateKey,
    publicKey,
    format,
}: SignedDecryptionPayload<F>) => {
    const { data, verificationStatus } = await CryptoProxy.decryptMessage({
        armoredMessage,
        decryptionKeys: privateKey,
        verificationKeys: publicKey,
        format,
    });
    return { data, verificationStatus };
};

/**
 * Decrypts unsigned armored message, in the context of drive it's share's passphrase and folder's contents.
 */
export const decryptUnsigned = async ({ armoredMessage, privateKey }: UnsignedDecryptionPayload) => {
    const { data: decryptedMessage } = await CryptoProxy.decryptMessage({
        armoredMessage,
        decryptionKeys: privateKey,
    });

    return decryptedMessage;
};

export const generateDriveKey = async (rawPassphrase: string) => {
    const keyGenConfigs = KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519];
    const privateKey = await CryptoProxy.generateKey({
        userIDs: [{ name: 'Drive key' }],
        ...keyGenConfigs,
    });

    const privateKeyArmored = await CryptoProxy.exportPrivateKey({
        privateKey,
        passphrase: rawPassphrase,
    });

    return { privateKey, privateKeyArmored };
};

export const generateLookupHash = async (name: string, parentHashKey: Uint8Array<ArrayBuffer>) => {
    const key = await importHmacKey(parentHashKey);

    const signature = await computeHmacSignature(key, stringToUtf8Array(name));
    return arrayToHexString(signature);
};

export const generateNodeHashKey = async (publicKey: PublicKeyReference, addressPrivateKey: PrivateKeyReference) => {
    const { message: NodeHashKey } = await CryptoProxy.encryptMessage({
        // Once all clients can use non-ascii bytes, switch to simple
        // generating of random bytes without encoding it into base64:
        //binaryData: crypto.getRandomValues(new Uint8Array(32)),
        textData: generatePassphrase(),
        encryptionKeys: publicKey,
        signingKeys: addressPrivateKey,
    });

    return { NodeHashKey };
};

export const encryptPassphrase = async (
    parentKey: PrivateKeyReference | PrivateKeyReference[],
    addressKey: PrivateKeyReference | PrivateKeyReference[] = parentKey,
    rawPassphrase = generatePassphrase(),
    passphraseSessionKey?: SessionKey
) => {
    const sessionKey = passphraseSessionKey
        ? passphraseSessionKey
        : await CryptoProxy.generateSessionKey({ recipientKeys: parentKey });
    const { message: NodePassphrase, signature: NodePassphraseSignature } = await CryptoProxy.encryptMessage({
        textData: rawPassphrase,
        sessionKey,
        signingKeys: addressKey,
        encryptionKeys: parentKey,
        detached: true,
    });

    return { NodePassphrase, NodePassphraseSignature, sessionKey };
};

export const generateNodeKeys = async (parentKey: PrivateKeyReference, addressKey: PrivateKeyReference = parentKey) => {
    const rawPassphrase = generatePassphrase();
    const [{ NodePassphrase, NodePassphraseSignature, sessionKey }, { privateKey, privateKeyArmored: NodeKey }] =
        await Promise.all([encryptPassphrase(parentKey, addressKey, rawPassphrase), generateDriveKey(rawPassphrase)]);
    return { privateKey, NodeKey, NodePassphrase, NodePassphraseSignature, sessionKey };
};

export const generateShareKeys = async (linkNodeKey: PrivateKeyReference, addressKey: PrivateKeyReference) => {
    const rawPassphrase = generatePassphrase();
    const { privateKey, privateKeyArmored: NodeKey } = await generateDriveKey(rawPassphrase);
    const { NodePassphrase, NodePassphraseSignature, sessionKey } = await encryptPassphrase(
        [linkNodeKey, addressKey], // NodeKey always needs to be first
        addressKey,
        rawPassphrase
    );
    return { privateKey, NodeKey, NodePassphrase, NodePassphraseSignature, sessionKey };
};

export const generateContentHash = async (content: Uint8Array<ArrayBuffer>) => {
    const data = await CryptoProxy.computeHash({ algorithm: 'SHA256', data: content });
    return { HashType: 'sha256', BlockHash: data };
};

export const generateContentKeys = async (nodeKey: PrivateKeyReference) => {
    const publicKey: PublicKeyReference = nodeKey; // no need to get a separate public key reference in this case
    const sessionKey = await createSessionKey(publicKey);
    const sessionKeySignature = await sign(sessionKey.data, nodeKey);
    const contentKeys = await getEncryptedSessionKey(sessionKey, publicKey);
    const ContentKeyPacket = uint8ArrayToBase64String(contentKeys);
    return { sessionKey, ContentKeyPacket, ContentKeyPacketSignature: sessionKeySignature };
};

export const generateDriveBootstrap = async (addressPrivateKey: PrivateKeyReference) => {
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

    const FolderName = await encryptName('root', sharePrivateKey, addressPrivateKey);

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

export const generateAlbumsBootstrap = async (addressPrivateKey: PrivateKeyReference) => {
    const {
        NodeKey: ShareKey,
        NodePassphrase: SharePassphrase,
        privateKey: sharePrivateKey,
        NodePassphraseSignature: SharePassphraseSignature,
    } = await generateNodeKeys(addressPrivateKey);

    const {
        NodeKey: AlbumKey,
        NodePassphrase: FolderPassphrase,
        privateKey: albumPrivateKey,
        NodePassphraseSignature: FolderPassphraseSignature,
    } = await generateNodeKeys(sharePrivateKey, addressPrivateKey);

    const AlbumName = await encryptName('PhotosRoot', sharePrivateKey, addressPrivateKey);

    return {
        bootstrap: {
            SharePassphrase,
            SharePassphraseSignature,
            FolderPassphrase,
            FolderPassphraseSignature,
            ShareKey,
            AlbumKey,
            AlbumName,
        },
        sharePrivateKey,
        albumPrivateKey,
    };
};
