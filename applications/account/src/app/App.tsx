import React from 'react';
import { hot } from 'react-hot-loader/root';
import { PublicAuthenticationStore, PrivateAuthenticationStore, ProtonApp, useAuthentication } from 'react-components';
import sentry from 'proton-shared/lib/helpers/sentry';
import locales from 'proton-shared/lib/i18n/locales';

import * as config from './config';
import PrivateApp from './content/PrivateApp';
import PublicApp from './content/PublicApp';

import './app.scss';

sentry(config);

const Setup = () => {
    const { UID, login, logout } = useAuthentication() as PublicAuthenticationStore & PrivateAuthenticationStore;
    if (UID) {
        return <PrivateApp locales={locales} onLogout={logout} />;
    }
    return <PublicApp locales={locales} onLogin={login} />;
};

const App = () => {
    return (
        <ProtonApp config={config}>
            <Setup />
        </ProtonApp>
    );
};

export default hot(App);
