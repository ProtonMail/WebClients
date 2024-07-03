import { type FC, type PropsWithChildren, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { deletePassDB, getDBCache, writeDBCache } from 'proton-pass-web/lib/database';
import { settings } from 'proton-pass-web/lib/settings';
import { telemetry } from 'proton-pass-web/lib/telemetry';
import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { isDocumentVisible, useVisibleEffect } from '@proton/pass/hooks/useVisibleEffect';
import { api } from '@proton/pass/lib/api/api';
import { authStore } from '@proton/pass/lib/auth/store';
import { clientBooted, clientOffline, clientReady } from '@proton/pass/lib/client';
import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import { setVersionTag } from '@proton/pass/lib/settings/beta';
import { startEventPolling, stopEventPolling } from '@proton/pass/store/actions';
import { rootSagaFactory } from '@proton/pass/store/sagas';
import { WEB_SAGAS } from '@proton/pass/store/sagas/web';
import { selectFeatureFlag, selectLocale, selectOnboardingEnabled } from '@proton/pass/store/selectors';
import { OnboardingMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import noop from '@proton/utils/noop';

import { useAuthService } from '../Context/AuthServiceProvider';
import { useClientRef } from '../Context/ClientProvider';
import { type ServiceWorkerMessageHandler, useServiceWorker } from '../ServiceWorker/ServiceWorkerProvider';
import { sagaMiddleware, store } from './store';

export const StoreProvider: FC<PropsWithChildren> = ({ children }) => {
    const core = usePassCore();
    const config = usePassConfig();
    const authService = useAuthService();
    const history = useHistory();
    const { installed } = usePassExtensionLink();
    const online = useConnectivity();

    const client = useClientRef();
    const sw = useServiceWorker();
    const { createNotification } = useNotifications();
    const enhance = useNotificationEnhancer();

    useEffect(() => {
        const runner = sagaMiddleware.run(
            rootSagaFactory(WEB_SAGAS).bind(null, {
                endpoint: 'web',

                getAppState: () => client.current.state,
                setAppStatus: client.current.setStatus,
                getAuthService: () => authService,
                getAuthStore: () => authStore,
                getCache: () => getDBCache(authStore.getUserID()),
                getPollingInterval: () => ACTIVE_POLLING_TIMEOUT,
                getSettings: settings.resolve,
                getTelemetry: () => telemetry,

                onBoot: async (res) => {
                    client.current.setBooted(res.ok);
                    const userID = authStore.getUserID();
                    const state = store.getState();

                    if (res.ok) {
                        telemetry.start().catch(noop);
                        core.i18n.setLocale(selectLocale(state)).catch(noop);

                        if (isDocumentVisible() && !res.offline) store.dispatch(startEventPolling());

                        const onboardingEnabled = selectOnboardingEnabled(installed)(state);
                        const b2bOnboard = await core.onboardingCheck?.(OnboardingMessage.B2B_ONBOARDING);
                        if (onboardingEnabled && b2bOnboard) history.replace(getLocalPath('onboarding'));
                    } else if (res.clearCache) void deletePassDB(userID);
                },

                onLocaleUpdated: core.i18n.setLocale,

                onBetaUpdated: async (beta) => {
                    if (BUILD_TARGET === 'web') {
                        const state = store.getState();
                        const forceAlpha = selectFeatureFlag(PassFeature.PassWebInternalAlpha)(state);
                        await api.idle();

                        setVersionTag(beta, forceAlpha);
                        window.location.reload();
                    }
                },

                onNotification: (notification) => {
                    if (notification.type === 'error' && clientOffline(client.current.state.status)) {
                        notification.errorMessage = c('Warning').t`Offline`;
                    }

                    createNotification(enhance(notification));
                },
                onSettingsUpdated: settings.sync,

                setCache: async (encryptedCache) => {
                    const userID = authStore.getUserID();
                    if (userID) return writeDBCache(userID, encryptedCache, config.APP_VERSION).catch(noop);
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

    useVisibleEffect(
        (visible: boolean) => {
            if (visible && online && clientReady(client.current.state.status)) store.dispatch(startEventPolling());
            else if (!visible || !online) store.dispatch(stopEventPolling());
        },
        [online]
    );

    return <ReduxProvider store={store}>{children}</ReduxProvider>;
};
