import { keysReducer } from './keysReducer';
import {
    addKeyAction,
    reactivateKeyAction,
    removeKeyAction,
    setFlagsKeyAction,
    setPrimaryKeyAction
} from './keysReducerActions';

/**
 * Create a key.
 * @param {String} keyID - ID of the key
 * @param {Array<{Key, privateKey}>} keys - The list of initial keys
 * @param {Object} Address - Address result from the API
 * @param {Number} flags - New flags
 * @param {Object} privateKey - Private key from openpgp
 * @return {Array}
 */
export const createKey = ({ keys, keyID, flags, privateKey }) => {
    return keysReducer(keys, addKeyAction({ ID: keyID, flags, privateKey }));
};

/**
 * Reactivate a key.
 * @param {Array<{Key, privateKey}>} keys - The list of initial keys
 * @param {String} keyID - The ID of the key
 * @param {Number} flags - New flags
 * @param {Key} privateKey - The new decrypted private key
 * @return {Array}
 */
export const reactivateKey = ({ keys, keyID, flags, privateKey }) => {
    return keysReducer(keys, reactivateKeyAction({ ID: keyID, flags, privateKey }));
};

/**
 * Set a key as primary.
 * @param {Array<{Key, privateKey}>} keys - The list of initial keys
 * @param {String} keyID - ID of the key
 * @return {Array}
 */
export const setKeyPrimary = ({ keys, keyID }) => {
    return keysReducer(keys, setPrimaryKeyAction(keyID));
};

/**
 * Set flags on a key.
 * @param {Array<{Key, privateKey}>} keys - The list of initial keys
 * @param {String} keyID - ID of the key
 * @param {Number} flags - New flags
 * @return {Array}
 */
export const setKeyFlags = ({ keys, keyID, flags }) => {
    return keysReducer(keys, setFlagsKeyAction(keyID, flags));
};

/**
 * Remove a key.
 * @param {Array<{Key, privateKey}>} keys - The list of initial keys
 * @param {String} keyID - ID of the key
 * @return {Array}
 */
export const removeKey = ({ keys, keyID }) => {
    return keysReducer(keys, removeKeyAction(keyID));
};
