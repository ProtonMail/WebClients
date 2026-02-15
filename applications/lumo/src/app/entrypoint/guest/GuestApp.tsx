import { Suspense, lazy, useState } from 'react';

import * as bootstrap from '@proton/account/bootstrap';
import { createAuthentication, createUnleash, init } from '@proton/account/bootstrap';
import {
    ApiProvider,
    AuthenticationProvider,
    ErrorBoundary,
    ModalsChildren,
    NotificationsChildren,
    ProtonApp,
    StandardErrorPage,
} from '@proton/components';
import { initMainHost } from '@proton/cross-storage/lib';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import createApi from '@proton/shared/lib/api/createApi';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { getBrowserLocale } from '@proton/shared/lib/i18n/helper';
import { loadLocales } from '@proton/shared/lib/i18n/loadLocale';
import { locales as sharedLocales } from '@proton/shared/lib/i18n/locales';
import { telemetry } from '@proton/shared/lib/telemetry';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { FlagProvider } from '@proton/unleash';
import noop from '@proton/utils/noop';

import LumoLoader from '../../components/LumoLoader';
import config from '../../config';
import locales from '../../locales';
import { LumoThemeProvider } from '../../providers/LumoThemeProvider';
import { OnboardingProvider } from '../../providers/OnboardingProvider';
import { createLumoListenerMiddleware } from '../../redux/listeners';
import type { LumoStore } from '../../redux/store';
import { extendStore, setupStore } from '../../redux/store';
import { setStoreRef } from '../../redux/storeRef';
import { extraThunkArguments } from '../../redux/thunk';
import { IndexedDBConnectionMonitor } from '../../ui/components/IndexedDBConnectionMonitor';
import ProtectGuestRouteGuard from '../../ui/components/ProtectGuestRouteGuard/ProtectGuestRouteGuard';
import { initializeConsoleOverride } from '../../util/logging';
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
} = {
    error: undefined,
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

    telemetry.init({ config, uid: authentication.UID, ...lumoTelemetryConfig });
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
    const store = setupStore({ listenerMiddleware });
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
                                            <NotificationsChildren />
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
