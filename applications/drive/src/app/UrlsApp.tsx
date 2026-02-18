import { useState } from 'react';
import { Router } from 'react-router-dom';
import { CompatRouter } from 'react-router-dom-v5-compat';

import { createBrowserHistory } from 'history';

import * as bootstrap from '@proton/account/bootstrap';
import {
    ApiProvider,
    AuthenticationProvider,
    ErrorBoundary,
    LoaderPage,
    ModalsChildren,
    NotificationsChildren,
    ProtonApp,
    StandardErrorPage,
    StandardLoadErrorPage,
} from '@proton/components';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import createApi from '@proton/shared/lib/api/createApi';
// eslint-disable-next-line no-restricted-imports
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { FlagProvider } from '@proton/unleash';
import noop from '@proton/utils/noop';

import config from './config';
import locales from './locales';
import { driveMetrics } from './modules/metrics';
import type { DriveStore } from './redux-store/store';
import { extendStore, setupStore } from './redux-store/store';
import { extraThunkArguments } from './redux-store/thunk';
import { PublicPage } from './sections/publicPage/PublicPage';
import { logPerformanceMarker } from './utils/performance';
import { Features, measureFeaturePerformance } from './utils/telemetry';
import { loadStreamsPolyfill } from './utils/webStreamsPolyfill';
import { unleashVanillaStore } from './zustand/unleash/unleash.store';

const bootstrapApp = async () => {
    const authentication = bootstrap.createAuthentication({ initialAuth: false });
    bootstrap.init({ config, locales, authentication });

    driveMetrics.init({ isPublicContext: true });

    const store = setupStore({
        // Account sessions (switcher) feature, or Account persistence (state) feature is not used in unauthenticated context
        features: { accountSessions: false, accountPersist: false },
    });
    const api = createApi({ config });
    const history = createBrowserHistory();
    const unleashClient = bootstrap.createUnleash({ api: getSilentApi(api) });
    extendStore({ config, api, authentication, history, unleashClient });
    unleashVanillaStore.getState().setClient(unleashClient);
    const unleashFeature = measureFeaturePerformance(api, Features.globalBootstrapAppUnleash);
    unleashFeature.start();
    const unleashPromise = bootstrap
        .unleashReady({ unleashClient })
        .catch(noop)
        .finally(() => {
            unleashFeature.end();
        });
    const searchParams = new URLSearchParams(location.search);

    await Promise.all([
        loadStreamsPolyfill(),
        bootstrap.publicApp({ app: config.APP_NAME, locales, searchParams, pathLocale: '' }),
        unleashPromise,
    ]);

    return { store };
};

const UrlsApp = () => {
    const [state, setState] = useState<{ error?: string; store?: DriveStore }>({});
    const feature = measureFeaturePerformance(extraThunkArguments.api, Features.globalBootstrapAppUrls);
    useEffectOnce(() => {
        (async () => {
            try {
                feature.start();
                const { store } = await bootstrapApp();
                // we have to pass the new api now it's extended by the bootstrap
                feature.end(undefined, extraThunkArguments.api);
                setState({ store });
                logPerformanceMarker('drive_performance_clicktobootstrapped_histogram');
            } catch (error: any) {
                setState({
                    error: getNonEmptyErrorMessage(error),
                });
            } finally {
                feature.clear();
            }
        })().catch(noop);
    });

    return (
        <ProtonApp config={config}>
            {(() => {
                if (state.error) {
                    return <StandardLoadErrorPage errorMessage={state.error} />;
                }
                if (!state.store) {
                    return <LoaderPage />;
                }
                return (
                    <ProtonStoreProvider store={state.store}>
                        <Router history={extraThunkArguments.history}>
                            <CompatRouter>
                                <AuthenticationProvider store={extraThunkArguments.authentication}>
                                    <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
                                        <ApiProvider api={extraThunkArguments.api}>
                                            <ErrorBoundary
                                                big
                                                component={<StandardErrorPage big />}
                                                onError={(error) => {
                                                    driveMetrics.globalErrors.markCrashError(error);
                                                }}
                                            >
                                                <div className="h-full">
                                                    <NotificationsChildren />
                                                    <ModalsChildren />
                                                    <PublicPage />
                                                </div>
                                            </ErrorBoundary>
                                        </ApiProvider>
                                    </FlagProvider>
                                </AuthenticationProvider>
                            </CompatRouter>
                        </Router>
                    </ProtonStoreProvider>
                );
            })()}
        </ProtonApp>
    );
};

export default UrlsApp;
