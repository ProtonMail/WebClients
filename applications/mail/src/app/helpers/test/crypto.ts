import { getModelState } from '@proton/account/test';
import { CryptoProxy, PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { generatePassphrase } from '@proton/shared/lib/calendar/crypto/keys/calendarKeys';
import { KEYGEN_CONFIGS, KEYGEN_TYPES, KEY_FLAG } from '@proton/shared/lib/constants';
import { DecryptedAddressKey } from '@proton/shared/lib/interfaces';

import { base64ToArray } from '../base64';
import { addApiMock } from './api';

export interface GeneratedKey {
    name: string;
    email: string;
    publicKeyArmored: string;
    privateKeyArmored: string;
    publicKeys: PublicKeyReference[];
    privateKeys: PrivateKeyReference[];
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
        console.log('api keys', args, email);
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

export const getStoredKey = (key: GeneratedKey | undefined): DecryptedAddressKey[] => {
    return key
        ? [{ ID: '123', publicKey: key.publicKeys[0], privateKey: key.privateKeys[0], Flags: 0, Primary: 0 }]
        : [];
};

export const getAddressKeyCache = (id: string, key: Parameters<typeof getStoredKey>[0]) => {
    return {
        [id]: getModelState(getStoredKey(key)),
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
    const useV6Canary = Math.random() < 0.5;
    // dynamic import to avoid loading the library unless required
    const { Api: CryptoApi } = useV6Canary
        ? await import('@proton/crypto/lib/worker/api_v6_canary')
        : await import('@proton/crypto/lib/worker/api');
    CryptoApi.init({});
    CryptoProxy.setEndpoint(
        // @ts-ignore the v6 canary is effectively compatible
        new CryptoApi(),
        (endpoint) => endpoint.clearKeyStore()
    );
}

export function releaseCryptoProxy() {
    return CryptoProxy.releaseEndpoint();
}
