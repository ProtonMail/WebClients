import { decryptData, getCacheEncryptionKey } from '@proton/pass/crypto/utils';
import { browserLocalStorage } from '@proton/pass/extension/storage';
import { EncryptionTag, Maybe, PassCryptoSnapshot, SerializedCryptoContext } from '@proton/pass/types';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

import { State } from '../../types';

export type ExtensionCache = { state: State; snapshot: SerializedCryptoContext<PassCryptoSnapshot> };

const decrypt = async <T extends object>(options: {
    data: string | null;
    key: CryptoKey;
    useTextDecoder: boolean;
}): Promise<T | undefined> => {
    if (!options.data) {
        return;
    }

    try {
        const encryptedData = stringToUint8Array(options.data);
        const decryptedData = await decryptData(options.key, encryptedData, EncryptionTag.Cache);

        const decoder = new TextDecoder();
        return JSON.parse(
            options.useTextDecoder ? decoder.decode(decryptedData) : uint8ArrayToString(decryptedData)
        ) as T;
    } catch (e) {
        return;
    }
};

const getCachedState = async (sessionLockToken?: string): Promise<Maybe<ExtensionCache>> => {
    const encryptedDataString = await browserLocalStorage.getItem('state');
    const encryptedSnapshot = await browserLocalStorage.getItem('snapshot');
    const cacheSalt = await browserLocalStorage.getItem('salt');

    if (encryptedDataString && encryptedSnapshot && cacheSalt) {
        const cacheKey = await getCacheEncryptionKey(stringToUint8Array(cacheSalt), sessionLockToken);

        const [state, snapshot] = await Promise.all([
            decrypt<State>({ data: encryptedDataString, key: cacheKey, useTextDecoder: true }),
            decrypt<SerializedCryptoContext<PassCryptoSnapshot>>({
                data: encryptedSnapshot,
                key: cacheKey,
                useTextDecoder: false,
            }),
        ]);

        return state !== undefined && snapshot !== undefined ? { state, snapshot } : undefined;
    }

    return;
};

export default getCachedState;
