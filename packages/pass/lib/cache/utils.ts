import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { Maybe } from '@proton/pass/types';

import type { OfflineConfig } from './crypto';

type PasswordUnlockOptions = {
    lockMode: LockMode;
    offline: boolean;
    offlineConfig: Maybe<OfflineConfig>;
    offlineEnabled: boolean;
    offlineVerifier: Maybe<string>;
    encryptedOfflineKD: Maybe<string>;
};
/** We consider that the user can unlock with his proton
 * password if we have an encrypted cache key & state and
 * an offline configuration. If the user is offline, allow
 * unlocking without checking the LockMode. */
export const canLocalUnlock = (options: PasswordUnlockOptions): boolean => {
    if (!(options.offlineConfig && options.offlineVerifier)) return false;
    if (options.offline) return options.offlineEnabled;
    if (options.lockMode === LockMode.BIOMETRICS) return Boolean(options.encryptedOfflineKD);
    if (options.lockMode === LockMode.PASSWORD) return true;
    return false;
};
