import { useState } from 'react';
import { Route, Switch } from 'react-router-dom';

import sentry from '@proton/shared/lib/helpers/sentry';
import { LoaderPage, ProtonApp, ErrorBoundary, StandardErrorPage } from '@proton/components';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import { G_OAUTH_REDIRECT_PATH } from '@proton/components/containers/easySwitch/constants';
import { getProdId, setVcalProdId } from '@proton/shared/lib/calendar/vcalConfig';

import * as config from './config';
import Setup from './Setup';

import './app.scss';

initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.10',
    ...config,
};

newVersionUpdater(enhancedConfig);
sentry(enhancedConfig);
setVcalProdId(getProdId(enhancedConfig));

const App = () => {
    const [hasInitialAuth] = useState(() => {
        return !window.location.pathname.startsWith(G_OAUTH_REDIRECT_PATH);
    });

    return (
        <ProtonApp config={enhancedConfig} hasInitialAuth={hasInitialAuth}>
            <ErrorBoundary component={<StandardErrorPage />}>
                <Switch>
                    <Route path={G_OAUTH_REDIRECT_PATH}>
                        <LoaderPage />
                    </Route>
                    <Route path="*">
                        <Setup />
                    </Route>
                </Switch>
            </ErrorBoundary>
        </ProtonApp>
    );
};

export default App;
