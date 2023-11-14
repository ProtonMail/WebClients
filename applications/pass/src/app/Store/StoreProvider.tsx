import { type FC, useEffect, useRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { useNotifications } from '@proton/components/hooks';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import { INITIAL_SETTINGS } from '@proton/pass/store/reducers/settings';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { useAuthService } from '../Context/AuthServiceProvider';
import { useAuthStore } from '../Context/AuthStoreProvider';
import { useClient } from '../Context/ClientProvider';
import { rootSaga } from './root-saga';
import { sagaMiddleware, store } from './store';

export const StoreProvider: FC = ({ children }) => {
    const authStore = useAuthStore();
    const authService = useAuthService();
    const client = useClient();
    const { createNotification } = useNotifications();
    const notificationEnhancer = useNotificationEnhancer({ onLink: (url) => window.open(url, '_blank') });

    const clientRef = useRef(client);
    clientRef.current = client;

    useEffect(() => {
        sagaMiddleware.run(
            rootSaga.bind(null, {
                getAuthStore: () => authStore,
                getAuthService: () => authService,
                getCache: async () => ({}),
                getEventInterval: () => ACTIVE_POLLING_TIMEOUT,
                getLocalSettings: async () => INITIAL_SETTINGS,
                getTelemetry: () => null,
                getAppState: () => clientRef.current.state,
                setCache: async () => {},
                onNotification: pipe(notificationEnhancer, createNotification),
            })
        );
    }, []);

    return <ReduxProvider store={store}>{children}</ReduxProvider>;
};
