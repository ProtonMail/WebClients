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
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { FlagProvider } from '@proton/unleash/index';
import noop from '@proton/utils/noop';

import config from './config';
import PublicSharedLinkContainer from './containers/PublicSharedLinkContainer';
import locales from './locales';
import type { DriveStore } from './redux-store/store';
import { extendStore, setupStore } from './redux-store/store';
import { extraThunkArguments } from './redux-store/thunk';
import { userSuccessMetrics } from './utils/metrics/userSuccessMetrics';
import { logPerformanceMarker } from './utils/performance';
import { Features, measureFeaturePerformance } from './utils/telemetry';
import { loadStreamsPolyfill } from './utils/webStreamsPolyfill';
import { unleashVanillaStore } from './zustand/unleash/unleash.store';

const bootstrapApp = async () => {
    const authentication = bootstrap.createAuthentication({ initialAuth: false });
    bootstrap.init({ config, locales, authentication });

    await userSuccessMetrics.init();
    await userSuccessMetrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);

    const store = setupStore();
    const api = createApi({ config });
    const history = createBrowserHistory();
    const unleashClient = bootstrap.createUnleash({ api: getSilentApi(api) });
    extendStore({ config, api, authentication, history, unleashClient });
    unleashVanillaStore.getState().setClient(unleashClient);
    bootstrap.unleashReady({ unleashClient }).catch(noop);

    const searchParams = new URLSearchParams(location.search);

    await Promise.all([
        loadStreamsPolyfill(),
        bootstrap.publicApp({ app: config.APP_NAME, locales, searchParams, pathLocale: '' }),
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
                                    <FlagProvider unleashClient={extraThunkArguments.unleashClient}>
                                        <ApiProvider api={extraThunkArguments.api}>
                                            <ErrorBoundary big component={<StandardErrorPage big />}>
                                                <div className="h-full">
                                                    <NotificationsChildren />
                                                    <ModalsChildren />
                                                    <PublicSharedLinkContainer />
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
