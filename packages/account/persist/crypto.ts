import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';
import { getClientKey } from '@proton/shared/lib/authentication/clientKey';
import { decryptData, encryptData } from '@proton/shared/lib/authentication/cryptoHelper';

import { DecryptedCache, EncryptedCache } from './db';

export const getEncryptedCache = async ({ clientKey, state }: { clientKey: string; state: string }) => {
    const key = await getClientKey(clientKey);
    return encryptData(key, stringToUtf8Array(state), stringToUtf8Array('cache'));
};

const decrypt = async <T>(options: { data: ArrayBuffer; key: CryptoKey }): Promise<T | undefined> => {
    if (!options.data) {
        return;
    }
    const decryptedData = await decryptData(options.key, new Uint8Array(options.data), stringToUtf8Array('cache'));
    return JSON.parse(utf8ArrayToString(decryptedData)) as T;
};

export const getDecryptedCache = async <T>(
    { state: encryptedState, eventID, appVersion }: Partial<EncryptedCache>,
    { clientKey }: { clientKey: string }
): Promise<DecryptedCache<T> | undefined> => {
    if (!encryptedState || !eventID || !appVersion) {
        return;
    }
    const key = await getClientKey(clientKey);

    const state = await decrypt<T>({ data: encryptedState, key });

    if (!state) {
        return;
    }

    return { state, eventID, appVersion };
};
