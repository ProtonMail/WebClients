import { computeKeyPassword, generateKeySalt } from 'pm-srp';
import { encryptPrivateKey } from 'pmcrypto';
import { srpAuth, srpVerify } from 'proton-shared/lib/srp';
import { unlockPasswordChanges } from 'proton-shared/lib/api/user';
import { updatePassword } from 'proton-shared/lib/api/settings';
import { updatePrivateKeyRoute } from 'proton-shared/lib/api/keys';
import { noop } from 'proton-shared/lib/helpers/function';

/**
 * Encrypt a private key with a new password if it's decrypted.
 * @param {String} ID
 * @param {Object} privateKey
 * @param {String} newKeyPassword
 * @return {Promise}
 */
const getEncryptedArmoredKey = ({ Key: { ID }, privateKey }, newKeyPassword) => {
    if (!privateKey.isDecrypted()) {
        return;
    }
    return encryptPrivateKey(privateKey, newKeyPassword)
        .then((armoredPrivateKey) => {
            return { ID, PrivateKey: armoredPrivateKey };
        })
        .catch(noop);
};

/**
 * Encrypt the organization key with a new password if it exists.
 * @param {Object} organizationKey
 * @param {String} newKeyPassword
 * @return {Promise}
 */
const getEncryptedArmoredOrganizationKey = (organizationKey, newKeyPassword) => {
    if (!organizationKey || !organizationKey.isDecrypted()) {
        return;
    }
    return encryptPrivateKey(organizationKey, newKeyPassword).catch(noop);
};

/**
 * Get the new key salt and password.
 * @param {String} newPassword
 * @return {Promise}
 */
export const generateKeySaltAndPassword = async (newPassword) => {
    const newKeySalt = generateKeySalt();
    return {
        keySalt: newKeySalt,
        keyPassword: await computeKeyPassword(newPassword, newKeySalt)
    };
};

/**
 * Get all private keys encrypted with a new password.
 * @param {Array} userKeysList
 * @param {Object} addressesKeysMap
 * @param {Object} organizationKey
 * @param {String} keyPassword
 * @return {Promise}
 */
export const getArmoredPrivateKeys = async ({ userKeysList, addressesKeysMap, organizationKey, keyPassword }) => {
    const userKeysPromises = userKeysList.map((key) => getEncryptedArmoredKey(key, keyPassword));
    const userKeysAndAddressesKeysPromises = Object.keys(addressesKeysMap).reduce((acc, addressKey) => {
        return acc.concat(addressesKeysMap[addressKey].map((key) => getEncryptedArmoredKey(key, keyPassword)));
    }, userKeysPromises);

    const armoredKeys = (await Promise.all(userKeysAndAddressesKeysPromises)).filter(Boolean);

    // There should always be some decrypted in the mail application.
    if (armoredKeys.length === 0) {
        const decryptedError = new Error('No decrypted keys exist');
        decryptedError.name = 'NoDecryptedKeys';
        throw decryptedError;
    }

    return {
        armoredKeys,
        armoredOrganizationKey: await getEncryptedArmoredOrganizationKey(organizationKey, keyPassword)
    };
};

export const handleChangeMailboxPassword = ({ api, armoredKeys, armoredOrganizationKey, keySalt }) => {
    return api(
        updatePrivateKeyRoute({
            Keys: armoredKeys,
            OrganizationKey: armoredOrganizationKey,
            KeySalt: keySalt
        })
    );
};

export const handleChangeOnePassword = ({ api, armoredKeys, armoredOrganizationKey, keySalt, newPassword, totp }) => {
    return srpVerify({
        api,
        credentials: { password: newPassword, totp },
        config: updatePrivateKeyRoute({
            Keys: armoredKeys,
            OrganizationKey: armoredOrganizationKey,
            KeySalt: keySalt
        })
    });
};

export const handleUnlock = ({ api, oldPassword, totp }) => {
    return srpAuth({
        api,
        credentials: { password: oldPassword, totp },
        config: unlockPasswordChanges()
    });
};

export const handleChangeLoginPassword = async ({ api, newPassword, totp }) => {
    return srpVerify({
        api,
        credentials: { password: newPassword, totp },
        config: updatePassword()
    });
};
