import { getRandomValues, arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64 } from 'pmcrypto';

const storage = window.sessionStorage;

const loadName = () => {
    try {
        return JSON.parse(window.name);
    } catch (e) {
        return {};
    }
};

export const load = (whitelist) => {
    const nameStorage = loadName();
    window.name = '';

    const data = {};

    for (let i = 0; i < whitelist.length; i++) {
        const key = whitelist[i];

        if (!nameStorage.hasOwnProperty(key)) {
            continue;
        }

        let storageItem = storage.getItem(key);
        storage.removeItem(key);

        let nameItem = nameStorage[key];

        if (!storageItem || !nameItem) {
            continue;
        }

        try {
            storageItem = binaryStringToArray(decodeBase64(storageItem));
            nameItem = binaryStringToArray(decodeBase64(nameItem));
        } catch (e) {
            continue;
        }

        if (storageItem.length !== nameItem.length) {
            continue;
        }

        const xored = new Array(storageItem.length);

        for (let j = 0; j < storageItem.length; j++) {
            xored[j] = storageItem[j] ^ nameItem[j];
        }

        // Strip off padding
        let unpaddedLength = storageItem.length;

        while (unpaddedLength > 0 && xored[unpaddedLength - 1] === 0) {
            unpaddedLength--;
        }

        data[key] = arrayToBinaryString(xored.slice(0, unpaddedLength));
    }

    return data;
};

export const save = (data) => {
    const nameStorage = {};

    for (let key in data) {
        if (!data.hasOwnProperty(key)) {
            continue;
        }

        const item = binaryStringToArray(data[key]);
        const paddedLength = Math.ceil(item.length / 256) * 256;

        const share1 = getRandomValues(new Uint8Array(paddedLength));
        let share2 = new Uint8Array(share1);

        for (let i = 0; i < item.length; i++) {
            share2[i] ^= item[i];
        }

        nameStorage[key] = encodeBase64(arrayToBinaryString(share1));
        storage.setItem(key, encodeBase64(arrayToBinaryString(share2)));
    }

    window.name = JSON.stringify(nameStorage);
};



