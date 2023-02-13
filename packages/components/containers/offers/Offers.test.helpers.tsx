import React from 'react';
import { Route, Router } from 'react-router';

import { createMemoryHistory } from 'history';

import {
    CacheProvider,
    ConfigProvider,
    FeaturesProvider,
    ModalsProvider,
    NotificationsProvider,
} from '@proton/components/';
import ApiContext from '@proton/components/containers/api/apiContext';
import { APPS } from '@proton/shared/lib/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import { ProtonConfig } from '@proton/shared/lib/interfaces';
import { STATUS } from '@proton/shared/lib/models/cache';
import { mockApiWithServer } from '@proton/testing';

export const DEFAULT_CONFIG = {
    APP_NAME: APPS.PROTONMAIL,
    APP_VERSION: 'test-version',
    DATE_VERSION: 'test-date-version',
} as ProtonConfig;

let routeHistory = createMemoryHistory({ initialEntries: ['/inbox'] });
const MAIL_MAIN_ROUTE_PATH = '/:labelID?/:elementID?/:messageID?';

let cache = createCache();

export const offersCache = {
    cache,
    add: (key: string, value: any) => {
        cache.set(key, { status: STATUS.RESOLVED, value });
    },
    clear: () => {
        cache.clear();
    },
};

export const OffersTestProvider = ({
    children,
    config = DEFAULT_CONFIG,
}: {
    children: React.ReactNode;
    config?: ProtonConfig;
}) => (
    <ConfigProvider config={config}>
        <ApiContext.Provider value={mockApiWithServer}>
            <NotificationsProvider>
                <ModalsProvider>
                    <CacheProvider cache={cache}>
                        <FeaturesProvider>
                            <Router history={routeHistory}>
                                <Route path={MAIL_MAIN_ROUTE_PATH}>{children}</Route>
                            </Router>
                        </FeaturesProvider>
                    </CacheProvider>
                </ModalsProvider>
            </NotificationsProvider>
        </ApiContext.Provider>
    </ConfigProvider>
);
