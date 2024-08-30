import { type FC, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useNotifications } from '@proton/components';
import { Icon } from '@proton/components/components/icon';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { AuthRouteState } from '@proton/pass/components/Navigation/routing';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useRerender } from '@proton/pass/hooks/useRerender';
import { useVisibleEffect } from '@proton/pass/hooks/useVisibleEffect';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { unlock } from '@proton/pass/store/actions';
import { unlockRequest } from '@proton/pass/store/actions/requests';
import type { MaybeNull } from '@proton/pass/types';
import { getBasename } from '@proton/shared/lib/authentication/pathnameHelper';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

type Props = { offlineEnabled?: boolean };

export const BiometricsUnlock: FC<Props> = ({ offlineEnabled }) => {
    const { createNotification } = useNotifications();

    const online = useConnectivity();
    const authStore = useAuthStore();
    const history = useHistory<MaybeNull<AuthRouteState>>();

    const biometricsUnlock = useRequest(unlock, { initialRequestId: unlockRequest() });
    const disabled = !online && !offlineEnabled;
    const [key, rerender] = useRerender();
    const { getBiometricsKey } = usePassCore();

    const onUnlock = useCallback(async () => {
        /** As booting offline will not trigger the AuthService::login
         * sequence we need to re-apply the redirection logic implemented
         * in the service's `onLoginComplete` callback */
        const secret = (await getBiometricsKey?.(authStore!).catch(noop)) ?? '';
        const localID = authStore?.getLocalID();
        history.replace(getBasename(localID) ?? '/', null);
        biometricsUnlock.dispatch({ mode: LockMode.BIOMETRICS, secret });
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

    useVisibleEffect(
        (visible) => {
            /** if user has triggered the lock - don't auto-prompt.  */
            const { userInitiatedLock = false } = history.location.state ?? {};

            /** If page is hidden away - remove the `userInitiatedLock` flag
             * to force biometrics prompt when re-opening the app */
            if (!visible && userInitiatedLock) history.replace({ ...history.location, state: null });

            /* Trigger unlock automatically on first render if the app is
             * focused and the current lock was not user initiated */
            if (!visible || biometricsUnlock.loading || !document.hasFocus()) return;
            if (!userInitiatedLock) onUnlock().catch(noop);
        },
        [biometricsUnlock.loading]
    );

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
            <Icon name="fingerprint" className="mr-1" />
            {c('Action').t`Unlock`}
        </Button>
    );
};
