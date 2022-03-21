import { useState } from 'react';
import { Route, Switch } from 'react-router-dom';

import { LoaderPage, ProtonApp, StandardSetup } from '@proton/components';
import { G_OAUTH_REDIRECT_PATH } from '@proton/components/containers/easySwitch/constants';

import { newVersionUpdater } from '@proton/shared/lib/busy';
import sentry from '@proton/shared/lib/helpers/sentry';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import { getProdId, setVcalProdId } from '@proton/shared/lib/calendar/vcalConfig';

import * as config from './config';
import PrivateApp from './PrivateApp';

import './app.scss';
import { registerMailToProtocolHandler } from './helpers/url';

const locales = initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.19',
    ...config,
};

newVersionUpdater(enhancedConfig);
sentry(enhancedConfig);
setVcalProdId(getProdId(enhancedConfig));

// If the browser is Chromium based, register automatically the mailto protocol handler
if ('chrome' in window) {
    registerMailToProtocolHandler();
}

const App = () => {
    const [hasInitialAuth] = useState(() => {
        return !window.location.pathname.startsWith(G_OAUTH_REDIRECT_PATH);
    });

    return (
        <ProtonApp config={enhancedConfig} hasInitialAuth={hasInitialAuth}>
            <Switch>
                <Route path={G_OAUTH_REDIRECT_PATH}>
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
