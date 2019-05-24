import { keysReducer } from './keysReducer';
import getSignedKeyList from './getSignedKeyList';
import {
    reactivateKeyAction,
    addKeyAction,
    setPrimaryKeyAction,
    removeKeyAction,
    setFlagsKeyAction
} from './keysReducerActions';
import {
    reactivateKeyRoute,
    createAddressKeyRoute,
    setKeyPrimaryRoute,
    setKeyFlagsRoute,
    removeKeyRoute
} from '../api/keys';
import { getReactivateKeyFlagsAddress, getReactivateKeyFlagsUser } from './keyFlags';

/**
 * Add a key to an address.
 * @param {Object} Address - The address result from the API
 * @param {Array<key>} keys - The old keys for this address
 * @param {Object} decryptedPrivateKey - The decrypted private key
 * @param {String} armoredPrivateKey - The armored key of the private key
 * @param {Function} api
 * @return {Promise<Object>}
 */
export const createAddressKeyHelper = async ({
    Address,
    keys,
    decryptedPrivateKey,
    armoredPrivateKey,
    api
}) => {
    const { ID: AddressID } = Address;

    const tempKeyID = 'PENDING';

    const newAddressKeys = keysReducer(keys, addKeyAction({
        ID: tempKeyID,
        flags: getReactivateKeyFlagsAddress(Address),
        decryptedPrivateKey
    }));
    const newKey = newAddressKeys.find(({ Key: { ID } }) => tempKeyID === ID);
    const { Key: { Primary } } = newKey;

    const signedKeyList = await getSignedKeyList(newAddressKeys);

    const route = createAddressKeyRoute({
        AddressID,
        Primary,
        PrivateKey: armoredPrivateKey,
        SignedKeyList: signedKeyList
    });

    const { Key } = await api(route);

    // Mutably update the key with the latest value from the API (sets the real ID etc).
    newKey.Key = Key;

    return newAddressKeys;
};

/**
 * Reactivate an address or contact key.
 * @param {Object} [Address] - The address as it's coming from the API
 * @param {Array<key>} keys - The old keys for this address (or user)
 * @param {String} keyID - The ID of the key
 * @param {Object} decryptedPrivateKey - The decrypted private key
 * @param {String} armoredPrivateKey - The armored key of the private key
 * @param {Function} api
 * @return {Promise<Object>}
 */
export const reactivateKeyHelper = async ({
    Address,
    keys,
    keyID,
    decryptedPrivateKey,
    armoredPrivateKey,
    api
}) => {
    const isAddressKey = !!Address;
    const flags = isAddressKey ? getReactivateKeyFlagsAddress(Address) : getReactivateKeyFlagsUser();

    const newKeys = keysReducer(keys, reactivateKeyAction({
        ID: keyID,
        flags,
        decryptedPrivateKey
    }));

    const signedKeyList = isAddressKey ? await getSignedKeyList(newKeys) : undefined;

    const route = reactivateKeyRoute({
        ID: keyID,
        PrivateKey: armoredPrivateKey,
        SignedKeyList: signedKeyList
    });

    await api(route);

    return newKeys;
};


/**
 * Set key as primary.
 * @param {Array<key>} keys - The old keys for this address
 * @param {String} keyID - ID of the key
 * @param {Function} api
 * @return {Promise<Object>}
 */
export const setKeyPrimaryHelper = async ({ keys, keyID, api }) => {
    const newAddressKeys = keysReducer(keys, setPrimaryKeyAction(keyID));

    const signedKeyList = await getSignedKeyList(newAddressKeys);

    const route = setKeyPrimaryRoute({
        ID: keyID,
        SignedKeyList: signedKeyList
    });

    await api(route);

    return newAddressKeys;
};

/**
 * Set key flags.
 * @param {Array<key>} keys - The old keys for this address
 * @param {String} keyID - ID of the key
 * @param {Number} flags - New flags for the key
 * @param {Function} api
 * @return {Promise<Object>}
 */
export const setKeyFlagsHelper = async ({ keys, keyID, flags, api }) => {
    const newAddressKeys = keysReducer(keys, setFlagsKeyAction(keyID, flags));

    const signedKeyList = await getSignedKeyList(newAddressKeys);

    const route = setKeyFlagsRoute({
        ID: keyID,
        Flags: flags,
        SignedKeyList: signedKeyList
    });

    await api(route);

    return newAddressKeys;
};

/**
 * Remove key from an address.
 * @param {Array<key>} keys - The old keys for this address
 * @param {String} keyID - ID of the key
 * @param {Function} api
 * @return {Promise<Object>}
 */
export const removeKeyHelper = async ({ keys, keyID, api }) => {
    const newAddressKeys = keysReducer(keys, removeKeyAction(keyID));

    const signedKeyList = await getSignedKeyList(newAddressKeys);

    const route = removeKeyRoute({
        ID: keyID,
        SignedKeyList: signedKeyList
    });

    await api(route);

    return newAddressKeys;
};
