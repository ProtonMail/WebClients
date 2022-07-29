import { useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
    ApiProvider,
    CacheProvider,
    CompatibilityCheck,
    ConfigProvider,
    Icons,
    ModalsProvider,
    NotificationsChildren,
    NotificationsProvider,
    PreventLeaveProvider,
    RightToLeftProvider,
    StandardPublicApp,
    ThemeProvider,
    getSessionTrackingEnabled,
} from '@proton/components';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import { getProdId, setVcalProdId } from '@proton/shared/lib/calendar/vcalConfig';
import createCache, { Cache } from '@proton/shared/lib/helpers/cache';
import sentry from '@proton/shared/lib/helpers/sentry';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import noop from '@proton/utils/noop';

import * as config from './config';
import EOContainer from './containers/eo/EOContainer';
import { registerMailToProtocolHandler } from './helpers/url';

import './app.scss';

const locales = initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

newVersionUpdater(config);
sentry({ config, sessionTracking: getSessionTrackingEnabled() });
setVcalProdId(getProdId(config));

// If the browser is Chromium based, register automatically the mailto protocol handler
if ('chrome' in window) {
    registerMailToProtocolHandler();
}

const App = () => {
    const cacheRef = useRef<Cache<string, any>>();
    if (!cacheRef.current) {
        cacheRef.current = createCache<string, any>();
    }

    return (
        <ConfigProvider config={config}>
            <CompatibilityCheck>
                <Icons />
                <RightToLeftProvider>
                    <ThemeProvider>
                        <Router>
                            <PreventLeaveProvider>
                                <NotificationsProvider>
                                    <ModalsProvider>
                                        <ApiProvider config={config} onLogout={noop}>
                                            <CacheProvider cache={cacheRef.current}>
                                                <NotificationsChildren />
                                                <StandardPublicApp locales={locales}>
                                                    <EOContainer />
                                                </StandardPublicApp>
                                            </CacheProvider>
                                        </ApiProvider>
                                    </ModalsProvider>
                                </NotificationsProvider>
                            </PreventLeaveProvider>
                        </Router>
                    </ThemeProvider>
                </RightToLeftProvider>
            </CompatibilityCheck>
        </ConfigProvider>
    );
};

export default App;
