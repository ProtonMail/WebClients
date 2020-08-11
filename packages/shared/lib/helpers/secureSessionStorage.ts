import getRandomValues from 'get-random-values';

// Not using openpgp to allow using this without having to depend on openpgp being loaded
import { binaryStringToArray, arrayToBinaryString } from './string';
import { hasStorage as hasSessionStorage } from './sessionStorage';

/**
 * Partially inspired by http://www.thomasfrank.se/sessionvars.html
 * However, we aim to deliberately be non-persistent. This is useful for
 * data that wants to be preserved across refreshes, but is too sensitive
 * to be safely written to disk. Unfortunately, although sessionStorage is
 * deleted when a session ends, major browsers automatically write it
 * to disk to enable a session recovery feature, so using sessionStorage
 * alone is inappropriate.
 *
 * To achieve this, we do two tricks. The first trick is to delay writing
 * any possibly persistent data until the user is actually leaving the
 * page (onunload). This already prevents any persistence in the face of
 * crashes, and severely limits the lifetime of any data in possibly
 * persistent form on refresh.
 *
 * The second, more important trick is to split sensitive data between
 * window.name and sessionStorage. window.name is a property that, like
 * sessionStorage, is preserved across refresh and navigation within the
 * same tab - however, it seems to never be stored persistently. This
 * provides exactly the lifetime we want. Unfortunately, window.name is
 * readable and transferable between domains, so any sensitive data stored
 * in it would leak to random other websites.
 *
 * To avoid this leakage, we split sensitive data into two shares which
 * xor to the sensitive information but which individually are completely
 * random and give away nothing. One share is stored in window.name, while
 * the other share is stored in sessionStorage. This construction provides
 * security that is the best of both worlds - random websites can't read
 * the data since they can't access sessionStorage, while disk inspections
 * can't read the data since they can't access window.name. The lifetime
 * of the data is therefore the smaller lifetime, that of window.name.
 */

const deserialize = (string: string) => {
    try {
        return JSON.parse(string);
    } catch (e) {
        return {};
    }
};

const serialize = (data: any) => JSON.stringify(data);

const deserializeItem = (value: string | undefined) => {
    if (value === undefined) {
        return;
    }
    try {
        return binaryStringToArray(atob(value));
    } catch (e) {
        return undefined;
    }
};

const serializeItem = (value: Uint8Array) => {
    return btoa(arrayToBinaryString(value));
};

const saveSessionStorage = (keys: string[] = [], data: any) => {
    keys.forEach((key) => {
        const value = data[key];
        if (value === undefined) {
            return;
        }
        window.sessionStorage.setItem(key, value);
    }, {});
};

const readSessionStorage = (keys: string[] = []) => {
    return keys.reduce<{ [key: string]: any }>((acc, key) => {
        acc[key] = window.sessionStorage.getItem(key);
        window.sessionStorage.removeItem(key);
        return acc;
    }, {});
};

const mergePart = (serializedA: string | undefined, serializedB: string | undefined) => {
    const a = deserializeItem(serializedA);
    const b = deserializeItem(serializedB);
    if (a === undefined || b === undefined || a.length !== b.length) {
        return;
    }
    const xored = new Uint8Array(b.length);
    for (let j = 0; j < b.length; j++) {
        xored[j] = b[j] ^ a[j];
    }

    // Strip off padding
    let unpaddedLength = b.length;
    while (unpaddedLength > 0 && xored[unpaddedLength - 1] === 0) {
        unpaddedLength--;
    }

    return arrayToBinaryString(xored.slice(0, unpaddedLength));
};

export const mergeParts = (share1: any, share2: any) =>
    Object.keys(share1).reduce<{ [key: string]: string }>((acc, key) => {
        const value = mergePart(share1[key], share2[key]);
        if (value === undefined) {
            return acc;
        }
        acc[key] = value;
        return acc;
    }, {});

const separatePart = (value: string) => {
    const item = binaryStringToArray(value);
    const paddedLength = Math.ceil(item.length / 256) * 256;

    const share1 = getRandomValues(new Uint8Array(paddedLength));
    const share2 = new Uint8Array(share1);

    for (let i = 0; i < item.length; i++) {
        share2[i] ^= item[i];
    }

    return [serializeItem(share1), serializeItem(share2)];
};

export const separateParts = (data: any) =>
    Object.keys(data).reduce<{ share1: { [key: string]: any }; share2: { [key: string]: any } }>(
        (acc, key) => {
            const value = data[key];
            if (value === undefined) {
                return acc;
            }
            const [share1, share2] = separatePart(value);
            acc.share1[key] = share1;
            acc.share2[key] = share2;
            return acc;
        },
        { share1: {}, share2: {} }
    );

export const save = (keys: string[], data: any) => {
    if (!hasSessionStorage()) {
        return;
    }

    const { share1, share2 } = separateParts(data);

    window.name = serialize(share1);
    saveSessionStorage(keys, share2);
};

export const load = (keys: string[]) => {
    if (!hasSessionStorage()) {
        return {};
    }

    const nameStorage = deserialize(window.name);
    window.name = '';

    const sessionData = readSessionStorage(keys);

    return mergeParts(nameStorage, sessionData);
};

const SESSION_STORAGE_KEY = 'proton:storage';
export const save2 = (data: any) => {
    if (!hasSessionStorage()) {
        return;
    }
    const [share1, share2] = separatePart(JSON.stringify(data));
    window.name = serialize(share1);
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, share2);
};

export const load2 = () => {
    if (!hasSessionStorage()) {
        return {};
    }
    try {
        const share1 = deserialize(window.name);
        const share2 = window.sessionStorage.getItem(SESSION_STORAGE_KEY) || '';
        window.name = '';
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        const string = mergePart(share1, share2) || '';
        const parsedValue = JSON.parse(string) || {};
        if (parsedValue === Object(parsedValue)) {
            return parsedValue;
        }
        return {};
    } catch {
        return {};
    }
};
