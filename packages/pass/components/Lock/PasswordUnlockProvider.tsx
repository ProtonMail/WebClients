import { type FC, type PropsWithChildren, createContext, useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { type UseAsyncModalHandle, useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { selectExtraPasswordEnabled, selectIsSSO } from '@proton/pass/store/selectors';

import type { PasswordModalState } from './PasswordModal';
import { PasswordModal, type PasswordModalProps } from './PasswordModal';

type PasswordTypeSwitch<T> = { extra: T; sso: T; default: T };
type PasswordUnlockContextValue = UseAsyncModalHandle<string, PasswordModalProps>;
const PasswordUnlockContext = createContext<PasswordUnlockContextValue>(async () => {});

export const usePasswordUnlock = () => useContext(PasswordUnlockContext);

export const passwordTypeSwitch =
    (hasExtraPassword: boolean, isSSO: boolean) =>
    <T,>(values: PasswordTypeSwitch<T>) => {
        if (hasExtraPassword) return values.extra;
        if (isSSO) return values.sso;
        return values.default;
    };

export const usePasswordTypeSwitch = () => {
    const hasExtraPassword = useSelector(selectExtraPasswordEnabled);
    const isSSO = useSelector(selectIsSSO);
    return useCallback(passwordTypeSwitch(hasExtraPassword, isSSO), [hasExtraPassword, isSSO]);
};

export const PasswordUnlockProvider: FC<PropsWithChildren> = ({ children }) => {
    const passwordTypeSwitch = usePasswordTypeSwitch();

    const getInitialModalState = useCallback((): PasswordModalState => {
        const { message, title, label } = passwordTypeSwitch({
            extra: {
                label: c('Label').t`Extra password`,
                message: c('Info').t`Please confirm your extra password`,
                title: c('Title').t`Enter your extra password`,
            },
            sso: {
                label: c('Label').t`Backup password`,
                message: c('Info').t`Please confirm your backup password`,
                title: c('Title').t`Enter your backup password`,
            },
            default: {
                label: c('Label').t`Password`,
                message: c('Info').t`Please confirm your password`,
                title: c('Title').t`Enter your password`,
            },
        });

        return {
            label,
            message,
            placeholder: label,
            submitLabel: c('Action').t`Authenticate`,
            title,
            type: 'current-password',
        };
    }, [passwordTypeSwitch]);

    const modal = useAsyncModalHandles<string, PasswordModalState>({ getInitialModalState });
    const { handler, abort, resolver, state, key } = modal;

    return (
        <PasswordUnlockContext.Provider value={handler}>
            {children}
            <PasswordModal onSubmit={resolver} onClose={abort} {...state} key={key} />
        </PasswordUnlockContext.Provider>
    );
};
