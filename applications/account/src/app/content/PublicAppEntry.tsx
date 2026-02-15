import { BrowserRouter } from 'react-router-dom';

import { registerSessionListener } from '@proton/account/accountSessions/registerSessionListener';
import { writeAccountSessions } from '@proton/account/accountSessions/storage';
import { createAuthentication, createUnleash, init } from '@proton/account/bootstrap';
import ApiProvider from '@proton/components/containers/api/ApiProvider';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import ProtonApp from '@proton/components/containers/app/ProtonApp';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import ModalsChildren from '@proton/components/containers/modals/Children';
import NotificationsChildren from '@proton/components/containers/notifications/Children';
import { initMainHost } from '@proton/cross-storage/lib';
import useInstance from '@proton/hooks/useInstance';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import createApi from '@proton/shared/lib/api/createApi';
import { handleLogoutFromURL } from '@proton/shared/lib/authentication/handleLogoutFromURL';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { telemetry } from '@proton/shared/lib/telemetry';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import config from '../config';
import locales from '../locales';
import { extendStore, setupStore } from '../store/public-store';
import { PublicAppInitial } from './PublicAppInitial';
import { PublicAppThemeProvider } from './theme/PublicAppThemeProvider';

const bootstrapApp = () => {
    const api = createApi({ config });
    const initialSessions = getPersistedSessions();
    const initialSessionsLength = initialSessions.length;
    writeAccountSessions(initialSessions);
    registerSessionListener({ type: 'all' });
    handleLogoutFromURL({ api });
    const authentication = createAuthentication({ initialAuth: false });
    init({ config, authentication, locales });
    telemetry.init({ config, uid: authentication.UID });
    initMainHost();
    initElectronClassnames();
    initSafariFontFixClassnames();
    const unauthenticatedApi = createUnauthenticatedApi(api);
    const unleashClient = createUnleash({ api: unauthenticatedApi.apiCallback });
    extendStore({ config, api, authentication, unleashClient, unauthenticatedApi });
    const store = setupStore();
    return {
        authentication,
        store,
        api,
        sessions: {
            initialSessionsLength,
        },
    };
};

const PublicApp = () => {
    const { store, authentication, api, sessions } = useInstance(bootstrapApp);

    return (
        <ProtonApp config={config} ThemeProvider={PublicAppThemeProvider}>
            <AuthenticationProvider store={authentication}>
                <BrowserRouter>
                    <ProtonStoreProvider store={store}>
                        <ApiProvider api={api}>
                            <ErrorBoundary big component={<StandardErrorPage big />}>
                                <ModalsChildren />
                                <NotificationsChildren />
                                <PublicAppInitial sessions={sessions} />
                            </ErrorBoundary>
                        </ApiProvider>
                    </ProtonStoreProvider>
                </BrowserRouter>
            </AuthenticationProvider>
        </ProtonApp>
    );
};

export default PublicApp;
