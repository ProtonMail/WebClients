import { decryptMessage, generateKey, getKeys, getMessage, getSignature, reformatKey } from 'pmcrypto';
import { VERIFICATION_STATUS } from 'pmcrypto/lib/constants';
import { c } from 'ttag';
import { computeKeyPassword, generateKeySalt } from 'pm-srp';

import { decryptMemberToken } from './memberToken';

/**
 * @param {String} password
 * @return {Promise<{salt, passphrase}>}
 */
export const generateKeySaltAndPassphrase = async (password) => {
    const salt = generateKeySalt();
    return {
        salt,
        passphrase: await computeKeyPassword(password, salt)
    };
};

/**
 * Get primary address or user key.
 * The API returns a sorted list, with the first key being the primary key.
 * @param {Array} keys - Keys array that has been prepared by `prepareKeys`
 * @return {Object}
 */
export const getPrimaryKey = (keys = []) => {
    return keys[0];
};

/**
 * Given a list of keys and joining key salts, get the primary key and the corresponding key salt.
 * @param {Array} Keys - Keys as received from the API
 * @param {Array} KeySalts - KeySalts as received from the API
 * @return {{PrivateKey, KeySalt}}
 */
export const getPrimaryKeyWithSalt = (Keys = [], KeySalts = []) => {
    const { PrivateKey, ID } = Keys.find(({ Primary }) => Primary === 1) || {};
    const { KeySalt } = KeySalts.find(({ ID: keySaltID }) => ID === keySaltID) || {};

    // Not verifying that KeySalt exists because of old auth versions.
    return {
        PrivateKey,
        KeySalt
    };
};

/**
 * @param {String} email
 * @param {String} [name=email]
 * @param {String} passphrase
 * @param {Object} encryptionConfig
 * @returns {Promise<{privateKeyArmored, privateKey}>}
 */
export const generateAddressKey = async ({ email, name = email, passphrase, encryptionConfig }) => {
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name, email }],
        passphrase,
        ...encryptionConfig
    });

    await privateKey.decrypt(passphrase);

    return { privateKey, privateKeyArmored };
};

/**
 * @param {String} email
 * @param {String} [name=email]
 * @param {String} passphrase
 * @param {Object} originalKey
 * @return {Promise<{privateKeyArmored, privateKey}>}
 */
export const reformatAddressKey = async ({ email, name = email, passphrase, privateKey: originalKey }) => {
    const { key: privateKey, privateKeyArmored } = await reformatKey({
        userIds: [{ name, email }],
        passphrase,
        privateKey: originalKey
    });

    await privateKey.decrypt(passphrase);

    return { privateKey, privateKeyArmored };
};

/**
 * Decrypt an address key token and verify the detached signature.
 * @param {String} Token
 * @param {String} Signature
 * @param {Array} privateKeys
 * @param {Array} publicKeys
 * @return {Promise<String>}
 */
export const decryptAddressKeyToken = async ({ Token, Signature, privateKeys, publicKeys }) => {
    const { data: decryptedToken, verified } = await decryptMessage({
        message: await getMessage(Token),
        signature: await getSignature(Signature),
        privateKeys,
        publicKeys
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedToken;
};

/**
 * NOTE: This function mutates the privateKey variable if it succeeds.
 * @param {PGPKey} privateKey
 * @param {String} keyPassword
 * @return {Promise}
 */
export const decryptPrivateKey = (privateKey, keyPassword) => {
    return privateKey
        .decrypt(keyPassword)
        .catch(() => {})
        .then((success) => {
            if (!success) {
                const error = new Error(c('Error').t`Incorrect decryption password`);
                error.name = 'PasswordError';
                throw error;
            }
        });
};

/**
 * @param {String} armoredPrivateKey
 * @param {String} keyPassword
 * @return {Promise}
 */
export const decryptPrivateKeyArmored = async (armoredPrivateKey, keyPassword) => {
    const [privateKey] = await getKeys(armoredPrivateKey);
    return decryptPrivateKey(privateKey, keyPassword).then(() => privateKey);
};

/**
 * @param {Array} keys
 * @param {Boolean} onlyDecrypted
 * @return {Object}
 */
export const splitKeys = (keys = [], onlyDecrypted = true) => {
    return keys.reduce(
        (acc, { privateKey, publicKey }) => {
            if (onlyDecrypted && !privateKey.isDecrypted()) {
                return acc;
            }
            acc.publicKeys.push(publicKey);
            acc.privateKeys.push(privateKey);
            return acc;
        },
        { publicKeys: [], privateKeys: [] }
    );
};

export const getAddressKeyToken = ({ Token, Signature, organizationKey, privateKeys, publicKeys }) => {
    // New address key format
    if (Signature) {
        return decryptAddressKeyToken({
            Token,
            Signature,
            privateKeys,
            // Verify against the organization key in case an admin is signed in to a non-private member.
            publicKeys: organizationKey ? [organizationKey.toPublic()] : publicKeys
        });
    }
    // Old address key format for an admin signed into a non-private user
    return decryptMemberToken(Token, organizationKey);
};

export const getUserKeyPassword = async ({ Token }, { organizationKey, keyPassword }) => {
    return Token
        ? // eslint-disable-next-line no-return-await
          await decryptMemberToken(Token, organizationKey)
        : keyPassword;
};

export const getAddressKeyPassword = async (
    { Token, Signature },
    { organizationKey, privateKeys, publicKeys, keyPassword }
) => {
    return Token
        ? // eslint-disable-next-line no-return-await
          await getAddressKeyToken({
              Token,
              Signature,
              organizationKey,
              privateKeys,
              publicKeys
          })
        : keyPassword;
};

export const decryptKeyWithFormat = async (Key, keyPassword) => {
    const { PrivateKey } = Key;
    const [privateKey] = await getKeys(PrivateKey).catch(() => []);
    try {
        await decryptPrivateKey(privateKey, keyPassword);
        return { Key, privateKey, publicKey: privateKey.toPublic() };
    } catch (e) {
        return { Key, privateKey, publicKey: privateKey.toPublic(), error: e };
    }
};
