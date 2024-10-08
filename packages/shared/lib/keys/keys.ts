import type { KeyReference, PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { computeKeyPassword, generateKeySalt } from '@proton/srp';

import { extractEmailFromUserID } from '../helpers/email';
import type { Key, KeyPair, KeySalt as tsKeySalt } from '../interfaces';

export const generateKeySaltAndPassphrase = async (password: string) => {
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
    return keys.reduce<{ privateKeys: PrivateKeyReference[]; publicKeys: PublicKeyReference[] }>(
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
    return CryptoProxy.importPrivateKey({ armoredKey: PrivateKey, passphrase: keyPassword });
};

export const getEmailFromKey = (key: KeyReference) => {
    const [userID] = key.getUserIDs();
    return extractEmailFromUserID(userID);
};
