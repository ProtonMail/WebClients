import { useState } from 'react';
import { Route, Switch } from 'react-router-dom';

import { ProtonApp, StandardPublicApp, StandardSetup, ModalsChildren, ProminentContainer } from '@proton/components';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import sentry from '@proton/shared/lib/helpers/sentry';

import * as config from './config';
import PrivateApp from './PrivateApp';
import DownloadSharedContainer from './components/DownloadShared/DownloadSharedContainer';

import './app.scss';

const PublicDriveLinkContainer = () => {
    return (
        <>
            <ModalsChildren />
            <DownloadSharedContainer />
        </>
    );
};

const locales = initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.0-beta.26',
    ...config,
};
newVersionUpdater(enhancedConfig);
sentry(enhancedConfig);

const App = () => {
    const [hasInitialAuth] = useState(() => {
        return !window.location.pathname.startsWith('/urls');
    });

    return (
        <ProtonApp config={enhancedConfig} hasInitialAuth={hasInitialAuth}>
            <Switch>
                <Route path="/urls">
                    <StandardPublicApp locales={locales}>
                        <ProminentContainer heightClassName="h100v">
                            <PublicDriveLinkContainer />
                        </ProminentContainer>
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
