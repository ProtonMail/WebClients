import { useState } from 'react';
import { Route, Switch } from 'react-router-dom';

import { ProtonApp, StandardPublicApp, StandardSetup, getSessionTrackingEnabled } from '@proton/components';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import sentry from '@proton/shared/lib/helpers/sentry';
import authentication from '@proton/shared/lib/authentication/authentication';

import * as config from './config';
import PrivateApp from './PrivateApp';
import DownloadSharedContainer from './components/DownloadShared/DownloadSharedContainer';

import './app.scss';

const locales = initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

newVersionUpdater(config);
sentry({ config, uid: authentication.getUID(), sessionTracking: getSessionTrackingEnabled() });

const App = () => {
    const [hasInitialAuth] = useState(() => {
        return !window.location.pathname.startsWith('/urls');
    });

    return (
        <ProtonApp authentication={authentication} config={config} hasInitialAuth={hasInitialAuth}>
            <Switch>
                <Route path="/urls">
                    <StandardPublicApp locales={locales}>
                        <div className="ui-prominent h100v">
                            <DownloadSharedContainer />
                        </div>
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
