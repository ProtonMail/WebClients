import { Router } from 'react-router-dom';

import { createBrowserHistory as createHistory } from 'history';
import { PublicAppThemeProvider } from 'proton-account/src/app/content/theme/PublicAppThemeProvider';

import * as bootstrap from '@proton/account/bootstrap';
import { initStandaloneSession } from '@proton/account/bootstrap/standaloneSession';
import { ApiProvider, AuthenticationProvider, ErrorBoundary, ProtonApp, StandardErrorPage } from '@proton/components';
import useInstance from '@proton/hooks/useInstance';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import createApi from '@proton/shared/lib/api/createApi';
import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import { handleLogoutFromURL } from '@proton/shared/lib/authentication/handleLogoutFromURL';
import { getLoginPath } from '@proton/shared/lib/authentication/loginPath';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { telemetry } from '@proton/shared/lib/telemetry';

import PrivateApp from './PrivateApp';
import PublicApp, { publicRoutes } from './PublicApp';
import config from './config';
import locales from './locales';
import { extendStore, setupStore } from './store/store';
import { extraThunkArguments } from './store/thunk';

const bootstrapApp = () => {
    const history = createHistory();
    const api = createApi({ config });
    handleLogoutFromURL({ api });
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });
    initSafariFontFixClassnames();
    extendStore({ authentication, api, history, config });
    let session: PersistedSession | undefined = undefined;
    // Don't automatically sign in when a public route is opened, for example signup or reset password
    if (
        !Object.values(publicRoutes).some((value) => {
            // Ignore login, let the session get picked automatically
            if (value === publicRoutes.login) {
                return false;
            }
            return location.pathname.endsWith(value);
        })
    ) {
        session = initStandaloneSession({ authentication, api });
    }
    const privateApp = Boolean(session);

    if (!privateApp) {
        telemetry.init({ config, uid: authentication.UID });
    }

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
        <ProtonApp config={config} ThemeProvider={privateApp ? undefined : PublicAppThemeProvider}>
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
