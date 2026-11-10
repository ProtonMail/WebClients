import { type FC, useCallback, useState } from 'react';
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
import { getBiometricsUnlockKey } from '../../lib/auth/lock/biometrics/adapter';
import { LockMode } from '../../lib/auth/lock/types';
import { unlock } from '../../store/actions/creators/auth';
import type { MaybeNull } from '../../types/utils';
import { UnlockDeclinedError } from '../../utils/errors/errors';
import { getErrorMessage } from '../../utils/errors/get-error-message';
import { logger } from '../../utils/logger';
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
    const core = usePassCore();
    const [declined, setDeclined] = useState(false);
    const [reading, setReading] = useState(false);
    const loading = reading || biometricsUnlock.loading;

    const onUnlock = useCallback(async () => {
        setDeclined(false);
        setReading(true);

        try {
            /** A prompt dismissed or failed before the platform released the key is not
             * a failed attempt: nothing is dispatched, so no retry is counted. Only a
             * failure is reported, a dismissed prompt is the user's own choice. */
            const key = await getBiometricsUnlockKey(core, authStore!).catch((err: Error) => {
                setDeclined(true);

                if (err instanceof UnlockDeclinedError) logger.info('[BiometricsUnlock] unlock declined');
                else createNotification({ type: 'error', text: getErrorMessage(err) });

                return null;
            });

            if (key === null) return;

            /** As booting offline will not trigger the AuthService::login
             * sequence we need to re-apply the redirection logic implemented
             * in the service's `onLoginComplete` callback */
            const localID = authStore?.getLocalID();
            history.replace(getBasename(localID) ?? '/', null);
            biometricsUnlock.dispatch({ mode: LockMode.BIOMETRICS, key, offline });
        } finally {
            setReading(false);
        }
    }, [offline]);

    useUnlockGuard({ offlineEnabled, onOffline: rerender });

    /** A declined or failed attempt stops the automatic prompt: the user
     * retries with the button or signs out. Without it, the prompt would
     * reopen as soon as the request settles or the window regains focus. */
    useAutoUnlock({ loading, onUnlock, error: declined || biometricsUnlock.error });

    return (
        <Button
            key={key}
            pill
            shape="solid"
            color="norm"
            className="w-full"
            loading={loading}
            disabled={disabled}
            onClick={onUnlock}
        >
            {isMac() ? <IcFingerprint className="mr-1" /> : <IcPassLockmodeBiometrics className="mr-1" />}
            {c('Action').t`Unlock`}
        </Button>
    );
};
