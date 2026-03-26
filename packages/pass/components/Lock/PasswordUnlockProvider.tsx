import { type FC, type PropsWithChildren, createContext, useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';

import type { Store } from 'redux';
import { c } from 'ttag';

import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { ReauthModal } from '@proton/pass/components/Lock/ReauthModal';
import { type UseAsyncModalHandle, useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import type { RequestForkOptions } from '@proton/pass/lib/auth/fork';
import type { ReauthActionPayload } from '@proton/pass/lib/auth/reauth';
import type { PasswordTypeSwitch } from '@proton/pass/lib/auth/utils';
import { passwordTypeSwitch } from '@proton/pass/lib/auth/utils';
import { selectHasTwoPasswordMode, selectIsSSO, selectPasswordTypeConfig } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { XorObfuscation } from '@proton/pass/utils/obfuscate/xor';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { PasswordModalState } from './PasswordModal';
import { PasswordModal, type PasswordModalProps } from './PasswordModal';

type PasswordUnlockContextValue = UseAsyncModalHandle<XorObfuscation, PasswordModalProps>;
const PasswordUnlockContext = createContext<PasswordUnlockContextValue>(async () => {});

export const usePasswordUnlock = () => useContext(PasswordUnlockContext);

/** Returns a password type switch function for use after app boot and state
 * hydration. Checks `hasOfflinePassword` to ensure i18n strings are only adapted
 * when the user can actually use their second password with a local verifier.
 * This matters for both SSO and two-password users during password verification.
 * NOTE: Requires unlocked session and hydrated app state */
export const usePasswordTypeSwitch = () => {
    const authStore = useAuthStore();
    const config = useMemoSelector(selectPasswordTypeConfig, [authStore]);
    return useCallback(passwordTypeSwitch(config), [config]);
};

/** Stable callback variant that reads state lazily from the store.
 * Use when outside `<ReduxProvider>` but with a store reference. */
export const useStablePasswordTypeSwitch = (store: Store<State>) => {
    const authStore = useAuthStore();

    return useCallback(<T,>(values: PasswordTypeSwitch<T>) => {
        const state = store.getState();
        const config = selectPasswordTypeConfig(authStore)(state);
        return passwordTypeSwitch(config)(values);
    }, []);
};

/** Returns a password type switch function for use before app boot and state
 * hydration. Use this to derive i18n strings when the session is password-locked
 * and hydrated state is unavailable. Assumes offline password checks have already
 * been performed: SSO or two-password users should never reach a password-lock
 * screen without a valid offline config/verifier.
 * NOTE: Only for pre-boot password-lock screens */
export const useAuthStorePasswordTypeSwitch = () => {
    const authStore = useAuthStore();
    const extra = Boolean(authStore?.getExtraPassword());
    const twoPwd = Boolean(authStore?.getTwoPasswordMode());
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

    const modal = useAsyncModalHandles<XorObfuscation, PasswordModalState>({ getInitialModalState });
    const { handler, abort, resolver, state, key } = modal;

    /** SSO and two-password users without an offline password must re-auth
     * via account to unlock. SSO users require account to verify their backup
     * password; two-password users need it to retrieve user salts for second
     * password verification (pass scope alone is insufficient). */
    const shouldReauth = (sso || (twoPwd && !state.reauth?.srpDowngrade)) && !hasOfflinePassword;
    const Component = shouldReauth ? ReauthModal : PasswordModal;

    return (
        <PasswordUnlockContext.Provider value={handler}>
            {children}
            {state.open && <Component onReauth={onReauth} onSubmit={resolver} onClose={abort} {...state} key={key} />}
        </PasswordUnlockContext.Provider>
    );
};
