import { useState } from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import * as bootstrap from '@proton/account/bootstrap';
import { type SessionPayloadData, createAuthentication, createUnleash, init } from '@proton/account/bootstrap';
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
import { telemetry } from '@proton/shared/lib/telemetry';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { FlagProvider } from '@proton/unleash/index';
import noop from '@proton/utils/noop';

import LumoLoader from '../../components/LumoLoader';
import * as config from '../../config';
import locales from '../../locales';
import { ConversationProvider } from '../../providers/ConversationProvider';
import { GuestTrackingProvider } from '../../providers/GuestTrackingProvider';
import { IsGuestProvider } from '../../providers/IsGuestProvider';
import LumoCommonProvider from '../../providers/LumoCommonProvider';
import { LumoPlanProvider } from '../../providers/LumoPlanProvider';
import { OnboardingProvider } from '../../providers/OnboardingProvider';
import { createLumoListenerMiddleware } from '../../redux/listeners';
import type { LumoStore } from '../../redux/store';
import { extendStore, setupStore } from '../../redux/store';
import { extraThunkArguments } from '../../redux/thunk';
import ProtectGuestRouteGuard from '../../ui/components/ProtectGuestRouteGuard/ProtectGuestRouteGuard';
import { PublicHeader } from '../../ui/header/PublicHeader';
import { InteractiveConversationComponent } from '../../ui/interactiveConversation/InteractiveConversationComponent';
import { initializeConsoleOverride } from '../../util/logging';
import { lumoTelemetryConfig } from '../../util/telemetryConfig';
import { InnerApp } from '../InnerApp';

export interface RouteParams {
    sessionId: string;
    conversationId: string;
}

const defaultState: {
    store?: LumoStore;
    error?: { message: string } | undefined;
} = {
    error: undefined,
};

const bootstrapApp = async () => {
    const api = createApi({ config, sendLocaleHeaders: true });
    const authentication = createAuthentication({ initialAuth: false });
    init({ config, authentication, locales });
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
    const sessionResult = { basename, url } as SessionPayloadData;
    const history = bootstrap.createHistory({ sessionResult, pathname });

    const unauthenticatedApi = createUnauthenticatedApi(api);
    const unleashClient = createUnleash({ api: unauthenticatedApi.apiCallback });
    const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop);

    extendStore({ config, api, authentication, history, unleashClient });

    const listenerMiddleware = createLumoListenerMiddleware({ extra: extraThunkArguments });
    const store = setupStore({ listenerMiddleware });

    // need to await unleashPromise so prevent UI flickering when unleash flags updated later
    await unleashPromise;

    // Load crypto worker
    const appName = config.APP_NAME;
    await bootstrap.loadCrypto({ appName, unleashClient });

    return {
        store,
    };
};

const BasePublicApp = () => {
    return (
        <ConversationProvider>
            <Router>
                <Switch>
                    <Route path="/guest">
                        <LumoCommonProvider user={undefined}>
                            <GuestTrackingProvider>
                                <InnerApp
                                    headerComponent={PublicHeader}
                                    conversationComponent={InteractiveConversationComponent}
                                />
                            </GuestTrackingProvider>
                        </LumoCommonProvider>
                    </Route>
                </Switch>
            </Router>
        </ConversationProvider>
    );
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
                                            <OnboardingProvider>
                                                <IsGuestProvider isGuest={true}>
                                                    <LumoPlanProvider>
                                                        <BasePublicApp />
                                                    </LumoPlanProvider>
                                                </IsGuestProvider>
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
