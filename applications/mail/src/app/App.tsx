import { useState } from 'react';
import { Route, Switch } from 'react-router-dom';

import { G_OAUTH_REDIRECT_PATH } from '@proton/activation/src/constants';
import { LoaderPage, ProtonApp, StandardSetup, getSessionTrackingEnabled } from '@proton/components';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import authentication from '@proton/shared/lib/authentication/authentication';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import { getProdId, setVcalProdId } from '@proton/shared/lib/calendar/vcalConfig';
import sentry from '@proton/shared/lib/helpers/sentry';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';

import PrivateApp from './PrivateApp';
import * as config from './config';
import { registerMailToProtocolHandler } from './helpers/url';
import locales from './locales';

import './app.scss';

setTtagLocales(locales);
setupGuestCrossStorage();
newVersionUpdater(config);
sentry({ config, uid: authentication.getUID(), sessionTracking: getSessionTrackingEnabled() });
setVcalProdId(getProdId(config));

// If the browser is Chromium based, register automatically the mailto protocol handler
if ('chrome' in window) {
    registerMailToProtocolHandler();
}

const App = () => {
    const [hasInitialAuth] = useState(() => {
        return !window.location.pathname.startsWith(G_OAUTH_REDIRECT_PATH);
    });

    return (
        <ProtonApp authentication={authentication} config={config} hasInitialAuth={hasInitialAuth}>
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
