import React from 'react';
import {
    ProtonApp,
    useAuthentication,
    PublicAuthenticationStore,
    PrivateAuthenticationStore,
    DefaultThemeInjector,
} from 'react-components';
import locales from 'proton-shared/lib/i18n/locales';
import sentry from 'proton-shared/lib/helpers/sentry';

import * as config from './config';
import PrivateApp from './PrivateApp';
import PublicApp from './PublicApp';

import './app.scss';

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.1.48',
    ...config,
};

sentry(enhancedConfig);

const Setup = () => {
    const { UID, login, logout } = useAuthentication() as PublicAuthenticationStore & PrivateAuthenticationStore;
    if (UID) {
        return <PrivateApp onLogout={logout} locales={locales} />;
    }
    return (
        <>
            <DefaultThemeInjector />
            <PublicApp onLogin={login} locales={locales} />
        </>
    );
};

const App = () => {
    return (
        <ProtonApp config={enhancedConfig}>
            <Setup />
        </ProtonApp>
    );
};

export default App;
