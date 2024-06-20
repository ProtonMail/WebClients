import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { Maybe } from '@proton/pass/types';

import type { OfflineConfig } from './crypto';

type PasswordUnlockOptions = {
    lockMode: LockMode;
    offline: boolean;
    offlineConfig: Maybe<OfflineConfig>;
    offlineEnabled: boolean;
    offlineVerifier: Maybe<string>;
};
/** We consider that the user can unlock with his proton
 * password if we have an encrypted cache key & state and
 * an offline configuration. If the user is offline, allow
 * unlocking without checking the LockMode. */
export const canPasswordUnlock = (options: PasswordUnlockOptions): boolean => {
    if (!(options.offlineConfig && options.offlineVerifier)) return false;
    if (options.offline) return OFFLINE_SUPPORTED && options.offlineEnabled;
    return options.lockMode === LockMode.PASSWORD;
};
