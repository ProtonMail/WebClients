import React from 'react';
import { Route, Router } from 'react-router';

import { createMemoryHistory } from 'history';

import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

import ConfigProvider from '../config/Provider';

export const DEFAULT_CONFIG = {
    APP_NAME: APPS.PROTONMAIL,
    APP_VERSION: 'test-version',
    DATE_VERSION: 'test-date-version',
} as ProtonConfig;

let routeHistory = createMemoryHistory({ initialEntries: ['/inbox'] });
const MAIL_MAIN_ROUTE_PATH = '/:labelID?/:elementID?/:messageID?';

export const OffersTestProvider = ({
    children,
    config = DEFAULT_CONFIG,
}: {
    children: React.ReactNode;
    config?: ProtonConfig;
}) => (
    <ConfigProvider config={config}>
        <Router history={routeHistory}>
            <Route path={MAIL_MAIN_ROUTE_PATH}>{children}</Route>
        </Router>
    </ConfigProvider>
);
