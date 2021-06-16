import React, { useState } from 'react';
import { Route, Switch } from 'react-router-dom';

import { LoaderPage, ProtonApp, StandardSetup } from 'react-components';

import sentry from 'proton-shared/lib/helpers/sentry';
import locales from 'proton-shared/lib/i18n/locales';

import * as config from './config';
import PrivateApp from './PrivateApp';

import './app.scss';

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.1',
    ...config,
};

sentry(enhancedConfig);

const PUBLIC_PATH_PREFIX = '/oauth/callback';

const App = () => {
    const [hasInitialAuth] = useState(() => {
        return !window.location.pathname.startsWith(PUBLIC_PATH_PREFIX);
    });

    return (
        <ProtonApp config={enhancedConfig} hasInitialAuth={hasInitialAuth}>
            <Switch>
                <Route path={PUBLIC_PATH_PREFIX}>
                    <LoaderPage />
                </Route>
                <Route path="*">
                    <StandardSetup PrivateApp={PrivateApp} locales={locales} />
                </Route>
            </Switch>
        </ProtonApp>
    );
};

export default App;
