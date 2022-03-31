import { generatePassphrase } from '@proton/shared/lib/keys/calendarKeys';
import { ENCRYPTION_CONFIGS, ENCRYPTION_TYPES, KEY_FLAG, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { CryptoProxy, PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';

import { addressKeysCache, resolvedRequest, cache } from './cache';
import { addApiMock } from './api';
import { base64ToArray } from '../base64';

const { TYPE_INTERNAL, TYPE_EXTERNAL } = RECIPIENT_TYPES;

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
    addApiMock('keys', (args) => {
        const email = args.params.Email;
        if (apiKeys.has(email)) {
            const apiKey = apiKeys.get(email) as ApiKey;
            return {
                RecipientType: apiKey.isInternal ? TYPE_INTERNAL : TYPE_EXTERNAL,
                Keys: apiKey.keys.map((key) => ({
                    Flags: KEY_FLAG.FLAG_NOT_OBSOLETE | KEY_FLAG.FLAG_NOT_COMPROMISED,
                    PublicKey: key.publicKeyArmored,
                })),
            };
        }
        console.log('api keys', args, email);
        return {};
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
        ...ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.CURVE25519],
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

export const addKeysToUserKeysCache = (key: GeneratedKey) => {
    cache.set('USER_KEYS', resolvedRequest([{ publicKey: key.publicKeys[0], privateKey: key.privateKeys[0] }]));
};

export const addKeysToAddressKeysCache = (addressID: string, key: GeneratedKey | undefined) => {
    const currentValue = addressKeysCache.get(addressID)?.value || [];
    const newValue = key ? [{ publicKey: key.publicKeys[0], privateKey: key.privateKeys[0] }] : [];
    addressKeysCache.set(addressID, resolvedRequest([...currentValue, ...newValue]));
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
