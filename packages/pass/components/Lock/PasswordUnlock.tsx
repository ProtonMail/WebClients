import { type FC, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useNotifications } from '@proton/components/index';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useRerender } from '@proton/pass/hooks/useRerender';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { PasswordCredentials } from '@proton/pass/lib/auth/password';
import { validateCurrentPassword, validateExtraPassword } from '@proton/pass/lib/validation/auth';
import { unlock } from '@proton/pass/store/actions';
import { unlockRequest } from '@proton/pass/store/actions/requests';
import { getBasename } from '@proton/shared/lib/authentication/pathnameHelper';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { PasswordForm } from './PasswordForm';

type Props = { extraPassword: boolean; offlineEnabled?: boolean };

export const PasswordUnlock: FC<Props> = ({ extraPassword, offlineEnabled }) => {
    const { createNotification } = useNotifications();
    const online = useConnectivity();
    const authStore = useAuthStore();
    const history = useHistory();
    const passwordUnlock = useRequest(unlock, { initialRequestId: unlockRequest() });
    const disabled = !online && !offlineEnabled;
    const [key, rerender] = useRerender();

    const onSubmit = useCallback(({ password }: PasswordCredentials) => {
        /** As booting offline will not trigger the AuthService::login
         * sequence we need to re-apply the redirection logic implemented
         * in the service's `onLoginComplete` callback */
        const localID = authStore?.getLocalID();
        history.replace(getBasename(localID) ?? '/');
        passwordUnlock.dispatch({ mode: LockMode.PASSWORD, secret: password });
    }, []);

    useEffect(() => {
        if (!online) {
            rerender();

            if (offlineEnabled === false) {
                createNotification({
                    type: 'error',
                    text: c('Error')
                        .t`You're currently offline. Please resume connectivity in order to unlock ${PASS_SHORT_APP_NAME}.`,
                });
            }
        }
    }, [online, offlineEnabled]);

    return (
        <PasswordForm
            key={key}
            id="offline-unlock"
            disabled={disabled}
            loading={passwordUnlock.loading}
            submitLabel={!online && offlineEnabled ? c('Action').t`Continue offline` : c('Action').t`Continue`}
            onSubmit={onSubmit}
            onValidate={extraPassword ? validateExtraPassword : validateCurrentPassword}
        />
    );
};
