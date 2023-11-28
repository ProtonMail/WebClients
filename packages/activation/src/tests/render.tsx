import { ReactElement } from 'react';
import * as React from 'react';
import { Router } from 'react-router';

import { render as originalRender } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { createMemoryHistory } from 'history';

import EasySwitchStoreProvider from '@proton/activation/src/logic/StoreProvider';
import {
    ApiProvider,
    CacheProvider,
    EventManagerProvider,
    EventModelListener,
    ModalsChildren,
    ModalsProvider,
    NotificationsContext,
} from '@proton/components';
import ConfigProvider from '@proton/components/containers/config/Provider';
import FeaturesProvider from '@proton/components/containers/features/FeaturesProvider';
import { APPS } from '@proton/shared/lib/constants';
import { ProtonConfig } from '@proton/shared/lib/interfaces';

import fakeCache from './fakeCache';

/**
 * Mocks
 */
jest.mock('@proton/components/hooks/useEventManager.ts', () => {
    const subscribe = jest.fn();
    const call = jest.fn();
    const stop = jest.fn();
    const start = jest.fn();

    const result = () => {
        return { subscribe, call, stop, start };
    };

    result.subscribe = subscribe;
    result.call = call;
    result.stop = stop;
    result.start = start;

    return result;
});

const config = {
    APP_NAME: APPS.PROTONACCOUNT,
    APP_VERSION: 'test-version',
    DATE_VERSION: 'test-date-version',
    API_URL: 'http://localhost',
} as ProtonConfig;

const eventManager = {
    setEventID: () => {},
    getEventID: () => {},
    start: () => {},
    stop: () => {},
    call: () => {
        // @ts-ignore
        return new Promise<void>();
    },
    reset: () => {},
} as any;

const notificationsManager = {
    clearNotifications: () => {},
    createNotification: () => 0,
    hideNotification: () => {},
    removeNotification: () => {},
    removeDuplicate: () => {},
    setOffset: () => {},
};

let history = createMemoryHistory();

export const EasySwitchTestProviders = ({ children }: { children: JSX.Element | (JSX.Element | null)[] | null }) => (
    <ConfigProvider config={config}>
        <NotificationsContext.Provider value={notificationsManager}>
            <ModalsProvider>
                <ApiProvider config={config}>
                    <EventManagerProvider eventManager={eventManager}>
                        <CacheProvider cache={fakeCache.instance}>
                            <FeaturesProvider>
                                <ModalsChildren />
                                <EventModelListener models={[]} />
                                <Router history={history}>
                                    <EasySwitchStoreProvider>{children}</EasySwitchStoreProvider>
                                </Router>
                            </FeaturesProvider>
                        </CacheProvider>
                    </EventManagerProvider>
                </ApiProvider>
            </ModalsProvider>
        </NotificationsContext.Provider>
    </ConfigProvider>
);

export const easySwitchRender = (ui: ReactElement) => {
    fakeCache.setBase();

    const result = originalRender(<EasySwitchTestProviders>{ui}</EasySwitchTestProviders>);

    return result;
};

const easySwitchHookWrapper = ({ children }: { children: any }) => {
    return <EasySwitchTestProviders>{children}</EasySwitchTestProviders>;
};

export const easySwitchHookRender = (hook: any) => renderHook(() => hook(), { wrapper: easySwitchHookWrapper });
