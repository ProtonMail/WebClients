import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import { configureStore } from '@reduxjs/toolkit';

import { apiStatusReducer } from '@proton/account';
import { createAuthentication, createUnleash } from '@proton/account/bootstrap';
import { initStandaloneSession } from '@proton/account/bootstrap/standaloneSession';
import ApiProvider from '@proton/components/containers/api/ApiProvider';
import UnauthenticatedApiProvider from '@proton/components/containers/api/UnauthenticatedApiProvider';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import ProtonApp from '@proton/components/containers/app/ProtonApp';
import StandardPublicApp from '@proton/components/containers/app/StandardPublicApp';
import MinimalLoginContainer from '@proton/components/containers/login/MinimalLoginContainer';
import useInstance from '@proton/hooks/useInstance';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';
import createApi from '@proton/shared/lib/api/createApi';
import { APPS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { FlagProvider } from '@proton/unleash';
import noop from '@proton/utils/noop';

import '@proton/styles/scss/_proton-account.scss';

const config = { APP_NAME: APPS.PROTONACCOUNT, APP_VERSION: '5.0.999.999', API_URL: '/api' } as ProtonConfig;
const api = createApi({ config });
const authentication = createAuthentication();
const unauthenticatedApi = createUnauthenticatedApi(api);
const unleashClient = createUnleash({ api: unauthenticatedApi.apiCallback });
const session = initStandaloneSession({ api, authentication });

unleashClient.start().catch(noop);

if (session) {
    replaceUrl('/');
}

const locales = {};

/**
 * Minimal store
 * @warning:
 * This store is both accessible on public and private apps.
 * Only basic reducers are meant to be added there.
 */
export const setupStore = () => {
    return configureStore({
        reducer: { ...apiStatusReducer },
        devTools: process.env.NODE_ENV !== 'production',
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: [...ignoredActions],
                    ignoredPaths: [...ignoredPaths],
                },
            }),
    });
};

const Component = () => {
    const store = useInstance(setupStore);
    const loaderPage = <LoaderPage />;
    return (
        <ProtonApp config={config}>
            <BrowserRouter>
                <ProtonStoreProvider store={store}>
                    <ApiProvider api={api}>
                        <StandardPublicApp loader={loaderPage} locales={locales}>
                            <UnauthenticatedApiProvider unauthenticatedApi={unauthenticatedApi}>
                                <FlagProvider unleashClient={unleashClient} startClient={false}>
                                    <div className="h-full flex justify-center items-center">
                                        <div className="w-custom" style={{ '--w-custom': '20em' }}>
                                            <MinimalLoginContainer
                                                onStartAuth={() => unauthenticatedApi.startUnAuthFlow()}
                                                onLogin={async (args) => {
                                                    authentication.login(args.data);
                                                    window.location.pathname = '/';
                                                    return { state: 'complete' };
                                                }}
                                            />
                                        </div>
                                    </div>
                                </FlagProvider>
                            </UnauthenticatedApiProvider>
                        </StandardPublicApp>
                    </ApiProvider>
                </ProtonStoreProvider>
            </BrowserRouter>
        </ProtonApp>
    );
};

ReactDOM.render(<Component />, document.querySelector('.app-root'));
