import { c } from 'ttag';

import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import type { Maybe } from '@proton/pass/types';
import { AppStatus } from '@proton/pass/types';

export type PasswordTypeSwitch<T> = { extra: T; sso: T; default: T; twoPwd: T };
export type PasswordTypeConfig = Omit<PasswordTypeSwitch<boolean>, 'default'>;

export const passwordTypeSwitch =
    (config: PasswordTypeConfig) =>
    <T>(values: PasswordTypeSwitch<T>) => {
        if (config.extra) return values.extra;
        if (config.sso) return values.sso;
        if (config.twoPwd) return values.twoPwd;
        return values.default;
    };

export const getInvalidPasswordString = (authStore: AuthStore) => {
    /** Only web & desktop can use the user's second password as an unlock
     * mechanism. Any password verification done in the extension must go
     * through SRP to validate the primary user password. */
    const twoPwd = !EXTENSION_BUILD && authStore.getTwoPasswordMode();
    const extra = authStore.getExtraPassword();
    const sso = authStore.getSSO();

    return passwordTypeSwitch({ extra, sso, twoPwd })({
        default: c('Error').t`Wrong password`,
        extra: c('Error').t`Wrong extra password`,
        sso: c('Error').t`Wrong backup password`,
        twoPwd: c('Error').t`Wrong second password`,
    });
};

/** Resolves the locked `AppStatus` the app should sit in before unlock.
 *  - No offline crypto material → cannot lock locally
 *  - Offline + offline-mode disabled → cannot unlock locally
 *  - BIOMETRICS: prefers `BIOMETRICS_LOCKED` when `encryptedOfflineKD` exists,
 *    otherwise falls back to `PASSWORD_LOCKED` as recovery path
 *  - PASSWORD: `PASSWORD_LOCKED`.
 *  - SESSION / NONE (default): only locks when offline via `PASSWORD_LOCKED` */
export const getInitialLockedAppStatus = (
    authStore: AuthStore,
    params: { offlineEnabled: boolean; offline: boolean }
): Maybe<AppStatus> => {
    const lockMode = authStore.getLockMode();
    const encryptedOfflineKD = authStore.getEncryptedOfflineKD();

    if (!authStore.hasOfflineComponents()) return;
    if (params.offline && !params.offlineEnabled) return;

    switch (lockMode) {
        case LockMode.BIOMETRICS:
            return encryptedOfflineKD ? AppStatus.BIOMETRICS_LOCKED : AppStatus.PASSWORD_LOCKED;
        case LockMode.PASSWORD:
            return AppStatus.PASSWORD_LOCKED;
        default:
            if (params.offline) return AppStatus.PASSWORD_LOCKED;
            break;
    }
};
