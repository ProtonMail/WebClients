import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

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
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import noop from '@proton/utils/noop';

import * as config from './config';
import PublicSharedLinkContainer from './containers/PublicSharedLinkContainer';
import locales from './locales';
import type { DriveStore } from './redux-store/store';
import { extendStore, setupStore } from './redux-store/store';
import { extraThunkArguments } from './redux-store/thunk';

const bootstrapApp = async () => {
    const authentication = bootstrap.createAuthentication({ initialAuth: false });
    bootstrap.init({ config, locales, authentication });

    const store = setupStore();
    const api = createApi({ config });
    extendStore({ config, api, authentication });

    const searchParams = new URLSearchParams(location.search);
    await bootstrap.publicApp({ app: config.APP_NAME, locales, searchParams, pathLocale: '' });

    return { store };
};

const UrlsApp = () => {
    const [state, setState] = useState<{ error?: string; store?: DriveStore }>({});

    useEffectOnce(() => {
        (async () => {
            try {
                const { store } = await bootstrapApp();
                setState({ store });
            } catch (error: any) {
                setState({
                    error: getNonEmptyErrorMessage(error),
                });
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
                        <BrowserRouter>
                            <AuthenticationProvider store={extraThunkArguments.authentication}>
                                <ApiProvider api={extraThunkArguments.api}>
                                    <ErrorBoundary big component={<StandardErrorPage big />}>
                                        <div className="h-full">
                                            <NotificationsChildren />
                                            <ModalsChildren />
                                            <PublicSharedLinkContainer />
                                        </div>
                                    </ErrorBoundary>
                                </ApiProvider>
                            </AuthenticationProvider>
                        </BrowserRouter>
                    </ProtonStoreProvider>
                );
            })()}
        </ProtonApp>
    );
};

export default UrlsApp;
