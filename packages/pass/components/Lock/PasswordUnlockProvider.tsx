import { type FC, type PropsWithChildren, createContext, useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { SSOReauthModal } from '@proton/pass/components/Lock/SSOReauthModal';
import { type UseAsyncModalHandle, useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import type { RequestForkOptions } from '@proton/pass/lib/auth/fork';
import type { ReauthActionPayload } from '@proton/pass/lib/auth/reauth';
import { passwordTypeSwitch } from '@proton/pass/lib/auth/utils';
import { selectExtraPasswordEnabled, selectIsSSO } from '@proton/pass/store/selectors';

import type { PasswordModalState } from './PasswordModal';
import { PasswordModal, type PasswordModalProps } from './PasswordModal';

type PasswordUnlockContextValue = UseAsyncModalHandle<string, PasswordModalProps>;
const PasswordUnlockContext = createContext<PasswordUnlockContextValue>(async () => {});

export const usePasswordUnlock = () => useContext(PasswordUnlockContext);

export const usePasswordTypeSwitch = () => {
    const hasExtraPassword = useSelector(selectExtraPasswordEnabled);
    const isSSO = useSelector(selectIsSSO);
    return useCallback(passwordTypeSwitch(hasExtraPassword, isSSO), [hasExtraPassword, isSSO]);
};

export type OnReauthFn = (payload: ReauthActionPayload, forkOptions: Partial<RequestForkOptions>) => void;
export type PasswordUnlockProps = { onReauth?: OnReauthFn };

export const PasswordUnlockProvider: FC<PropsWithChildren<PasswordUnlockProps>> = ({ children, onReauth }) => {
    const authStore = useAuthStore();
    const passwordTypeSwitch = usePasswordTypeSwitch();

    /** SSO users which do not have an offline password should
     * trigger a re-auth via account when unlocking. */
    const isSSO = useSelector(selectIsSSO);
    const hasOfflinePassword = Boolean(authStore?.hasOfflinePassword());

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
    const Component = isSSO && !hasOfflinePassword ? SSOReauthModal : PasswordModal;

    return (
        <PasswordUnlockContext.Provider value={handler}>
            {children}
            {state.open && <Component onReauth={onReauth} onSubmit={resolver} onClose={abort} {...state} key={key} />}
        </PasswordUnlockContext.Provider>
    );
};
