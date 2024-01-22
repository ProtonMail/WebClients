import { FunctionComponent, useEffect, useState } from 'react';
import { Router } from 'react-router-dom';

import FlagProvider from '@protontech/proxy-client-react';
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

import {
    ApiProvider,
    AuthenticationProvider,
    DelinquentContainer,
    DrawerProvider,
    ErrorBoundary,
    EventManagerProvider,
    LoaderPage,
    ProtonApp,
    StandardErrorPage,
    StandardLoadErrorPage,
    StandardPrivateApp,
} from '@proton/components';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import metrics from '@proton/metrics/index';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';

import { setPanicHook } from '../pkg';
import { bootstrapApp } from './bootstrap';
import * as config from './config';
import locales from './locales';
import { WalletStore } from './store/store';
import { extraThunkArguments } from './store/thunk';

import './app.scss';

setTtagLocales(locales);
setupGuestCrossStorage();
newVersionUpdater(config);

metrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler);

const defaultState: {
    store?: WalletStore;
    MainContainer?: FunctionComponent;
    error?: { message: string } | undefined;
    showDrawerSidebar?: boolean;
} = {
    error: undefined,
    showDrawerSidebar: false,
};

const App = () => {
    const [state, setState] = useState(defaultState);

    useEffect(() => {
        setPanicHook();
    }, []);

    useEffectOnce(() => {
        void (async () => {
            try {
                const { scopes, userSettings, MainContainer, store } = await bootstrapApp({ config });

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

    return (
        <ProtonApp config={config}>
            {(() => {
                if (state.error) {
                    return <StandardLoadErrorPage errorMessage={state.error.message} />;
                }
                if (!state.MainContainer || !state.store) {
                    return <LoaderPage />;
                }
                return (
                    <ProtonStoreProvider store={state.store}>
                        <AuthenticationProvider store={extraThunkArguments.authentication}>
                            <ApiProvider api={extraThunkArguments.api}>
                                <DrawerProvider defaultShowDrawerSidear={state.showDrawerSidebar}>
                                    <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
                                        <Router history={extraThunkArguments.history}>
                                            <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
                                                <ErrorBoundary big component={<StandardErrorPage big />}>
                                                    <StandardPrivateApp
                                                        hasReadableMemberKeyActivation
                                                        hasMemberKeyMigration
                                                        hasPrivateMemberKeyGeneration
                                                    >
                                                        <state.MainContainer />
                                                    </StandardPrivateApp>
                                                </ErrorBoundary>
                                            </EventManagerProvider>
                                        </Router>
                                    </FlagProvider>
                                </DrawerProvider>
                            </ApiProvider>
                        </AuthenticationProvider>
                    </ProtonStoreProvider>
                );
            })()}
        </ProtonApp>
    );
};

export default App;
