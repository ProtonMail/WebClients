import { type FC, type PropsWithChildren, createContext, useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { ReauthModal } from '@proton/pass/components/Lock/ReauthModal';
import { type UseAsyncModalHandle, useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import type { RequestForkOptions } from '@proton/pass/lib/auth/fork';
import type { ReauthActionPayload } from '@proton/pass/lib/auth/reauth';
import { passwordTypeSwitch } from '@proton/pass/lib/auth/utils';
import { selectExtraPasswordEnabled, selectHasTwoPasswordMode, selectIsSSO } from '@proton/pass/store/selectors';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { PasswordModalState } from './PasswordModal';
import { PasswordModal, type PasswordModalProps } from './PasswordModal';

type PasswordUnlockContextValue = UseAsyncModalHandle<string, PasswordModalProps>;
const PasswordUnlockContext = createContext<PasswordUnlockContextValue>(async () => {});

export const usePasswordUnlock = () => useContext(PasswordUnlockContext);

/** Should only be used once the app has booted and state hydrated */
export const usePasswordTypeSwitch = () => {
    /** Only web & desktop can use the user's second password as an unlock
     * mechanism. Any password verification done in the extension must go
     * through SRP to validate the primary user password. */
    const twoPwd = useSelector(selectHasTwoPasswordMode) && !EXTENSION_BUILD;
    const extra = useSelector(selectExtraPasswordEnabled);
    const sso = useSelector(selectIsSSO);

    return useCallback(passwordTypeSwitch({ extra, sso, twoPwd }), [extra, sso, twoPwd]);
};

/** Should only be used before the app has booted and state
 * has not been hydrated yet. Otherwise, prefer `usePasswordTypeSwitch` */
export const useAuthStorePasswordTypeSwitch = () => {
    const authStore = useAuthStore();
    const extra = Boolean(authStore?.getExtraPassword());
    const twoPwd = Boolean(authStore?.getTwoPasswordMode()) && !EXTENSION_BUILD;
    const sso = Boolean(authStore?.getSSO());

    return useCallback(passwordTypeSwitch({ extra, sso, twoPwd }), [extra, sso, twoPwd]);
};

export type OnReauthFn = (payload: ReauthActionPayload, forkOptions: Partial<RequestForkOptions>) => void;
export type PasswordUnlockProps = { onReauth?: OnReauthFn };

export const PasswordUnlockProvider: FC<PropsWithChildren<PasswordUnlockProps>> = ({ children, onReauth }) => {
    const authStore = useAuthStore();
    const passwordTypeSwitch = usePasswordTypeSwitch();

    const sso = useSelector(selectIsSSO);
    const twoPwd = useSelector(selectHasTwoPasswordMode);
    const hasOfflinePassword = Boolean(authStore?.hasOfflinePassword());

    /** SSO or two-pwd mode users which do not have an offline password
     * should trigger a re-auth via account when unlocking. For SSO users,
     * we cannot verify their backup-password without going through account.
     * Same for two-password mode users, the pass scope is insufficient to
     * retrieve the user salts in order to verify the second password */
    const shouldReauth = (sso || twoPwd) && !hasOfflinePassword;
    const Component = shouldReauth ? ReauthModal : PasswordModal;

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
            twoPwd: {
                label: c('Label').t`Second password`,
                message: c('Info').t`Please confirm your second password`,
                title: c('Title').t`Enter your second password`,
            },
            default: {
                label: c('Label').t`Password`,
                message: c('Info').t`Please confirm your password`,
                title: c('Title').t`Enter your ${BRAND_NAME} password`,
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
            {state.open && <Component onReauth={onReauth} onSubmit={resolver} onClose={abort} {...state} key={key} />}
        </PasswordUnlockContext.Provider>
    );
};
