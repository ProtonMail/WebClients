import { binaryStringToUint8Array, uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';

import { selectCachableState } from '../../store/selectors/cache';
import type { State } from '../../store/types';
import { PassEncryptionTag } from '../../types';
import type { EncryptedPassCache } from '../../types/worker/cache';
import { serialize } from '../../utils/object/serialize';
import { PassCrypto } from '../crypto';
import { encryptData } from '../crypto/utils/crypto-helpers';
import { CACHE_SALT_LENGTH, encryptOfflineCacheKey, getCacheEncryptionKey } from './crypto';

type GenerateCacheOptions = {
    keyPassword: string;
    sessionLockToken?: string;
    offlineKD?: string;
};

export const generateCache =
    ({ keyPassword, sessionLockToken, offlineKD }: GenerateCacheOptions) =>
    async (state: State): Promise<EncryptedPassCache> => {
        const cache = serialize(selectCachableState(state));
        const snapshot = JSON.stringify(PassCrypto.serialize());

        const cacheSalt = crypto.getRandomValues(new Uint8Array(CACHE_SALT_LENGTH));
        const cacheKey = await getCacheEncryptionKey(keyPassword, cacheSalt, sessionLockToken);

        const encryptedCacheKey = offlineKD
            ? await encryptOfflineCacheKey(cacheKey, binaryStringToUint8Array(offlineKD))
            : undefined;

        const encoder = new TextEncoder();

        const encryptedState: Uint8Array<ArrayBuffer> = await encryptData(
            cacheKey,
            encoder.encode(cache),
            PassEncryptionTag.Cache
        );
        const encryptedSnapshot = await encryptData(
            cacheKey,
            binaryStringToUint8Array(snapshot),
            PassEncryptionTag.Cache
        );

        return {
            salt: uint8ArrayToBinaryString(cacheSalt),
            state: uint8ArrayToBinaryString(encryptedState),
            snapshot: uint8ArrayToBinaryString(encryptedSnapshot),
            encryptedCacheKey: encryptedCacheKey ? uint8ArrayToBinaryString(encryptedCacheKey) : undefined,
        };
    };
