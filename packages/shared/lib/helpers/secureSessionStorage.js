import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64 } from 'pmcrypto';
import getRandomValues from 'get-random-values';

const deserialize = (string) => {
    try {
        return JSON.parse(string);
    } catch (e) {
        return {};
    }
};

const serialize = (data) => JSON.stringify(data);

/**
 * Deserialize an item
 * @param {string} value
 * @return {Uint8Array}
 */
const deserializeItem = (value) => {
    if (!value) {
        return;
    }
    try {
        return binaryStringToArray(decodeBase64(value));
    } catch (e) {
        return undefined;
    }
};

/**
 * Serialize an item
 * @param {Uint8Array} value
 * @return {String}
 */
const serializeItem = (value) => {
    if (!value) {
        return;
    }
    return encodeBase64(arrayToBinaryString(value));
};

/**
 * TODO: Replace this with one key when the other apps have been updated.
 * @param {Array} keys
 * @param {Object} data
 */
const saveSessionStorage = (keys = [], data) => {
    keys.forEach((key) => {
        window.sessionStorage.setItem(key, serialize(data[key]));
    }, {});
};

/**
 * TODO: Replace this with one key when the other apps have been updated.
 * @param {Array} keys
 * @return {Object}
 */
const readSessionStorage = (keys = []) => {
    return keys.reduce((acc, key) => {
        acc[key] = deserialize(window.sessionStorage.getItem(key));
        window.sessionStorage.removeItem(key);
        return acc;
    }, {});
};

/**
 * Parts two parts into an object.
 * @param {Object} share1
 * @param {Object} share2
 * @return {Object}
 */
export const mergeParts = (share1, share2) =>
    Object.keys(share1).reduce((acc, key) => {
        const share1Value = deserializeItem(share1[key]);
        const share2Value = deserializeItem(share2[key]);

        if (!share1Value || !share2Value || share2Value.length !== share1Value.length) {
            return acc;
        }

        const xored = new Array(share2Value.length);

        for (let j = 0; j < share2Value.length; j++) {
            xored[j] = share2Value[j] ^ share1Value[j];
        }

        // Strip off padding
        let unpaddedLength = share2Value.length;
        while (unpaddedLength > 0 && xored[unpaddedLength - 1] === 0) {
            unpaddedLength--;
        }

        acc[key] = arrayToBinaryString(xored.slice(0, unpaddedLength));
        return acc;
    }, {});

/**
 * Separate an object in two parts.
 * @param {Object} data
 * @return {{share1: {}, share2: {}}}
 */
export const separateParts = (data) =>
    Object.keys(data).reduce(
        (acc, key) => {
            const item = binaryStringToArray(data[key]);
            const paddedLength = Math.ceil(item.length / 256) * 256;

            const share1 = getRandomValues(new Uint8Array(paddedLength));
            const share2 = new Uint8Array(share1);

            for (let i = 0; i < item.length; i++) {
                share2[i] ^= item[i];
            }

            acc.share1[key] = serializeItem(share1);
            acc.share2[key] = serializeItem(share2);

            return acc;
        },
        { share1: {}, share2: {} }
    );

/**
 * Save data to name storage and session storage.
 * @param {Array} keys
 * @param {Object} data
 */
export const save = (keys, data) => {
    const { share1, share2 } = separateParts(data);

    window.name = serialize(share1);
    saveSessionStorage(keys, share2);
};

/**
 * Load data from name storage and session storage.
 * @param {Array} keys
 * @return {Object}
 */
export const load = (keys) => {
    const nameStorage = deserialize(window.name);
    window.name = '';

    const sessionData = readSessionStorage(keys);

    return mergeParts(nameStorage, sessionData);
};
