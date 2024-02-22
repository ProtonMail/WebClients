import { type AuthStore } from '@proton/pass/lib/auth/store';
import { decryptData, getSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';
import type { Maybe } from '@proton/pass/types/utils';
import { type EncryptedPassCache } from '@proton/pass/types/worker/cache';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { getCacheEncryptionKey, getOfflineKeyDerivation } from './crypto';

/** Resolves the cache key using one of two methods based on provided parameters:
 * If a `loginPassword` is provided, the key is derived from the `encryptedCacheKey`
 * which requires generating the `offlineKey` the `offlineSalt` and the `offlineKD`.
 * Otherwise, the cache key is resolved from `keyPassword` and the cache key's salt */
export const getCacheKey = async (
    { encryptedCacheKey, salt }: Partial<EncryptedPassCache>,
    authStore: AuthStore,
    loginPassword?: string
): Promise<Maybe<CryptoKey>> => {
    const keyPassword = authStore.getPassword();
    const sessionLockToken = authStore.getLockToken();
    const offlineConfig = authStore.getOfflineConfig();

    if (loginPassword) {
        if (!(encryptedCacheKey && offlineConfig)) throw new Error('Missing offline encryption components');

        const { salt, params } = offlineConfig;
        const offlineKD = await getOfflineKeyDerivation(loginPassword, stringToUint8Array(salt), params);
        const offlineKey = await getSymmetricKey(offlineKD);

        const rawCacheKey = await decryptData(
            offlineKey,
            stringToUint8Array(encryptedCacheKey),
            PassEncryptionTag.Offline
        );

        return getSymmetricKey(rawCacheKey);
    }

    if (keyPassword && salt) return getCacheEncryptionKey(keyPassword, stringToUint8Array(salt), sessionLockToken);
};
