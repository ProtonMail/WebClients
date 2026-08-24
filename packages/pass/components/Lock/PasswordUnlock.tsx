import { type FC, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { getBasename } from '@proton/shared/lib/authentication/pathnameHelper';

import { useUnlockGuard } from '../../hooks/auth/useUnlockGuard';
import { useRequest } from '../../hooks/useRequest';
import { useRerender } from '../../hooks/useRerender';
import { LockMode } from '../../lib/auth/lock/types';
import { validateCurrentPassword, validateExtraPassword } from '../../lib/validation/auth';
import { unlock } from '../../store/actions';
import type { XorObfuscation } from '../../utils/obfuscate/xor';
import { useAuthStore } from '../Core/AuthStoreProvider';
import { useOffline } from '../Core/ConnectivityProvider';
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
        (password: XorObfuscation) => {
            /** As booting offline will not trigger the AuthService::login
             * sequence we need to re-apply the redirection logic implemented
             * in the service's `onLoginComplete` callback */
            const localID = authStore?.getLocalID();
            history.replace(getBasename(localID) ?? '/');
            passwordUnlock.dispatch({ mode: LockMode.PASSWORD, password, offline });
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
