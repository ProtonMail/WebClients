import { useEffect } from 'react';

import { useApi, useUser } from '@proton/components/hooks';
import { queryUserActivePing } from '@proton/shared/lib/api/drive/user';
import localStorageWithExpiry from '@proton/shared/lib/api/helpers/localStorageWithExpiry';
import { ACTIVE_PING_INTERVAL } from '@proton/shared/lib/drive/constants';

/*
    This hook is about pinging the api to tell that a user is active.
    The ping is sent maximum every 6 hours, regardless if the web app has been opened or closed during that time period.
    The ping can only be sent if the document is active, visible and in the foreground.

    Scenario 1:
        - Customer open the web app at T+0 -> active ping is sent 
        - Customer closes the web app
        - Customer open the web app T+5HOURS -> active is not sent since last ping was sent less than 6 hours ago
        - Customer leaves the tab open in the foreground (active) at T+6HOURS -> active ping is sent

    Scenario 2:
        - Customer open the web app at T+0 -> active ping is sent
        - Customer leaves the tab open in the background (not active) at T+6HOURS -> active ping is not sent since customer web app is in the background 
        - Customers comes back to the web app (active) at T+8HOURS -> active ping is sent

    Scenario 3:
        - Customer open the web app at T+0 -> active ping is sent
        - Customer leaves the tab open in the foreground (active) at T+6HOURS -> active ping is sent
*/

// We have business logic relying on this constant, please change with caution!
export const LAST_ACTIVE_PING = 'drive-last-active';

export const useActivePing = (interval: number = ACTIVE_PING_INTERVAL) => {
    const api = useApi();
    const [user] = useUser();
    // We have business logic relying on this key, please change with caution!
    const key = `${LAST_ACTIVE_PING}-${user.ID}`;

    const shouldSendActivePing = () => {
        const lastActivePing = localStorageWithExpiry.getData(key);
        return (
            document.visibilityState === 'visible' &&
            (!lastActivePing || Date.now() - Number(lastActivePing) > interval)
        );
    };

    const sendActivePingIfVisible = () => {
        if (shouldSendActivePing()) {
            void api(queryUserActivePing());
            localStorageWithExpiry.storeData(key, Date.now().toString(), interval);
        }
    };

    const cleanLocalStorage = () => {
        Object.keys(localStorage).forEach((k) => {
            if (k.startsWith(LAST_ACTIVE_PING) && k !== key) {
                localStorageWithExpiry.deleteDataIfExpired(k);
            }
        });
    };

    const handleBeforeUnload = () => {
        localStorageWithExpiry.storeData(key, Date.now().toString(), interval);
    };

    useEffect(() => {
        cleanLocalStorage();

        sendActivePingIfVisible();

        const handleVisibilityChange = () => {
            sendActivePingIfVisible();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        const intervalFunction = setInterval(() => {
            sendActivePingIfVisible();
        }, interval);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearInterval(intervalFunction);
        };
    }, [api, interval]);
};
