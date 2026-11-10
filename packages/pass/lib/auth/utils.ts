import { c } from 'ttag';

import type { Maybe } from '../../types/utils';
import { AppStatus } from '../../types/worker/state';
import { LockMode } from './lock/types';
import type { AuthStore } from './store';

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
 *  - BIOMETRICS where the platform binds the key to the app (`keyAppBound`): the
 *    envelope is decrypted with the biometric key, so `BIOMETRICS_LOCKED` when it is
 *    present and `PASSWORD_LOCKED` as the recovery path when it is missing.
 *  - BIOMETRICS where nothing is app-bound (e.g. Windows): no key is stored at rest —
 *    the biometric lock is a UI lock, the gesture checked inside the unlock adapter. The lock screen
 *    still shows so the user expects to authenticate; an offline boot falls back to
 *    `PASSWORD_LOCKED`, verified against the password-derived offline components.
 *    The platform capability is the discriminator here, never envelope presence: a
 *    missing envelope on an app-bound platform means a broken lock, not a weaker model,
 *    and it sits outside the session digest.
 *  - PASSWORD: `PASSWORD_LOCKED`.
 *  - SESSION / NONE (default): only locks when offline via `PASSWORD_LOCKED` */
export const getInitialLockedAppStatus = (
    authStore: AuthStore,
    params: { offline: boolean; keyAppBound: boolean }
): Maybe<AppStatus> => {
    const lockMode = authStore.getLockMode();
    const encryptedOfflineKD = authStore.getEncryptedOfflineKD();

    if (!authStore.hasOfflineComponents()) return;

    switch (lockMode) {
        case LockMode.BIOMETRICS:
            if (params.keyAppBound) return encryptedOfflineKD ? AppStatus.BIOMETRICS_LOCKED : AppStatus.PASSWORD_LOCKED;
            return params.offline ? AppStatus.PASSWORD_LOCKED : AppStatus.BIOMETRICS_LOCKED;
        case LockMode.PASSWORD:
            return AppStatus.PASSWORD_LOCKED;
        default:
            if (params.offline) return AppStatus.PASSWORD_LOCKED;
            break;
    }
};
