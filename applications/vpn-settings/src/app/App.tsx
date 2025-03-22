import { Router } from 'react-router-dom';

import { createBrowserHistory as createHistory } from 'history';

import * as bootstrap from '@proton/account/bootstrap';
import { initStandaloneSession, removeSessions } from '@proton/account/bootstrap/standaloneSession';
import { ApiProvider, AuthenticationProvider, ErrorBoundary, ProtonApp, StandardErrorPage } from '@proton/components';
import useInstance from '@proton/hooks/useInstance';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import createApi from '@proton/shared/lib/api/createApi';
import { handleLogoutFromURL } from '@proton/shared/lib/authentication/handleLogoutFromURL';
import { getLoginPath } from '@proton/shared/lib/authentication/loginPath';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import initLogicalProperties from '@proton/shared/lib/logical/logical';

import PrivateApp from './PrivateApp';
import PublicApp, { publicRoutes } from './PublicApp';
import * as config from './config';
import locales from './locales';
import { extendStore, setupStore } from './store/store';
import { extraThunkArguments } from './store/thunk';

const bootstrapApp = () => {
    const history = createHistory();
    const api = createApi({ config });
    handleLogoutFromURL({ api });
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });
    initLogicalProperties();
    initSafariFontFixClassnames();
    extendStore({ authentication, api, history, config });
    // Remove all sessions if a public route is opened, for example signup or login
    if (Object.values(publicRoutes).some((value) => location.pathname.endsWith(value))) {
        removeSessions({ api });
    }
    const session = initStandaloneSession({ api });
    const privateApp = Boolean(authentication.UID || session);
    return {
        store: setupStore({ mode: privateApp ? 'default' : 'public' }),
        privateApp,
    };
};

const App = () => {
    const { privateApp, store } = useInstance(() => {
        return bootstrapApp();
    });
    return (
        <ProtonApp config={config}>
            <ErrorBoundary component={<StandardErrorPage />}>
                <AuthenticationProvider store={extraThunkArguments.authentication}>
                    <Router history={extraThunkArguments.history}>
                        <ProtonStoreProvider store={store}>
                            <ApiProvider api={extraThunkArguments.api}>
                                {privateApp ? (
                                    <PrivateApp store={store} locales={locales} />
                                ) : (
                                    <PublicApp
                                        api={extraThunkArguments.api}
                                        onLogin={(args) => {
                                            extraThunkArguments.authentication.login(args.data);
                                            replaceUrl(
                                                getLoginPath(
                                                    extraThunkArguments.authentication.basename,
                                                    window.location.href,
                                                    args.path
                                                )
                                            );
                                        }}
                                        locales={locales}
                                    />
                                )}
                            </ApiProvider>
                        </ProtonStoreProvider>
                    </Router>
                </AuthenticationProvider>
            </ErrorBoundary>
        </ProtonApp>
    );
};

export default App;
