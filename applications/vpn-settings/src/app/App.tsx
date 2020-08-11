import { hot } from 'react-hot-loader/root';
import React from 'react';
import { ProtonApp, useAuthentication, PublicAuthenticationStore, PrivateAuthenticationStore } from 'react-components';
import sentry from 'proton-shared/lib/helpers/sentry';

import * as config from './config';
import PrivateApp from './PrivateApp';
import PublicApp from './PublicApp';

import './app.scss';

sentry(config);

const Setup = () => {
    const { UID, login, logout } = useAuthentication() as PublicAuthenticationStore & PrivateAuthenticationStore;
    if (UID) {
        return <PrivateApp onLogout={logout} />;
    }
    return <PublicApp onLogin={login} />;
};

const App = () => {
    return (
        <ProtonApp config={config}>
            <Setup />
        </ProtonApp>
    );
};

export default hot(App);
