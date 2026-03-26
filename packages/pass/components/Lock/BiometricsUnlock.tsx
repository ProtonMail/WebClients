import { type FC, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { useOffline } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { AuthRouteState } from '@proton/pass/components/Navigation/routing';
import { useAutoUnlock } from '@proton/pass/hooks/auth/useAutoUnlock';
import { useUnlockGuard } from '@proton/pass/hooks/auth/useUnlockGuard';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { useRerender } from '@proton/pass/hooks/useRerender';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { unlock } from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';
import { getBasename } from '@proton/shared/lib/authentication/pathnameHelper';
import { isMac } from '@proton/shared/lib/helpers/browser';

type Props = { offlineEnabled?: boolean };

export const BiometricsUnlock: FC<Props> = ({ offlineEnabled }) => {
    const { createNotification } = useNotifications();
    const offline = useOffline();

    const authStore = useAuthStore();
    const history = useHistory<MaybeNull<AuthRouteState>>();

    const biometricsUnlock = useRequest(unlock, { initial: true });
    const disabled = offline && !offlineEnabled;
    const [key, rerender] = useRerender();
    const { getBiometricsKey } = usePassCore();

    const onUnlock = useCallback(async () => {
        /** As booting offline will not trigger the AuthService::login
         * sequence we need to re-apply the redirection logic implemented
         * in the service's `onLoginComplete` callback */
        const key =
            (await getBiometricsKey?.(authStore!).catch((err: Error) => {
                createNotification({ type: 'error', text: err.message });
            })) ?? '';

        const localID = authStore?.getLocalID();
        history.replace(getBasename(localID) ?? '/', null);
        biometricsUnlock.dispatch({ mode: LockMode.BIOMETRICS, key, offline });
    }, [offline]);

    useUnlockGuard({ offlineEnabled, onOffline: rerender });

    useAutoUnlock({ loading: biometricsUnlock.loading, onUnlock });

    return (
        <Button
            key={key}
            pill
            shape="solid"
            color="norm"
            className="w-full"
            loading={biometricsUnlock.loading}
            disabled={disabled}
            onClick={onUnlock}
        >
            <Icon name={isMac() ? 'fingerprint' : 'pass-lockmode-biometrics'} className="mr-1" />
            {c('Action').t`Unlock`}
        </Button>
    );
};
