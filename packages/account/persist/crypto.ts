import { decryptData, encryptData } from '@proton/crypto/lib/subtle/aesGcm';
import { utf8StringToUint8Array, uint8ArrayToUtf8String } from '@proton/crypto/lib/utils';
import { getClientKey } from '@proton/shared/lib/authentication/clientKey';

import type { DecryptedCache, EncryptedCache } from './db';

export const getEncryptedCache = async ({ clientKey, state }: { clientKey: string; state: string }) => {
    const key = await getClientKey(clientKey);
    return encryptData(key, utf8StringToUint8Array(state), utf8StringToUint8Array('cache'));
};

const decrypt = async <T>(options: { data: Uint8Array<ArrayBuffer>; key: CryptoKey }): Promise<T | undefined> => {
    if (!options.data) {
        return;
    }
    const decryptedData = await decryptData(options.key, new Uint8Array(options.data), utf8StringToUint8Array('cache'));
    return JSON.parse(uint8ArrayToUtf8String(decryptedData)) as T;
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
