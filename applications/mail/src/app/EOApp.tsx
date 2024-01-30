import { BrowserRouter as Router } from 'react-router-dom';

import * as bootstrap from '@proton/account/bootstrap';
import {
    ApiProvider,
    CacheProvider,
    CompatibilityCheck,
    ConfigProvider,
    Icons,
    LoaderPage,
    ModalsProvider,
    NotificationsProvider,
    PreventLeaveProvider,
    RightToLeftProvider,
    StandardPublicApp,
    ThemeProvider,
} from '@proton/components';
import useInstance from '@proton/hooks/useInstance';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import createApi from '@proton/shared/lib/api/createApi';
import createCache from '@proton/shared/lib/helpers/cache';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';

import * as config from './config';
import EOContainer from './containers/eo/EOContainer';
import { registerMailToProtocolHandler } from './helpers/url';
import locales from './locales';
import { setupStore } from './store/eo/eoStore';

const boostrapApp = () => {
    const api = createApi({ config });
    const authentication = bootstrap.createAuthentication({ initialAuth: false });
    bootstrap.init({ config, locales, authentication });
    // If the browser is Chromium based, register automatically the mailto protocol handler
    if ('chrome' in window) {
        registerMailToProtocolHandler();
    }
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
    const { store, api, cache } = useInstance(boostrapApp);
    return (
        <ProtonStoreProvider store={store}>
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
                                                    <StandardPublicApp loader={<LoaderPage />} locales={locales}>
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
        </ProtonStoreProvider>
    );
};

export default App;
