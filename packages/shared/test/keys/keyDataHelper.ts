import { OpenPGPKey } from 'pmcrypto';
import { generateAddressKey, generateAddressKeyTokens, generateUserKey } from '../../lib/keys';
import { Key } from '../../lib/interfaces';
import { ENCRYPTION_CONFIGS, ENCRYPTION_TYPES } from '../../lib/constants';

const encryptionConfig = ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.X25519];

export const getUserKey = async (ID: string, keyPassword: string) => {
    const { privateKey, privateKeyArmored } = await generateUserKey({
        passphrase: keyPassword,
        encryptionConfig,
    });
    return {
        key: {
            ID,
            privateKey,
            publicKey: privateKey.toPublic(),
        },
        Key: {
            ID,
            PrivateKey: privateKeyArmored,
            Version: 3,
        } as Key,
    };
};

export const getAddressKey = async (ID: string, userKey: OpenPGPKey, email: string) => {
    const result = await generateAddressKeyTokens(userKey);

    const key = await generateAddressKey({
        email,
        passphrase: result.token,
        encryptionConfig,
    });

    return {
        key: {
            ID,
            privateKey: key.privateKey,
            publicKey: key.privateKey.toPublic(),
        },
        Key: {
            ID,
            PrivateKey: key.privateKeyArmored,
            Signature: result.signature,
            Token: result.encryptedToken,
            Version: 3,
            Flags: 3,
        } as Key,
    };
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
            publicKey: key.privateKey.toPublic(),
        },
        Key: {
            ID,
            PrivateKey: key.privateKeyArmored,
            Version: 3,
        } as Key,
    };
};
