import { CryptoProxy, PrivateKeyReference, toPublicKeyReference } from '@proton/crypto';

import { KEYGEN_CONFIGS, KEYGEN_TYPES } from '../../lib/constants';
import { Key } from '../../lib/interfaces';
import { generateAddressKey, generateAddressKeyTokens, generateUserKey } from '../../lib/keys';

const keyGenConfig = KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519];

export const getUserKey = async (ID: string, keyPassword: string, version = 3) => {
    const { privateKey, privateKeyArmored } = await generateUserKey({
        passphrase: keyPassword,
        keyGenConfig,
    });
    return {
        key: {
            ID,
            privateKey,
            publicKey: await toPublicKeyReference(privateKey),
        },
        Key: {
            ID,
            PrivateKey: privateKeyArmored,
            Version: version,
        } as Key,
    };
};

export const getAddressKeyHelper = async (
    ID: string,
    userKey: PrivateKeyReference,
    privateKey: PrivateKeyReference,
    version = 3
) => {
    const result = await generateAddressKeyTokens(userKey);
    const privateKeyArmored = await CryptoProxy.exportPrivateKey({
        privateKey,
        passphrase: result.token,
    });
    return {
        key: {
            ID,
            privateKey,
            publicKey: await toPublicKeyReference(privateKey),
        },
        Key: {
            ID,
            PrivateKey: privateKeyArmored,
            Signature: result.signature,
            Token: result.encryptedToken,
            Version: version,
            Flags: 3,
        } as Key,
    };
};

export const getAddressKey = async (ID: string, userKey: PrivateKeyReference, email: string, version?: number) => {
    const key = await generateAddressKey({
        email,
        passphrase: 'tmp',
        keyGenConfig,
    });
    return getAddressKeyHelper(ID, userKey, key.privateKey, version);
};

export const getAddressKeyForE2EEForwarding = async (
    ID: string,
    userKey: PrivateKeyReference,
    email: string,
    version?: number
) => {
    const forwarderKey = await CryptoProxy.generateKey({
        userIDs: { email: 'forwarder@test.com' },
        curve: 'curve25519',
    });
    const { forwardeeKey: armoredKey } = await CryptoProxy.generateE2EEForwardingMaterial({
        forwarderKey,
        userIDsForForwardeeKey: { email },
        passphrase: '123',
    });
    const forwardeeKey = await CryptoProxy.importPrivateKey({ armoredKey, passphrase: '123' });
    return getAddressKeyHelper(ID, userKey, forwardeeKey, version);
};

export const getLegacyAddressKey = async (ID: string, password: string, email: string) => {
    const key = await generateAddressKey({
        email,
        passphrase: password,
        keyGenConfig,
    });
    return {
        key: {
            ID,
            privateKey: key.privateKey,
            publicKey: await toPublicKeyReference(key.privateKey),
        },
        Key: {
            ID,
            PrivateKey: key.privateKeyArmored,
            Version: 3,
        } as Key,
    };
};
