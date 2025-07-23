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
    useNotifications,
} from '@proton/components';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import { FlagProvider } from '@proton/unleash';
import ExtendedApiProvider from '@proton/wallet/contexts/ExtendedApiContext/ExtendedApiProvider';
import type { WalletStore } from '@proton/wallet/store';
import { extraThunkArguments } from '@proton/wallet/store/thunk';
import { isWasmSupported } from '@proton/wallet/utils/wasm';

import { type bootstrapApp } from './bootstrap';
import { WalletThemeProvider } from './components/Layout/Theme/WalletThemeProvider';
import config from './config';

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
                <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
                    <Router history={extraThunkArguments.history}>
                        <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
                            <ApiProvider api={extraThunkArguments.api}>
                                <ExtendedApiProvider walletApi={extraThunkArguments.walletApi}>
                                    <ErrorBoundary big component={<StandardErrorPage big />}>
                                        <StandardPrivateApp>
                                            <WalletThemeProvider>
                                                <state.MainContainer />
                                            </WalletThemeProvider>
                                        </StandardPrivateApp>
                                    </ErrorBoundary>
                                </ExtendedApiProvider>
                            </ApiProvider>
                        </EventManagerProvider>
                    </Router>
                </FlagProvider>
            </AuthenticationProvider>
        </ProtonStoreProvider>
    );
};

const App = () => {
    if (!isWasmSupported()) {
        return (
            <div className="unsupported-wasm-container">
                <span>{c('Wallet')
                    .t`Your browser or device software does not support ${WALLET_APP_NAME}. Please update your browser or device. Alternatively, you can use one of our mobile apps.`}</span>
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
