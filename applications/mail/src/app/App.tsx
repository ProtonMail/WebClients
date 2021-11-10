import { useState } from 'react';
import { Route, Switch } from 'react-router-dom';

import { LoaderPage, ProtonApp, StandardSetup } from '@proton/components';
import { G_OAUTH_REDIRECT_PATH } from '@proton/components/containers/easySwitch/constants';

import { newVersionUpdater } from '@proton/shared/lib/busy';
import sentry from '@proton/shared/lib/helpers/sentry';
import { initLocales } from '@proton/shared/lib/i18n/locales';

import * as config from './config';
import PrivateApp from './PrivateApp';
import { MAILTO_PROTOCOL_HANDLER_PATH } from './constants';

import './app.scss';

const locales = initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.11',
    ...config,
};

newVersionUpdater(enhancedConfig);
sentry(enhancedConfig);

if ('registerProtocolHandler' in navigator) {
    try {
        navigator.registerProtocolHandler(
            'mailto',
            `${window.location.origin}${MAILTO_PROTOCOL_HANDLER_PATH}`,
            // @ts-expect-error third arg is still recommended (cf. https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler)
            'ProtonMail'
        );
    } catch (e: any) {
        console.error(e);
    }
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
