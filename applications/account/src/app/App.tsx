import { useState } from 'react';
import { Route, Switch } from 'react-router-dom';

import { G_OAUTH_REDIRECT_PATH } from '@proton/activation/constants';
import { ErrorBoundary, LoaderPage, ProtonApp, StandardErrorPage, getSessionTrackingEnabled } from '@proton/components';
import { initMainHost } from '@proton/cross-storage';
import authentication from '@proton/shared/lib/authentication/authentication';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import { getProdId, setVcalProdId } from '@proton/shared/lib/calendar/vcalConfig';
import sentry from '@proton/shared/lib/helpers/sentry';
import { initLocales } from '@proton/shared/lib/i18n/locales';

import Setup from './Setup';
import * as config from './config';

import './app.scss';

initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

initMainHost();
newVersionUpdater(config);
sentry({ config, uid: authentication.getUID(), sessionTracking: getSessionTrackingEnabled() });
setVcalProdId(getProdId(config));

const App = () => {
    const [hasInitialAuth] = useState(() => {
        return !window.location.pathname.startsWith(G_OAUTH_REDIRECT_PATH);
    });

    return (
        <ProtonApp authentication={authentication} config={config} hasInitialAuth={hasInitialAuth}>
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
