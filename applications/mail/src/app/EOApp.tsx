import { BrowserRouter as Router } from 'react-router-dom';

import * as bootstrap from '@proton/account/bootstrap';
import ApiProvider from '@proton/components/containers/api/ApiProvider';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import StandardPublicApp from '@proton/components/containers/app/StandardPublicApp';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import { CacheProvider } from '@proton/components/containers/cache/Provider';
import CompatibilityCheck from '@proton/components/containers/compatibilityCheck/CompatibilityCheck';
import ConfigProvider from '@proton/components/containers/config/Provider';
import ModalsProvider from '@proton/components/containers/modals/Provider';
import NotificationsProvider from '@proton/components/containers/notifications/Provider';
import { RightToLeftProvider } from '@proton/components/containers/rightToLeft/Provider';
import ThemeProvider from '@proton/components/containers/themes/ThemeProvider';
import { PreventLeaveProvider } from '@proton/components/hooks/usePreventLeave';
import useInstance from '@proton/hooks/useInstance';
import Icons from '@proton/icons/Icons';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import createApi from '@proton/shared/lib/api/createApi';
import createCache from '@proton/shared/lib/helpers/cache';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { FlagProvider } from '@proton/unleash/proxy';

import NotificationManagerInjector from './components/notification/NotificationManagerInjector';
import config from './config';
import EOContainer from './containers/eo/EOContainer';
import locales from './locales';
import { setupStore } from './store/eo/eoStore';

const boostrapApp = () => {
    const api = createApi({ config });
    const authentication = bootstrap.createAuthentication({ initialAuth: false });
    bootstrap.init({ config, locales, authentication });
    initSafariFontFixClassnames();
    const cache = createCache();

    return {
        authentication,
        store: setupStore(),
        cache,
        api,
    };
};

const App = () => {
    const { authentication, store, api, cache } = useInstance(boostrapApp);
    return (
        <ProtonStoreProvider store={store}>
            <AuthenticationProvider store={authentication}>
                {/* Passing an `undefined` unleash client so that children using
                    feature flags do not make EO crash. We need to investigate
                    further how to use FF in this sub-app as there are concerns
                    with flags requiring an authenticated user */}
                <FlagProvider unleashClient={undefined} startClient={false}>
                    <ConfigProvider config={config}>
                        <CompatibilityCheck>
                            <Icons />
                            <RightToLeftProvider>
                                <ThemeProvider appName={config.APP_NAME}>
                                    <Router>
                                        <PreventLeaveProvider>
                                            <NotificationsProvider>
                                                <ModalsProvider>
                                                    <ApiProvider api={api}>
                                                        <CacheProvider cache={cache}>
                                                            <StandardPublicApp
                                                                loader={<LoaderPage />}
                                                                locales={locales}
                                                            >
                                                                <NotificationManagerInjector />
                                                                <EOContainer />
                                                            </StandardPublicApp>
                                                        </CacheProvider>
                                                    </ApiProvider>
                                                </ModalsProvider>
                                            </NotificationsProvider>
                                        </PreventLeaveProvider>
                                    </Router>
                                </ThemeProvider>
                            </RightToLeftProvider>
                        </CompatibilityCheck>
                    </ConfigProvider>
                </FlagProvider>
            </AuthenticationProvider>
        </ProtonStoreProvider>
    );
};

export default App;
