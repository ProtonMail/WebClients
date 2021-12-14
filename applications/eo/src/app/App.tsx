import { useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { noop } from '@proton/shared/lib/helpers/function';
import {
    ApiProvider,
    ConfigProvider,
    FeaturesProvider,
    Icons,
    ModalsChildren,
    ModalsProvider,
    NotificationsChildren,
    NotificationsProvider,
    PreventLeaveProvider,
    RightToLeftProvider,
} from '@proton/components';
import createCache, { Cache } from '@proton/shared/lib/helpers/cache';
import CacheProvider from '@proton/components/containers/cache/Provider';
import CompatibilityCheck from '@proton/components/containers/compatibilityCheck/CompatibilityCheck';

import * as config from './config';
import './app.scss';
import MainContainer from './MainContainer';

const App = () => {
    const cacheRef = useRef<Cache<string, any>>();
    if (!cacheRef.current) {
        cacheRef.current = createCache<string, any>();
    }

    return (
        <ConfigProvider config={config}>
            <CompatibilityCheck>
                <Router>
                    <RightToLeftProvider>
                        <Icons />
                        <PreventLeaveProvider>
                            <NotificationsProvider>
                                <ModalsProvider>
                                    <ApiProvider config={config} onLogout={noop}>
                                        <FeaturesProvider>
                                            <CacheProvider cache={cacheRef.current}>
                                                <MainContainer />
                                                <ModalsChildren />
                                                <NotificationsChildren />
                                            </CacheProvider>
                                        </FeaturesProvider>
                                    </ApiProvider>
                                </ModalsProvider>
                            </NotificationsProvider>
                        </PreventLeaveProvider>
                    </RightToLeftProvider>
                </Router>
            </CompatibilityCheck>
        </ConfigProvider>
    );
};

export default App;
