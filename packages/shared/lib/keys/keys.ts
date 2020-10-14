import {
    decryptMessage,
    decryptPrivateKey,
    encryptPrivateKey,
    generateKey,
    getMessage,
    getSignature,
    OpenPGPKey,
    reformatKey,
    VERIFICATION_STATUS,
    getKeys,
} from 'pmcrypto';
import { c } from 'ttag';
import { computeKeyPassword, generateKeySalt } from 'pm-srp';

import { decryptMemberToken } from './memberToken';
import { CachedKey, EncryptionConfig, Key, KeySalt as tsKeySalt } from '../interfaces';

export const generateKeySaltAndPassphrase = async (password: string): Promise<{ salt: string; passphrase: string }> => {
    const salt = generateKeySalt();
    return {
        salt,
        passphrase: await computeKeyPassword(password, salt),
    };
};

/**
 * Given a list of keys and joining key salts, get the primary key and the corresponding key salt.
 * @param Keys - Keys as received from the API
 * @param KeySalts - KeySalts as received from the API
 */
export const getPrimaryKeyWithSalt = (Keys: Key[] = [], KeySalts: tsKeySalt[] = []) => {
    const { PrivateKey, ID } = Keys.find(({ Primary }) => Primary === 1) || {};
    const { KeySalt } = KeySalts.find(({ ID: keySaltID }) => ID === keySaltID) || {};

    // Not verifying that KeySalt exists because of old auth versions.
    return {
        PrivateKey,
        KeySalt,
    };
};

interface GenerateAddressKeyArguments {
    email: string;
    name?: string;
    passphrase: string;
    encryptionConfig: EncryptionConfig;
}
export const generateAddressKey = async ({
    email,
    name = email,
    passphrase,
    encryptionConfig,
}: GenerateAddressKeyArguments) => {
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name, email }],
        passphrase,
        ...encryptionConfig,
    });

    await privateKey.decrypt(passphrase);

    return { privateKey, privateKeyArmored };
};

interface ReformatAddressKeyArguments {
    email: string;
    name?: string;
    passphrase: string;
    privateKey: OpenPGPKey;
}
export const reformatAddressKey = async ({
    email,
    name = email,
    passphrase,
    privateKey: originalKey,
}: ReformatAddressKeyArguments) => {
    const { key: privateKey, privateKeyArmored } = await reformatKey({
        userIds: [{ name, email }],
        passphrase,
        privateKey: originalKey,
    });

    await privateKey.decrypt(passphrase);

    return { privateKey, privateKeyArmored };
};

/**
 * Decrypt an address key token and verify the detached signature.
 */
interface DecryptAddressKeyTokenArguments {
    Token: string;
    Signature: string;
    privateKeys: OpenPGPKey | OpenPGPKey[];
    publicKeys: OpenPGPKey | OpenPGPKey[];
}
export const decryptAddressKeyToken = async ({
    Token,
    Signature,
    privateKeys,
    publicKeys,
}: DecryptAddressKeyTokenArguments) => {
    const { data: decryptedToken, verified } = await decryptMessage({
        message: await getMessage(Token),
        signature: await getSignature(Signature),
        privateKeys,
        publicKeys,
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedToken;
};

export const splitKeys = (keys: CachedKey[] = []) => {
    return keys.reduce<{ privateKeys: OpenPGPKey[]; publicKeys: OpenPGPKey[] }>(
        (acc, { privateKey, publicKey }) => {
            if (!privateKey || !publicKey) {
                return acc;
            }
            acc.publicKeys.push(publicKey);
            acc.privateKeys.push(privateKey);
            return acc;
        },
        { publicKeys: [], privateKeys: [] }
    );
};

interface GetAddressKeyTokenArguments {
    Token: string;
    Signature: string;
    organizationKey?: OpenPGPKey;
    privateKeys: OpenPGPKey | OpenPGPKey[];
    publicKeys: OpenPGPKey | OpenPGPKey[];
}
export const getAddressKeyToken = ({
    Token,
    Signature,
    organizationKey,
    privateKeys,
    publicKeys,
}: GetAddressKeyTokenArguments) => {
    // New address key format
    if (Signature) {
        return decryptAddressKeyToken({
            Token,
            Signature,
            privateKeys,
            // Verify against the organization key in case an admin is signed in to a non-private member.
            publicKeys: organizationKey ? [organizationKey.toPublic()] : publicKeys,
        });
    }
    if (!organizationKey) {
        throw new Error('Missing organization key');
    }
    // Old address key format for an admin signed into a non-private user
    return decryptMemberToken(Token, organizationKey);
};

export const decryptPrivateKeyWithSalt = async ({
    password,
    keySalt,
    PrivateKey,
}: {
    password: string;
    keySalt?: string;
    PrivateKey: string;
}) => {
    const keyPassword = keySalt ? await computeKeyPassword(password, keySalt) : password;
    return decryptPrivateKey(PrivateKey, keyPassword);
};

export const getOldUserIDEmail = async (PrivateKey: string): Promise<string> => {
    const [oldPrivateKey] = await getKeys(PrivateKey);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - openpgp typings are incorrect, todo
    const { email } = oldPrivateKey.users[0].userId;
    return email;
};

export const getEncryptedArmoredAddressKey = async (
    privateKey: OpenPGPKey | undefined,
    email: string,
    newKeyPassword: string
) => {
    if (!privateKey?.isDecrypted?.()) {
        return;
    }

    const userIds = privateKey.users;
    const primaryUserId = userIds?.[0]?.userId?.userid;

    if (userIds?.length !== 1 || !`${primaryUserId}`.endsWith(`<${email}>`)) {
        const { privateKeyArmored } = await reformatAddressKey({ email, passphrase: newKeyPassword, privateKey });
        return privateKeyArmored;
    }

    return encryptPrivateKey(privateKey, newKeyPassword);
};
