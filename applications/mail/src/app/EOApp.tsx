import { useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
    ApiProvider,
    CacheProvider,
    CompatibilityCheck,
    ConfigProvider,
    FeaturesProvider,
    Icons,
    LoaderPage,
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
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import noop from '@proton/utils/noop';

import * as config from './config';
import EOContainer from './containers/eo/EOContainer';
import { registerMailToProtocolHandler } from './helpers/url';
import locales from './locales';

import './app.scss';

setTtagLocales(locales);
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
                                                <FeaturesProvider>
                                                    <NotificationsChildren />
                                                    <StandardPublicApp loader={<LoaderPage />} locales={locales}>
                                                        <EOContainer />
                                                    </StandardPublicApp>
                                                </FeaturesProvider>
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
