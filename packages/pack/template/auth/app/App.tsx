import { hot } from 'react-hot-loader/root';
import React from 'react';
import { ProtonApp, useAuthentication, useInstance } from 'react-components';
import createSecureSessionStorage from 'proton-shared/lib/createSecureSessionStorage';
import { MAILBOX_PASSWORD_KEY, UID_KEY } from 'proton-shared/lib/constants';

import * as config from './config';
import PrivateApp from './PrivateApp';
import PublicApp from './PublicApp';

import './app.scss';

const Setup = () => {
    const { UID, login, logout } = useAuthentication();
    if (UID) {
        return <PrivateApp onLogout={logout} />;
    }
    return <PublicApp onLogin={login} />;
};

const App = () => {
    const storage = useInstance(() => createSecureSessionStorage([MAILBOX_PASSWORD_KEY, UID_KEY]));
    return (
        <div className="App body mod--hidden content">
            <ProtonApp config={config} storage={storage}>
                <Setup />
            </ProtonApp>
        </div>
    );
};

export default hot(App);
