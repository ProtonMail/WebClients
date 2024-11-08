import { type ReactNode } from 'react';
import { useEffect, useReducer, useState } from 'react';

import useAuthentication from '@proton/components/hooks/useAuthentication';
import useConfig from '@proton/components/hooks/useConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { ApiListenerCallback, ApiWithListener } from '@proton/shared/lib/api/createApi';
import { handleInvalidSession } from '@proton/shared/lib/authentication/logout';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

import ApiModals from './ApiModals';
import ApiContext from './apiContext';
import ApiServerTimeContext from './apiServerTimeContext';
import ApiStatusContext, { defaultApiStatus } from './apiStatusContext';

const reducer = (oldState: typeof defaultApiStatus, diff: Partial<typeof defaultApiStatus>) => {
    const newState = {
        ...oldState,
        ...diff,
    };
    if (isDeepEqual(oldState, newState)) {
        return oldState;
    }
    return newState;
};

const ApiProvider = ({ api, children }: { api: ApiWithListener; children: ReactNode }) => {
    const { APP_NAME } = useConfig();
    const { createNotification } = useNotifications();
    const authentication = useAuthentication();
    const [apiStatus, setApiStatus] = useReducer(reducer, defaultApiStatus);
    const [apiServerTime, setApiServerTime] = useState<Date | undefined>(undefined);

    useEffect(() => {
        setApiStatus(defaultApiStatus);

        const handleEvent: ApiListenerCallback = (event) => {
            if (event.type === 'notification') {
                createNotification(event.payload);
                return true;
            }

            if (event.type === 'server-time') {
                setApiServerTime(event.payload);
                return true;
            }

            if (event.type === 'status') {
                setApiStatus(event.payload);
                return true;
            }

            if (event.type === 'logout') {
                handleInvalidSession({ appName: APP_NAME, authentication });
                return true;
            }

            return false;
        };
        api.addEventListener(handleEvent);
        return () => {
            api.removeEventListener(handleEvent);
        };
    }, [api]);

    return (
        <ApiContext.Provider value={api}>
            <ApiStatusContext.Provider value={apiStatus}>
                <ApiServerTimeContext.Provider value={apiServerTime}>
                    {children}
                    <ApiModals api={api} />
                </ApiServerTimeContext.Provider>
            </ApiStatusContext.Provider>
        </ApiContext.Provider>
    );
};

export default ApiProvider;
