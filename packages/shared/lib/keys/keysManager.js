import {
    decryptPrivateKey as decryptArmoredKey,
    encryptPrivateKey,
    generateKey,
    getKeys,
    reformatKey
} from 'pmcrypto';

import {
    createAddressKeyHelper,
    reactivateKeyHelper, removeKeyHelper,
    setKeyFlagsHelper,
    setKeyPrimaryHelper
} from './keysManagerActions';
import { findKeyByFingerprint } from './keysReducer';

/**
 * For a list of keys, create a keys manager that will allow to perform actions that affect the list of keys.
 * @param {Array} initialKeys
 * @param {Function} api
 * @return {Object}
 */
const createKeysManager = (initialKeys, api) => {
    if (!initialKeys || !Array.isArray(initialKeys)) {
        throw new Error('Initial keys needed');
    }
    if (!api) {
        throw new Error('API function needed');
    }

    let oldKeys = initialKeys;

    const setKeys = (result) => {
        oldKeys = result;
    };

    /**
     * Create a key.
     * @param {Object} Address - Address result from the API
     * @param {String} password - Password to encrypt the key with
     * @param {Object} encryptionConfig - The encryption config to use
     * @return {Promise}
     */
    const createAddressKey = async ({
        Address,
        password,
        encryptionConfig
    }) => {
        const { Email } = Address;

        const { key: privateKey, privateKeyArmored: armoredPrivateKey } = await generateKey({
            userIds: [{ name: Email, email: Email }],
            passphrase: password,
            ...encryptionConfig
        });

        await privateKey.decrypt(password);

        const newKeys = await createAddressKeyHelper({
            Address,
            decryptedPrivateKey: privateKey,
            armoredPrivateKey,
            keys: oldKeys,
            api
        });

        setKeys(newKeys);

        return { privateKey, armoredPrivateKey };
    };

    /**
     * Reactivate a key.
     * @param {Object} Address - Address result from the API
     * @param {String} password - Password to encrypt the key with
     * @param {Key} oldDecryptedPrivateKey - The decrypted imported key
     * @return {Promise}
     */
    const reactivateKey = async ({
        Address,
        password,
        oldDecryptedPrivateKey
    }) => {
        const fingerprint = oldDecryptedPrivateKey.getFingerprint();
        const maybeOldKeyContainer = findKeyByFingerprint(oldKeys, fingerprint);

        if (!maybeOldKeyContainer) {
            throw new Error('Key does not exist');
        }

        if (maybeOldKeyContainer.privateKey.isDecrypted()) {
            throw new Error('Key is already decrypted');
        }

        const armoredPrivateKey = await encryptPrivateKey(oldDecryptedPrivateKey, password);
        const decryptedPrivateKey = await decryptArmoredKey(armoredPrivateKey, password);

        const newKeys = await reactivateKeyHelper({
            keys: oldKeys,
            api,
            Address,
            keyID: maybeOldKeyContainer.Key.ID,
            decryptedPrivateKey,
            armoredPrivateKey
        });

        setKeys(newKeys);
    };

    /**
     * Reactivate a key by importing a backup key.
     * @param {Object} [Address]
     * @param {String} password - Password to encrypt the key with
     * @param {Key} uploadedPrivateKey - The uploaded key
     * @return {Promise}
     */
    const reactivateKeyByImport = async ({
        Address,
        password,
        uploadedPrivateKey
    }) => {
        if (!uploadedPrivateKey.isDecrypted()) {
            throw new Error('Uploaded key is not decrypted');
        }

        const fingerprint = uploadedPrivateKey.getFingerprint();
        const oldKeyContainer = findKeyByFingerprint(oldKeys, fingerprint);

        if (!oldKeyContainer) {
            throw new Error('Key does not exist');
        }

        if (oldKeyContainer.privateKey.isDecrypted()) {
            throw new Error('Key is already decrypted');
        }

        const { Key: { ID: keyID, PrivateKey } } = oldKeyContainer;

        // When reactivating a key by importing it, get the email from the old armored private key to ensure it's correct for the contact keys
        const [oldPrivateKey] = await getKeys(PrivateKey);

        const { email } = oldPrivateKey.users[0].userId;

        const { key: reformattedPrivateKey, privateKeyArmored: armoredPrivateKey } = await reformatKey({
            privateKey: uploadedPrivateKey,
            userIds: [{ name: email, email }],
            passphrase: password
        });

        await reformattedPrivateKey.decrypt(password);

        const newKeys = await reactivateKeyHelper({
            keys: oldKeys,
            api,
            Address,
            keyID,
            decryptedPrivateKey: reformattedPrivateKey,
            armoredPrivateKey
        });

        return setKeys(newKeys);
    };

    /**
     * Import a key, i.e. create or reactivate an old key to an address.
     * @param {Object} Address - Address result from the API
     * @param {Key} uploadedPrivateKey - The decrypted imported key
     * @param {String} password - The new password to encrypt the key with
     * @return {Promise}
     */
    const importKey = async ({
        Address,
        uploadedPrivateKey,
        password
    }) => {
        if (!uploadedPrivateKey.isDecrypted()) {
            throw new Error('Uploaded key is not decrypted');
        }

        const { Email } = Address;

        const maybeOldKeyContainer = findKeyByFingerprint(oldKeys, uploadedPrivateKey.getFingerprint());

        if (maybeOldKeyContainer) {
            return reactivateKeyByImport({ Address, uploadedPrivateKey, password });
        }

        const { key: privateKey, privateKeyArmored: armoredPrivateKey } = await reformatKey({
            privateKey: uploadedPrivateKey,
            userIds: [{ name: Email, email: Email }],
            passphrase: password
        });

        await privateKey.decrypt(password);

        const newKeys = await createAddressKeyHelper({
            keys: oldKeys,
            api,
            Address,
            decryptedPrivateKey: privateKey,
            armoredPrivateKey
        });

        setKeys(newKeys);
    };

    /**
     * Set a key as primary.
     * @param {String} keyID - ID of the key
     * @return {Promise}
     */
    const setKeyPrimary = async (keyID) => {
        const newKeys = await setKeyPrimaryHelper({
            keys: oldKeys,
            api,
            keyID
        });

        setKeys(newKeys);
    };

    /**
     * Set flags on a key.
     * @param {String} keyID - ID of the key
     * @param {Number} flags - New flags
     * @return {Promise}
     */
    const setKeyFlags = async (keyID, flags) => {
        const newKeys = await setKeyFlagsHelper({
            keys: oldKeys,
            api,
            keyID,
            flags
        });

        setKeys(newKeys);
    };

    /**
     * Remove a key.
     * @param {String} keyID - ID of the key
     * @return {Promise}
     */
    const removeKey = async (keyID) => {
        const newKeys = await removeKeyHelper({
            keys: oldKeys,
            api,
            keyID
        });

        setKeys(newKeys);
    };

    return {
        createAddressKey,
        reactivateKey,
        reactivateKeyByImport,
        importKey,
        setKeyPrimary,
        setKeyFlags,
        removeKey
    };
};

export default createKeysManager;
