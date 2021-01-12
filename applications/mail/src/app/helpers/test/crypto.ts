import * as openpgp from 'openpgp';
import { init } from 'pmcrypto/lib/pmcrypto';
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
} from 'pmcrypto';
import { KEY_FLAG, RECIPIENT_TYPES } from 'proton-shared/lib/constants';

import { addressKeysCache, resolvedRequest, cache } from './cache';
import { addApiMock } from './api';
import { base64ToArray } from '../base64';

const { TYPE_INTERNAL, TYPE_EXTERNAL } = RECIPIENT_TYPES;

init(openpgp);

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

export const addKeysToUserKeysCache = (key: GeneratedKey) => {
    cache.set('USER_KEYS', resolvedRequest([{ publicKey: key.publicKeys[0], privateKey: key.privateKeys[0] }]));
};

export const addKeysToAddressKeysCache = (addressID: string, key: GeneratedKey) => {
    const currentValue = addressKeysCache.get(addressID);
    if (currentValue) {
        addressKeysCache.set(
            addressID,
            resolvedRequest([...currentValue.value, { publicKey: key.publicKeys[0], privateKey: key.privateKeys[0] }])
        );
    } else {
        addressKeysCache.set(
            addressID,
            resolvedRequest([{ publicKey: key.publicKeys[0], privateKey: key.privateKeys[0] }])
        );
    }
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
