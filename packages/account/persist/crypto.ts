import { decryptData, encryptData } from '@proton/crypto/lib/subtle/aesGcm';
import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';
import { getClientKey } from '@proton/shared/lib/authentication/clientKey';

import type { DecryptedCache, EncryptedCache } from './db';

export const getEncryptedCache = async ({ clientKey, state }: { clientKey: string; state: string }) => {
    const key = await getClientKey(clientKey);
    return encryptData(key, stringToUtf8Array(state), stringToUtf8Array('cache'));
};

const decrypt = async <T>(options: { data: Uint8Array<ArrayBuffer>; key: CryptoKey }): Promise<T | undefined> => {
    if (!options.data) {
        return;
    }
    const decryptedData = await decryptData(options.key, new Uint8Array(options.data), stringToUtf8Array('cache'));
    return JSON.parse(utf8ArrayToString(decryptedData)) as T;
};

export const getDecryptedCache = async <T>(
    { state: encryptedState, appVersion }: Partial<EncryptedCache>,
    { clientKey }: { clientKey: string }
): Promise<DecryptedCache<T> | undefined> => {
    if (!encryptedState || !appVersion) {
        return;
    }
    const key = await getClientKey(clientKey);

    const state = await decrypt<T>({ data: encryptedState, key });

    if (!state) {
        return;
    }

    return { state, appVersion };
};
