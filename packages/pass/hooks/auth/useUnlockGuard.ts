import { useEffect } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { ConnectivityStatus } from '@proton/pass/lib/api/connectivity';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

export const useUnlockGuard = (opts: { offlineEnabled?: boolean; onOffline?: () => void }) => {
    const { offlineEnabled, onOffline } = opts;
    const { createNotification } = useNotifications();
    const connectivity = useConnectivity();

    useEffect(() => {
        if (connectivity !== ConnectivityStatus.ONLINE) {
            onOffline?.();

            if (offlineEnabled === false) {
                createNotification({
                    type: 'error',
                    text: (() => {
                        switch (connectivity) {
                            case ConnectivityStatus.OFFLINE:
                                return c('Error')
                                    .t`You're currently offline. Please resume connectivity to unlock ${PASS_SHORT_APP_NAME}.`;
                            case ConnectivityStatus.DOWNTIME:
                                return c('Error')
                                    .t`Servers are unreachable. Please try unlocking ${PASS_SHORT_APP_NAME} in a few minutes.`;
                        }
                    })(),
                });
            }
        }
    }, [connectivity, offlineEnabled]);
};
