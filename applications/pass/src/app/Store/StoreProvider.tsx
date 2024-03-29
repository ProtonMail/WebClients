import { type FC, type PropsWithChildren, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { deletePassDB, getDBCache, writeDBCache } from 'proton-pass-web/lib/database';
import { settings } from 'proton-pass-web/lib/settings';
import { telemetry } from 'proton-pass-web/lib/telemetry';
import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { isDocumentVisible, useVisibleEffect } from '@proton/pass/hooks/useVisibleEffect';
import { authStore } from '@proton/pass/lib/auth/store';
import { clientBooted, clientOfflineUnlocked, clientReady } from '@proton/pass/lib/client';
import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import {
    draftsGarbageCollect,
    getUserAccessIntent,
    passwordHistoryGarbageCollect,
    startEventPolling,
    stopEventPolling,
} from '@proton/pass/store/actions';
import { withRevalidate } from '@proton/pass/store/actions/enhancers/request';
import { selectLocale, selectOnboardingEnabled } from '@proton/pass/store/selectors';
import { OnboardingMessage } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { useAuthService } from '../Context/AuthServiceProvider';
import { useClientRef } from '../Context/ClientProvider';
import { type ServiceWorkerMessageHandler, useServiceWorker } from '../ServiceWorker/ServiceWorkerProvider';
import { rootSaga } from './root.saga';
import { sagaMiddleware, store } from './store';

export const StoreProvider: FC<PropsWithChildren> = ({ children }) => {
    const core = usePassCore();
    const authService = useAuthService();
    const history = useHistory();
    const { installed } = usePassExtensionLink();

    const client = useClientRef();
    const sw = useServiceWorker();
    const { createNotification } = useNotifications();
    const enhance = useNotificationEnhancer();

    useEffect(() => {
        const runner = sagaMiddleware.run(
            rootSaga.bind(null, {
                endpoint: 'web',

                getAppState: () => client.current.state,
                setAppStatus: client.current.setStatus,
                getAuthService: () => authService,
                getAuthStore: () => authStore,
                getCache: () => getDBCache(authStore.getUserID()!),
                getPollingInterval: () => ACTIVE_POLLING_TIMEOUT,
                getSettings: settings.resolve,
                getTelemetry: () => telemetry,

                onBoot: async (res) => {
                    const userID = authStore.getUserID()!;
                    const state = store.getState();

                    if (res.ok) {
                        telemetry.start().catch(noop);
                        void core.i18n.setLocale(selectLocale(state));

                        store.dispatch(draftsGarbageCollect());
                        store.dispatch(passwordHistoryGarbageCollect());
                        store.dispatch(withRevalidate(getUserAccessIntent(userID)));

                        if (isDocumentVisible()) store.dispatch(startEventPolling());

                        if (
                            selectOnboardingEnabled(installed)(state) &&
                            (await core.onboardingCheck?.(OnboardingMessage.B2B_ONBOARDING))
                        ) {
                            history.replace(getLocalPath('onboarding'));
                        }
                    } else if (res.clearCache) void deletePassDB(userID);
                },

                onLocaleUpdated: core.i18n.setLocale,
                onNotification: (notification) => {
                    if (notification.type === 'error' && clientOfflineUnlocked(client.current.state.status)) {
                        notification.errorMessage = c('Warning').t`Offline`;
                    }

                    createNotification(enhance(notification));
                },
                onSettingsUpdated: settings.sync,

                setCache: async (encryptedCache) => {
                    const userID = authStore.getUserID();
                    if (userID) return writeDBCache(userID, encryptedCache);
                },
            })
        );

        const handleAction: ServiceWorkerMessageHandler<'action'> = ({ action, localID }) => {
            if (clientBooted(client.current.state.status) && authStore.hasSession(localID)) store.dispatch(action);
        };

        sw?.on('action', handleAction);

        /** When hot-reloading: this `useEffect` can re-trigger,
         * so cancel the on-going saga runner. */
        return () => {
            runner.cancel();
            sw?.off('action', handleAction);
        };
    }, []);

    useVisibleEffect((visible) => {
        if (visible && clientReady(client.current.state.status)) store.dispatch(startEventPolling());
        else if (!visible) store.dispatch(stopEventPolling());
    });

    return <ReduxProvider store={store}>{children}</ReduxProvider>;
};
