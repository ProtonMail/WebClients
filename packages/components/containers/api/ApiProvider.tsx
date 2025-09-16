import { type ReactNode, useEffect, useRef, useState } from 'react';

import { type ApiStatusState, apiStatusActions, defaultApiStatus } from '@proton/account/apiStatus';
import { selectUser } from '@proton/account/user';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useConfig from '@proton/components/hooks/useConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch, useStore } from '@proton/redux-shared-store/sharedProvider';
import type { ApiListenerCallback, ApiWithListener } from '@proton/shared/lib/api/createApi';
import { handleInvalidSession } from '@proton/shared/lib/authentication/logout';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

import ApiModals from './ApiModals';
import ApiContext from './apiContext';
import ApiServerTimeContext from './apiServerTimeContext';

const hasApiStatusChanged = (old: Partial<ApiStatusState>, next: Partial<ApiStatusState>) => !isDeepEqual(next, old);

const ApiProvider = ({ api, children }: { api: ApiWithListener; children: ReactNode }) => {
    const { APP_NAME } = useConfig();
    const dispatch = useDispatch();
    const store = useStore();
    const { createNotification } = useNotifications();
    const authentication = useAuthentication();
    const [apiServerTime, setApiServerTime] = useState<Date | undefined>(undefined);
    const apiStatusRef = useRef<Partial<ApiStatusState>>(defaultApiStatus);

    useEffect(() => {
        let handledLogout = false;

        const handleEvent: ApiListenerCallback = (event) => {
            if (event.type === 'notification') {
                createNotification(event.payload);
                return true;
            }

            if (event.type === 'server-time') {
                setApiServerTime(event.payload);
                return true;
            }

            if (event.type === 'status' && hasApiStatusChanged(apiStatusRef.current, event.payload)) {
                dispatch(apiStatusActions.update(event.payload));
                apiStatusRef.current = event.payload;
                return true;
            }

            if (event.type === 'logout') {
                if (!handledLogout) {
                    handledLogout = true;
                    const email = selectUser(store.getState())?.value?.Email;
                    handleInvalidSession({ appName: APP_NAME, authentication, extra: { email } });
                }
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
            <ApiServerTimeContext.Provider value={apiServerTime}>
                {children}
                <ApiModals api={api} />
            </ApiServerTimeContext.Provider>
        </ApiContext.Provider>
    );
};

export default ApiProvider;
