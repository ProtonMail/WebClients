import { type FC, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { useOffline } from '@proton/pass/components/Core/ConnectivityProvider';
import { useUnlockGuard } from '@proton/pass/hooks/auth/useUnlockGuard';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { useRerender } from '@proton/pass/hooks/useRerender';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { PasswordCredentials } from '@proton/pass/lib/auth/password';
import { validateCurrentPassword, validateExtraPassword } from '@proton/pass/lib/validation/auth';
import { unlock } from '@proton/pass/store/actions';
import { getBasename } from '@proton/shared/lib/authentication/pathnameHelper';

import { PasswordForm } from './PasswordForm';

type Props = { extraPassword: boolean; offlineEnabled?: boolean };

export const PasswordUnlock: FC<Props> = ({ extraPassword, offlineEnabled }) => {
    const offline = useOffline();
    const authStore = useAuthStore();
    const history = useHistory();
    const passwordUnlock = useRequest(unlock, { initial: true });
    const disabled = offline && !offlineEnabled;
    const [key, rerender] = useRerender();

    const onSubmit = useCallback(
        ({ password }: PasswordCredentials) => {
            /** As booting offline will not trigger the AuthService::login
             * sequence we need to re-apply the redirection logic implemented
             * in the service's `onLoginComplete` callback */
            const localID = authStore?.getLocalID();
            history.replace(getBasename(localID) ?? '/');
            passwordUnlock.dispatch({ mode: LockMode.PASSWORD, secret: password, offline });
        },
        [offline]
    );

    useUnlockGuard({ offlineEnabled, onOffline: rerender });

    return (
        <PasswordForm
            key={key}
            autosavable
            disabled={disabled}
            id="offline-unlock"
            loading={passwordUnlock.loading}
            submitLabel={offline && offlineEnabled ? c('Action').t`Continue offline` : c('Action').t`Continue`}
            onSubmit={onSubmit}
            onValidate={extraPassword ? validateExtraPassword : validateCurrentPassword}
        />
    );
};
