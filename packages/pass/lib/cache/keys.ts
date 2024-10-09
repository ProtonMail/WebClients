import { type AuthStore } from '@proton/pass/lib/auth/store';
import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';
import type { Maybe } from '@proton/pass/types/utils';
import { type EncryptedPassCache } from '@proton/pass/types/worker/cache';
import { logger } from '@proton/pass/utils/logger';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { getCacheEncryptionKey } from './crypto';

/** Resolves the cache key using one of two methods based on provided parameters:
 * If a `loginPassword` is provided, the key is derived from the `encryptedCacheKey`
 * which requires generating the `offlineKey` the `offlineSalt` and the `offlineKD`.
 * Otherwise, the cache key is resolved from `keyPassword` and the cache key's salt */
export const getCacheKey = async (
    { encryptedCacheKey, salt }: Partial<EncryptedPassCache>,
    authStore: AuthStore
): Promise<Maybe<CryptoKey>> => {
    try {
        const keyPassword = authStore.getPassword();
        const sessionLockToken = authStore.getLockToken();
        const offlineKD = authStore.getOfflineKD();

        if (offlineKD && encryptedCacheKey) {
            const offlineKey = await importSymmetricKey(stringToUint8Array(offlineKD));
            const rawCacheKey = await decryptData(
                offlineKey,
                stringToUint8Array(encryptedCacheKey),
                PassEncryptionTag.Offline
            );

            return await importSymmetricKey(rawCacheKey);
        }

        if (keyPassword && salt) {
            return await getCacheEncryptionKey(keyPassword, stringToUint8Array(salt), sessionLockToken);
        }
    } catch (err) {
        logger.warn(`[Cache] cache key could not be resolved`);
    }
};
