import React, { useState } from 'react';
import { Route, Switch } from 'react-router-dom';

import { ProtonApp, StandardPublicApp, StandardSetup, ModalsChildren } from 'react-components';
import locales from 'proton-shared/lib/i18n/locales';
import sentry from 'proton-shared/lib/helpers/sentry';

import * as config from './config';
import PrivateApp from './PrivateApp';
import DownloadSharedContainer from './containers/DownloadSharedContainer';
import { DownloadProvider } from './components/downloads/DownloadProvider';

import './app.scss';

const PublicDriveLinkContainer = () => {
    return (
        <DownloadProvider>
            <ModalsChildren />
            <DownloadSharedContainer />
        </DownloadProvider>
    );
};

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.0-beta.1',
    ...config,
};

sentry(enhancedConfig);

const App = () => {
    const [hasInitialAuth] = useState(() => {
        return window.location.pathname.startsWith('/urls');
    });

    return (
        <ProtonApp config={enhancedConfig} hasInitialAuth={hasInitialAuth}>
            <Switch>
                <Route path="/urls">
                    <StandardPublicApp locales={locales}>
                        <PublicDriveLinkContainer />
                    </StandardPublicApp>
                </Route>
                <Route path="*">
                    <StandardSetup PrivateApp={PrivateApp} locales={locales} />
                </Route>
            </Switch>
        </ProtonApp>
    );
};

export default App;
