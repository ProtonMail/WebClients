import { type AuthStore } from '@proton/pass/lib/auth/store';
import type { EncryptedPassCache } from '@proton/pass/types/worker/cache';

export const canOfflineUnlock = (cache: Partial<EncryptedPassCache>, authStore: AuthStore): boolean =>
    cache?.encryptedCacheKey !== undefined && cache?.state !== undefined && authStore.getOfflineConfig() !== undefined;
