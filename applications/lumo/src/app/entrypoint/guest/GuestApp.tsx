import { Suspense, lazy, useState } from 'react';

import * as bootstrap from '@proton/account/bootstrap';
import { createAuthentication, createUnleash, init } from '@proton/account/bootstrap';
import {
    ApiProvider,
    AuthenticationProvider,
    ErrorBoundary,
    ModalsChildren,
    ProtonApp,
    StandardErrorPage,
} from '@proton/components';
import { initMainHost } from '@proton/cross-storage/host';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { ProtonStoreProvider } from '@proton/redux-shared-store/sharedProvider';
import createApi from '@proton/shared/lib/api/createApi';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { getBrowserLocale } from '@proton/shared/lib/i18n/helper';
import { loadLocales } from '@proton/shared/lib/i18n/loadLocale';
import { locales as sharedLocales } from '@proton/shared/lib/i18n/locales';
import { telemetry } from '@proton/shared/lib/telemetry';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { FlagProvider } from '@proton/unleash/proxy';
import noop from '@proton/utils/noop';

import ConditionalNotificationsChildren from '../../components/ConditionalNotificationsChildren';
import { IndexedDBConnectionMonitor } from '../../components/IndexedDBConnectionMonitor';
import IndexedDBUnavailablePage from '../../components/IndexedDBUnavailablePage';
import LumoLoader from '../../components/Loading/LumoLoader';
import ProtectGuestRouteGuard from '../../components/ProtectGuestRouteGuard/ProtectGuestRouteGuard';
import config from '../../config';
import { isIndexedDBAvailable } from '../../indexedDb/util';
import locales from '../../locales';
import { LumoThemeProvider } from '../../providers';
import { OnboardingProvider } from '../../providers/OnboardingProvider';
import { createLumoListenerMiddleware } from '../../redux/listeners';
import { createInitialLumoUserSettings } from '../../redux/slices/lumoUserSettings';
import type { LumoStore } from '../../redux/store';
import { extendStore, setupStore } from '../../redux/store';
import { setStoreRef } from '../../redux/storeRef';
import { extraThunkArguments } from '../../redux/thunk';
import '../../remote/nativeAuthBridge';
import '../../remote/nativeComposerBridge';
import '../../remote/nativeFeatureFlagsBridge';
import { initializeConsoleOverride } from '../../util/logging';
import { setLumoTelemetryEnabled } from '../../util/telemetry';
import { lumoTelemetryConfig } from '../../util/telemetryConfig';

const GuestContainerLazy = lazy(
    () =>
        import(
            /* webpackChunkName: "GuestContainer" */
            './BasePublicApp'
        )
);

const defaultState: {
    store?: LumoStore;
    error?: { message: string } | undefined;
    indexedDBUnavailable?: boolean;
} = {
    error: undefined,
    indexedDBUnavailable: false,
};

const bootstrapApp = async () => {
    const api = createApi({ config });
    const authentication = createAuthentication({ initialAuth: false });
    init({ config, authentication, locales });

    await loadLocales({
        locale: getBrowserLocale(),
        locales: sharedLocales,
        userSettings: undefined,
    });

    // Guests don't load a session, so there's no UID and telemetry cannot be
    // initialised. Only init/enable telemetry when a UID is actually available,
    // otherwise the shared singleton reports a "not initialised" message for
    // every event.
    if (authentication.UID) {
        telemetry.init({ config, uid: authentication.UID, ...lumoTelemetryConfig });
        setLumoTelemetryEnabled(true);
    }
    initMainHost();
    initElectronClassnames();
    initSafariFontFixClassnames();
    initializeConsoleOverride();

    const pathname = window.location.pathname;
    // const searchParams = new URLSearchParams(window.location.search);
    // const sessionResult = await bootstrap.loadSession({ authentication, api, pathname, searchParams });
    const basename = authentication.basename;
    // const sessionResult = await bootstrap.loadSession({ authentication, api, pathname, searchParams });
    const url = undefined;
    const sessionResult = { basename, url };
    const history = bootstrap.createHistory({ sessionResult, pathname });

    const unauthenticatedApi = createUnauthenticatedApi(api);
    const unleashClient = createUnleash({ api: unauthenticatedApi.apiCallback });
    const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop);

    extendStore({ config, api, authentication, history, unleashClient });

    const listenerMiddleware = createLumoListenerMiddleware({ extra: extraThunkArguments });
    const store = setupStore({
        listenerMiddleware,
        preloadedState: {
            lumoUserSettings: createInitialLumoUserSettings(),
        },
    });
    setStoreRef(store);

    // need to await unleashPromise so prevent UI flickering when unleash flags updated later
    await unleashPromise;

    // Load crypto worker
    const appName = config.APP_NAME;
    await bootstrap.loadCrypto({ appName, unleashClient });

    return {
        store,
    };
};

const GuestApp = () => {
    const [state, setState] = useState(defaultState);

    // const { store, api, authentication } = useInstance(bootstrapApp);
    useEffectOnce(() => {
        void (async () => {
            try {
                const { store } = await bootstrapApp();
                setState({
                    store,
                });
            } catch (error: any) {
                if (!isIndexedDBAvailable()) {
                    setState({ indexedDBUnavailable: true });
                    return;
                }

                setState({
                    error: {
                        message: getNonEmptyErrorMessage(error),
                    },
                });
            }
        })();
    });

    return (
        <ProtonApp config={config}>
            {(() => {
                if (state.indexedDBUnavailable) {
                    return <IndexedDBUnavailablePage />;
                }

                if (!state.store) {
                    return <LumoLoader />;
                }
                return (
                    <ProtonStoreProvider store={state.store}>
                        <AuthenticationProvider store={extraThunkArguments.authentication}>
                            <FlagProvider unleashClient={extraThunkArguments.unleashClient}>
                                <ProtectGuestRouteGuard>
                                    <ApiProvider api={extraThunkArguments.api}>
                                        <ErrorBoundary big component={<StandardErrorPage big />}>
                                            <ConditionalNotificationsChildren />
                                            <ModalsChildren />
                                            <IndexedDBConnectionMonitor />
                                            <OnboardingProvider>
                                                <LumoThemeProvider>
                                                    <Suspense fallback={<LumoLoader />}>
                                                        <GuestContainerLazy />
                                                    </Suspense>
                                                </LumoThemeProvider>
                                            </OnboardingProvider>
                                        </ErrorBoundary>
                                    </ApiProvider>
                                </ProtectGuestRouteGuard>
                            </FlagProvider>
                        </AuthenticationProvider>
                    </ProtonStoreProvider>
                );
            })()}
        </ProtonApp>
    );
};

export default GuestApp;
