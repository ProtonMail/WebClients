import { c } from 'ttag';

import type { AuthStore } from '@proton/pass/lib/auth/store';

type PasswordTypeSwitch<T> = { extra: T; sso: T; default: T; twoPwd: T };
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
