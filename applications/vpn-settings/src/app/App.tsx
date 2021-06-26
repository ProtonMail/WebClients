import React from 'react';
import {
    ProtonApp,
    useAuthentication,
    PublicAuthenticationStore,
    PrivateAuthenticationStore,
    ErrorBoundary,
    StandardErrorPage,
} from '@proton/components';
import locales from '@proton/shared/lib/i18n/locales';
import sentry from '@proton/shared/lib/helpers/sentry';

import * as config from './config';
import PrivateApp from './PrivateApp';
import PublicApp from './PublicApp';

import './app.scss';

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.1.49',
    ...config,
};

sentry(enhancedConfig);

const Setup = () => {
    const { UID, login, logout } = useAuthentication() as PublicAuthenticationStore & PrivateAuthenticationStore;
    if (UID) {
        return <PrivateApp onLogout={logout} locales={locales} />;
    }
    return <PublicApp onLogin={login} locales={locales} />;
};

const App = () => {
    return (
        <ProtonApp config={enhancedConfig}>
            <ErrorBoundary component={<StandardErrorPage />}>
                <Setup />
            </ErrorBoundary>
        </ProtonApp>
    );
};

export default App;
