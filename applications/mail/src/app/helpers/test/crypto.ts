import { getModelState } from '@proton/account/test';
import type { PrivateKeyReference, PrivateKeyReferenceV4, PublicKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import type { MessageKeys } from '@proton/mail/store/messages/messagesTypes';
import { generatePassphrase } from '@proton/shared/lib/calendar/crypto/keys/calendarKeys';
import { KEYGEN_CONFIGS, KEYGEN_TYPES, KEY_FLAG } from '@proton/shared/lib/constants';
import type { Address, DecryptedAddressKey, DecryptedKey } from '@proton/shared/lib/interfaces';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys';

import { base64ToArray } from '../base64';
import { addApiMock } from './api';

export interface GeneratedKey {
    name: string;
    email: string;
    publicKeyArmored: string;
    privateKeyArmored: string;
    publicKeys: PublicKeyReference[];
    privateKeys: PrivateKeyReferenceV4[];
}

export interface ApiKey {
    isInternal: boolean;
    keys: GeneratedKey[];
}

export const apiKeys = new Map<string, ApiKey>();

const addApiKeysMock = () => {
    addApiMock('core/v4/keys/all', (args) => {
        const email = args.params.Email;
        if (apiKeys.has(email)) {
            const apiKey = apiKeys.get(email) as ApiKey;
            const publicKeysWithMetadata = apiKey.keys.map((key) => ({
                Flags: KEY_FLAG.FLAG_NOT_OBSOLETE | KEY_FLAG.FLAG_NOT_COMPROMISED,
                PublicKey: key.publicKeyArmored,
            }));
            const internalKeys = apiKey.isInternal ? publicKeysWithMetadata : [];
            const externalKeys = apiKey.isInternal ? [] : publicKeysWithMetadata;
            return {
                Address: {
                    Keys: internalKeys,
                    SignedKeyList: null,
                },
                Unverified: { Keys: externalKeys },
                ProtonMX: apiKey.isInternal,
            };
        }
        return { Address: { Keys: [] } };
    });
};

addApiKeysMock();

export const addApiKeys = (isInternal: boolean, email: string, keys: GeneratedKey[]) => {
    apiKeys.set(email, { isInternal, keys });
};

export const clearApiKeys = () => {
    apiKeys.clear();
    addApiKeysMock();
};

export const generateKeys = async (name: string, email: string, passphrase = 'passphrase'): Promise<GeneratedKey> => {
    const privateKey = await CryptoProxy.generateKey({
        userIDs: [{ name, email }],
    });
    const privateKeyArmored = await CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase });
    const publicKeyArmored = await CryptoProxy.exportPublicKey({ key: privateKey });
    const publicKeys = [await CryptoProxy.importPublicKey({ armoredKey: publicKeyArmored })];
    const privateKeys = [privateKey];
    return {
        name,
        email,
        publicKeyArmored,
        privateKeyArmored,
        publicKeys,
        privateKeys,
    };
};

export const fromGeneratedKeysToMessageKeys = (generatedKeys: GeneratedKey): MessageKeys => ({
    type: 'publicPrivate',
    encryptionKey: generatedKeys.privateKeys[0],
    signingKeys: [generatedKeys.privateKeys[0]],
    decryptionKeys: generatedKeys.privateKeys,
});

export const generateCalendarKeysAndPassphrase = async (addressKey: GeneratedKey | Promise<GeneratedKey>) => {
    const { publicKeys: addressPublicKeys, privateKeys: addressPrivateKeys } =
        addressKey instanceof Promise ? await addressKey : addressKey;
    const passphrase = generatePassphrase();
    const privateKey = await CryptoProxy.generateKey({
        userIDs: [{ name: 'Calendar key' }],
        ...KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519],
    });
    const privateKeyArmored = await CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase });
    const publicKeyArmored = await CryptoProxy.exportPublicKey({ key: privateKey });
    const publicKeys = [await CryptoProxy.importPublicKey({ armoredKey: publicKeyArmored })];
    const privateKeys = [privateKey];
    const { message: data, signature } = await CryptoProxy.encryptMessage({
        textData: passphrase,
        encryptionKeys: addressPublicKeys,
        signingKeys: addressPrivateKeys,
        detached: true,
    });

    return {
        calendarKey: {
            publicKeyArmored,
            privateKeyArmored,
            publicKeys,
            privateKeys,
        },
        passphrase: {
            clearText: passphrase,
            armored: data,
            signature,
        },
    };
};

export const getStoredUserKey = (key: GeneratedKey | undefined): DecryptedKey[] => {
    return key ? [{ ID: '123', publicKey: key.publicKeys[0], privateKey: key.privateKeys[0] }] : [];
};

export const getStoredAddressKey = (address: Address, keys: GeneratedKey[] | undefined): DecryptedAddressKey[] => {
    if (!keys) {
        return [];
    }

    if (address.Keys.length < keys.length) {
        throw new Error('Missing address.Keys entry');
    }

    return keys.map((key, index) => ({
        ID: address.Keys[index].ID,
        publicKey: key.publicKeys[0],
        privateKey: key.privateKeys[0],
        Flags: address.Keys[index].Flags ?? getDefaultKeyFlags(address),
        Primary: address.Keys[index].Primary ?? 0,
    }));
};

export const getAddressKeyCache = (address: Address, keys: GeneratedKey[] | undefined) => {
    return {
        [address.ID]: getModelState(getStoredAddressKey(address, keys)),
    };
};

export const encryptSessionKey = async ({ data, algorithm }: SessionKey, publicKey: PublicKeyReference) => {
    const encryptedSessionKey = await CryptoProxy.encryptSessionKey({
        data,
        algorithm,
        encryptionKeys: [publicKey],
        format: 'binary',
    });
    return encryptedSessionKey;
};

export const generateSessionKey = async (publicKey: PublicKeyReference) => {
    const sessionKey = await CryptoProxy.generateSessionKey({ recipientKeys: publicKey });
    return sessionKey;
};

export const decryptSessionKey = async (keyPacket: string, privateKeys: PrivateKeyReference[]) => {
    const sessionKey = await CryptoProxy.decryptSessionKey({
        binaryMessage: base64ToArray(keyPacket),
        decryptionKeys: privateKeys,
    });
    return sessionKey as SessionKey;
};

/**
 * Load Crypto API outside of web workers, for testing purposes.
 */
export async function setupCryptoProxyForTesting() {
    // dynamic import to avoid loading the library unless required
    const { Api: CryptoApi } = await import('@proton/crypto/lib/worker/api');
    CryptoApi.init({});
    CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
}

export function releaseCryptoProxy() {
    return CryptoProxy.releaseEndpoint();
}
