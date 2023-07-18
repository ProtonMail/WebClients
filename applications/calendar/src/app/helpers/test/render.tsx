import { ReactElement, ReactNode } from 'react';
import * as React from 'react';
import { Router } from 'react-router';

import { render as originalRender } from '@testing-library/react';
import { renderHook as originalRenderHook } from '@testing-library/react-hooks';
import { createMemoryHistory } from 'history';

import { CacheProvider, ExperimentsProvider, ModalsChildren, ModalsProvider } from '@proton/components';
import ConfigProvider from '@proton/components/containers/config/Provider';
import { APPS } from '@proton/shared/lib/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import { ProtonConfig } from '@proton/shared/lib/interfaces';

import NotificationsTestProvider from './NotificationsTestProvider';

jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

const history = createMemoryHistory({ initialEntries: ['/'] });

const config = {
    APP_NAME: APPS.PROTONCALENDAR,
    APP_VERSION: 'test-app-version',
    DATE_VERSION: 'test-date-version',
} as ProtonConfig;

const TestProvider = ({ children }: { children: ReactNode }) => (
    <ConfigProvider config={config}>
        <NotificationsTestProvider>
            <ModalsProvider>
                <CacheProvider cache={createCache()}>
                    <ExperimentsProvider>
                        <ModalsChildren />
                        <Router history={history}>{children}</Router>
                    </ExperimentsProvider>
                </CacheProvider>
            </ModalsProvider>
        </NotificationsTestProvider>
    </ConfigProvider>
);

export const render = (ui: ReactElement) =>
    originalRender(ui, {
        wrapper: TestProvider,
    });

export const renderHook = <TProps, TResult>(callback: (props: TProps) => TResult) =>
    originalRenderHook<TProps, TResult>(callback, { wrapper: TestProvider as any });
