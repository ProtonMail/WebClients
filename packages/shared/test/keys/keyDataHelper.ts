import { CryptoProxy, toPublicKeyReference, PrivateKeyReference } from '@proton/crypto';
import { generateAddressKey, generateAddressKeyTokens, generateUserKey } from '../../lib/keys';
import { Key } from '../../lib/interfaces';
import { ENCRYPTION_CONFIGS, ENCRYPTION_TYPES } from '../../lib/constants';

const encryptionConfig = ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.CURVE25519];

export const getUserKey = async (ID: string, keyPassword: string, version = 3) => {
    const { privateKey, privateKeyArmored } = await generateUserKey({
        passphrase: keyPassword,
        encryptionConfig,
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
        encryptionConfig,
    });
    return getAddressKeyHelper(ID, userKey, key.privateKey, version);
};

export const getLegacyAddressKey = async (ID: string, password: string, email: string) => {
    const key = await generateAddressKey({
        email,
        passphrase: password,
        encryptionConfig,
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
