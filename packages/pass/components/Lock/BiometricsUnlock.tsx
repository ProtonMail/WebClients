import { type FC, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { IcFingerprint } from '@proton/icons/icons/IcFingerprint';
import { IcPassLockmodeBiometrics } from '@proton/icons/icons/IcPassLockmodeBiometrics';
import { getBasename } from '@proton/shared/lib/authentication/pathnameHelper';
import { isMac } from '@proton/shared/lib/helpers/browser';

import { useAutoUnlock } from '../../hooks/auth/useAutoUnlock';
import { useUnlockGuard } from '../../hooks/auth/useUnlockGuard';
import { useRequest } from '../../hooks/useRequest';
import { useRerender } from '../../hooks/useRerender';
import { LockMode } from '../../lib/auth/lock/types';
import { unlock } from '../../store/actions';
import type { MaybeNull } from '../../types';
import { useAuthStore } from '../Core/AuthStoreProvider';
import { useOffline } from '../Core/ConnectivityProvider';
import { usePassCore } from '../Core/PassCoreProvider';
import type { AuthRouteState } from '../Navigation/routing';

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
            {isMac() ? <IcFingerprint className="mr-1" /> : <IcPassLockmodeBiometrics className="mr-1" />}
            {c('Action').t`Unlock`}
        </Button>
    );
};
