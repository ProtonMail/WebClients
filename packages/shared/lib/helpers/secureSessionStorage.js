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

const serializeItem = (value) => {
    if (!value) {
        return;
    }
    return encodeBase64(arrayToBinaryString(value));
};

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

export const save = (key, data) => {
    const { share1, share2 } = separateParts(data);

    window.name = serialize(share1);
    window.sessionStorage.setItem(key, serialize(share2));
};

export const load = (key) => {
    const nameStorage = deserialize(window.name);
    window.name = '';

    const sessionData = deserialize(window.sessionStorage.getItem(key));
    window.sessionStorage.removeItem(key);

    return mergeParts(nameStorage, sessionData);
};
