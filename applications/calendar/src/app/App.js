import { hot } from 'react-hot-loader/root';
import React from 'react';
import { ProtonApp, Loader, useAuthentication, useInstance } from 'react-components';
import createSecureSessionStorage from 'proton-shared/lib/createSecureSessionStorage';
import { MAILBOX_PASSWORD_KEY, UID_KEY } from 'proton-shared/lib/constants';

import * as config from './config';
import PrivateApp from './content/PrivateApp';
import PublicApp from './content/PublicApp';

import './app.scss';

const Redirect = () => {
    document.location.replace(document.location.origin);
    return <Loader />;
};

const Setup = () => {
    const { UID, login, logout } = useAuthentication();

    if (UID) {
        return <PrivateApp onLogout={logout} />;
    }

    if (PL_IS_STANDALONE) {
        return <PublicApp onLogin={login} />;
    }

    return <Redirect />;
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
