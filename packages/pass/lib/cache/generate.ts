import { PassCrypto } from '@proton/pass/lib/crypto';
import { encryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { selectCachableState } from '@proton/pass/store/selectors/cache';
import type { State } from '@proton/pass/store/types';
import { PassEncryptionTag } from '@proton/pass/types';
import type { EncryptedPassCache } from '@proton/pass/types/worker/cache';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

import { CACHE_SALT_LENGTH, encryptOfflineCacheKey, getCacheEncryptionKey } from './crypto';

type GenerateCacheOptions = {
    keyPassword: string;
    sessionLockToken?: string;
    offlineKD?: string;
};

export const generateCache =
    ({ keyPassword, sessionLockToken, offlineKD }: GenerateCacheOptions) =>
    async (state: State): Promise<EncryptedPassCache> => {
        const cache = JSON.stringify(selectCachableState(state));
        const snapshot = JSON.stringify(PassCrypto.serialize());

        const cacheSalt = crypto.getRandomValues(new Uint8Array(CACHE_SALT_LENGTH));
        const cacheKey = await getCacheEncryptionKey(keyPassword, cacheSalt, sessionLockToken);

        const encryptedCacheKey = offlineKD
            ? await encryptOfflineCacheKey(cacheKey, stringToUint8Array(offlineKD))
            : undefined;

        const encoder = new TextEncoder();

        const encryptedState: Uint8Array<ArrayBuffer> = await encryptData(cacheKey, encoder.encode(cache), PassEncryptionTag.Cache);
        const encryptedSnapshot = await encryptData(cacheKey, stringToUint8Array(snapshot), PassEncryptionTag.Cache);

        return {
            salt: uint8ArrayToString(cacheSalt),
            state: uint8ArrayToString(encryptedState),
            snapshot: uint8ArrayToString(encryptedSnapshot),
            encryptedCacheKey: encryptedCacheKey ? uint8ArrayToString(encryptedCacheKey) : undefined,
        };
    };
