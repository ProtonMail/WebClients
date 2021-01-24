import React from 'react';
import { c } from 'ttag';

import { LoginModel } from './interface';

export const getLoginSetters = (setState: React.Dispatch<React.SetStateAction<LoginModel>>) => {
    const getSetter = <K extends keyof LoginModel>(key: K) => (value: LoginModel[K]) =>
        setState((state) => ({ ...state, [key]: value }));
    return {
        username: getSetter('username'),
        password: getSetter('password'),
        newPassword: getSetter('newPassword'),
        confirmNewPassword: getSetter('confirmNewPassword'),
        totp: getSetter('totp'),
        keyPassword: getSetter('keyPassword'),
        isTotpRecovery: getSetter('isTotpRecovery'),
    } as const;
};

export type LoginSetters = ReturnType<typeof getLoginSetters>;

export const getLoginErrors = (state: LoginModel) => {
    const required = c('Error').t`This field is required`;
    return {
        username: state.username ? '' : required,
        password: state.password ? '' : required,
        newPassword: state.newPassword ? '' : required,
        keyPassword: state.keyPassword ? '' : required,
        confirmNewPassword: state.confirmNewPassword
            ? state.newPassword !== state.confirmNewPassword
                ? c('Signup error').t`Passwords do not match`
                : ''
            : required,
    } as const;
};

export type LoginErrors = ReturnType<typeof getLoginErrors>;
