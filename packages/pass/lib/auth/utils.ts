import { c } from 'ttag';

import type { AuthStore } from '@proton/pass/lib/auth/store';

type PasswordTypeSwitch<T> = { extra: T; sso: T; default: T };

export const passwordTypeSwitch =
    (hasExtraPassword: boolean, isSSO: boolean) =>
    <T>(values: PasswordTypeSwitch<T>) => {
        if (hasExtraPassword) return values.extra;
        if (isSSO) return values.sso;
        return values.default;
    };

export const getInvalidPasswordString = (authStore: AuthStore) => {
    const hasExtraPassword = authStore.getExtraPassword();
    const isSSO = authStore.getSSO();

    return passwordTypeSwitch(
        hasExtraPassword,
        isSSO
    )({
        sso: c('Error').t`Wrong backup password`,
        extra: c('Error').t`Wrong extra password`,
        default: c('Error').t`Wrong password`,
    });
};
