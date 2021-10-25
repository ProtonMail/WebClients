import { generatePassphrase } from '@proton/shared/lib/keys/calendarKeys';
import * as openpgp from 'openpgp';
import {
    OpenPGPKey,
    SessionKey,
    getMessage,
    getKeys,
    getPreferredAlgorithm,
    generateSessionKey as realGenerateSessionKey,
    encryptSessionKey as realEncryptSessionKey,
    decryptSessionKey as realDecryptSessionKey,
    splitMessage,
    generateKey,
    encryptMessage,
    createMessage,
    armorBytes,
} from 'pmcrypto';
import { ENCRYPTION_CONFIGS, ENCRYPTION_TYPES, KEY_FLAG, RECIPIENT_TYPES } from '@proton/shared/lib/constants';

import { addressKeysCache, resolvedRequest, cache } from './cache';
import { addApiMock } from './api';
import { base64ToArray } from '../base64';

const { TYPE_INTERNAL, TYPE_EXTERNAL } = RECIPIENT_TYPES;

export interface GeneratedKey {
    name: string;
    email: string;
    publicKeyArmored: string;
    privateKeyArmored: string;
    publicKeys: OpenPGPKey[];
    privateKeys: OpenPGPKey[];
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

export const generateKeys = async (name: string, email: string): Promise<GeneratedKey> => {
    const { publicKeyArmored, privateKeyArmored } = await openpgp.generateKey({
        userIds: [{ name, email }],
    });
    const publicKeys = await getKeys(publicKeyArmored);
    const privateKeys = await getKeys(privateKeyArmored);

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
    const { privateKeyArmored, publicKeyArmored } = await generateKey({
        userIds: [{ name: 'Calendar key' }],
        passphrase,
        ...ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.CURVE25519],
    });
    const publicKeys = await getKeys(publicKeyArmored);
    const privateKeys = await getKeys(privateKeyArmored);
    const { data, signature } = await encryptMessage({
        message: await createMessage(passphrase),
        publicKeys: addressPublicKeys,
        privateKeys: addressPrivateKeys,
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
            armored: await armorBytes(data),
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

export const encryptSessionKey = async ({ data, algorithm }: SessionKey, publicKey: OpenPGPKey) => {
    const { message } = await realEncryptSessionKey({ data, algorithm, publicKeys: [publicKey] });
    const { asymmetric } = await splitMessage(message);
    return asymmetric[0];
};

export const generateSessionKey = async (publicKey: OpenPGPKey) => {
    const algorithm = await getPreferredAlgorithm([publicKey]);
    const data = await realGenerateSessionKey(algorithm);
    return { data, algorithm } as SessionKey;
};

export const decryptSessionKey = async (keyPacket: string, privateKeys: OpenPGPKey[]) => {
    const sessionKeyMessage = await getMessage(base64ToArray(keyPacket));
    return (await realDecryptSessionKey({
        message: sessionKeyMessage,
        privateKeys,
    })) as SessionKey;
};
