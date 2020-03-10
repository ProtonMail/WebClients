import { hot } from 'react-hot-loader/root';
import React from 'react';
import { ProtonApp, useAuthentication, LoaderPage } from 'react-components';
import sentry from 'proton-shared/lib/helpers/sentry';

import * as config from './config';
import PrivateApp from './PrivateApp';
import PublicApp from './PublicApp';

import './app.scss';
import { redirectTo } from 'proton-shared/lib/helpers/browser';
import { c } from 'ttag';

sentry(config);

const Redirect = () => {
    redirectTo();
    return <LoaderPage text={c('Info').t`Loading ProtonDrive`} />;
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
    return (
        <div className="App body mod--hidden content">
            <ProtonApp config={config}>
                <Setup />
            </ProtonApp>
        </div>
    );
};

export default hot(App);
