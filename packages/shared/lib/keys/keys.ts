import { decryptPrivateKey, OpenPGPKey, getKeys } from 'pmcrypto';
import { computeKeyPassword, generateKeySalt } from 'pm-srp';

import { Key, KeyPair, KeySalt as tsKeySalt } from '../interfaces';

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
    const [{ ID, PrivateKey } = { ID: '', PrivateKey: '' }] = Keys;
    const { KeySalt } = KeySalts.find(({ ID: keySaltID }) => ID === keySaltID) || {};

    // Not verifying that KeySalt exists because of old auth versions.
    return {
        PrivateKey,
        KeySalt,
    };
};

export const splitKeys = (keys: Partial<KeyPair>[] = []) => {
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

export const getOldUserIDEmailHelper = (privateKey: OpenPGPKey) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - openpgp typings are incorrect, todo
    const { email } = privateKey.users[0].userId;
    return email;
};

export const getOldUserIDEmail = async (PrivateKey: string): Promise<string> => {
    const [privateKey] = await getKeys(PrivateKey);
    return getOldUserIDEmailHelper(privateKey);
};
