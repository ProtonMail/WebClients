import { useRef } from 'react';
import createCache, { Cache } from '@proton/shared/lib/helpers/cache';
import { noop } from '@proton/shared/lib/helpers/function';

import { newVersionUpdater } from '@proton/shared/lib/busy';
import sentry from '@proton/shared/lib/helpers/sentry';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import { getProdId, setVcalProdId } from '@proton/shared/lib/calendar/vcalConfig';
import {
    ApiProvider,
    ConfigProvider,
    ThemeProvider,
    Icons,
    ModalsProvider,
    PreventLeaveProvider,
    RightToLeftProvider,
    CompatibilityCheck,
    NotificationsChildren,
    NotificationsProvider,
    CacheProvider,
    StandardPublicApp,
} from '@proton/components';
import { BrowserRouter as Router } from 'react-router-dom';

import * as config from './config';

import './app.scss';
import { registerMailToProtocolHandler } from './helpers/url';

import EOContainer from './containers/eo/EOContainer';

const locales = initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.13',
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
