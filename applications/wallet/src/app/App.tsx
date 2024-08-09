import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Router } from 'react-router-dom';

import {
    ArcElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import { c } from 'ttag';

import {
    ApiProvider,
    AuthenticationProvider,
    DelinquentContainer,
    ErrorBoundary,
    EventManagerProvider,
    LoaderPage,
    ProtonApp,
    StandardErrorPage,
    StandardLoadErrorPage,
    StandardPrivateApp,
    SubscriptionModalProvider,
    useNotifications,
} from '@proton/components';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import metrics from '@proton/metrics/index';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import { FlagProvider } from '@proton/unleash';
import ExtendedApiProvider from '@proton/wallet/contexts/ExtendedApiContext/ExtendedApiProvider';
import { extraThunkArguments } from '@proton/wallet/store/thunk';
import { isWasmSupported } from '@proton/wallet/utils/wasm';

import { type bootstrapApp } from './bootstrap';
import * as config from './config';
import locales from './locales';
import type { WalletStore } from './store/store';

setTtagLocales(locales);
setupGuestCrossStorage();
newVersionUpdater(config);

metrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler);

const lazyBootstrapApp = (...args: Parameters<typeof bootstrapApp>) =>
    import(/* webpackChunkName: "bootstrap" */ './bootstrap').then((result) => result.bootstrapApp(...args));

const defaultState: {
    store?: WalletStore;
    MainContainer?: FunctionComponent;
    error?: { message: string } | undefined;
    showDrawerSidebar?: boolean;
} = {
    error: undefined,
    showDrawerSidebar: false,
};

const AppInner = () => {
    const [state, setState] = useState(defaultState);
    const notificationsManager = useNotifications();

    useEffectOnce(() => {
        void (async () => {
            try {
                const { scopes, userSettings, MainContainer, store } = await lazyBootstrapApp({
                    config,
                    notificationsManager,
                });

                setState({
                    store,
                    MainContainer: scopes.delinquent ? DelinquentContainer : MainContainer,
                    showDrawerSidebar: userSettings.HideSidePanel === DRAWER_VISIBILITY.SHOW,
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

    if (state.error) {
        return <StandardLoadErrorPage errorMessage={state.error.message} />;
    }

    const loader = <LoaderPage />;
    if (!state.MainContainer || !state.store) {
        return loader;
    }

    return (
        <ProtonStoreProvider store={state.store}>
            <AuthenticationProvider store={extraThunkArguments.authentication}>
                <ApiProvider api={extraThunkArguments.api}>
                    <ExtendedApiProvider walletApi={extraThunkArguments.walletApi}>
                        <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
                            <Router history={extraThunkArguments.history}>
                                <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
                                    <ErrorBoundary big component={<StandardErrorPage big />}>
                                        <StandardPrivateApp
                                            hasReadableMemberKeyActivation
                                            hasMemberKeyMigration
                                            hasPrivateMemberKeyGeneration
                                            loader={loader}
                                        >
                                            <SubscriptionModalProvider app={config.APP_NAME}>
                                                <state.MainContainer />
                                            </SubscriptionModalProvider>
                                        </StandardPrivateApp>
                                    </ErrorBoundary>
                                </EventManagerProvider>
                            </Router>
                        </FlagProvider>
                    </ExtendedApiProvider>
                </ApiProvider>
            </AuthenticationProvider>
        </ProtonStoreProvider>
    );
};

const App = () => {
    if (!isWasmSupported()) {
        return (
            <div className="unsupported-wasm-container">
                <span>{c('Wallet').t`WebAssembly must be enabled to use ${WALLET_APP_NAME}`}</span>
            </div>
        );
    }

    return (
        <ProtonApp config={config}>
            <AppInner />
        </ProtonApp>
    );
};

export default App;
