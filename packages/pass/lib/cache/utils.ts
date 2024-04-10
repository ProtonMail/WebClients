import { type AuthStore } from '@proton/pass/lib/auth/store';
import type { EncryptedPassCache } from '@proton/pass/types/worker/cache';

/** We consider that the user can unlock with his proton
 * password if we have an encrypted cache key and state as
 * well as an offline configuration */
export const canPasswordUnlock = (cache: Partial<EncryptedPassCache>, authStore: AuthStore): boolean =>
    Boolean(cache?.encryptedCacheKey) && Boolean(cache?.state) && authStore.getOfflineConfig() !== undefined;
