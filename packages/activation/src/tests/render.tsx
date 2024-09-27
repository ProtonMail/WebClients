import type { PropsWithChildren, ReactElement } from 'react';
import { Router } from 'react-router';

import { render as originalRender } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { createMemoryHistory } from 'history';

import { getModelState } from '@proton/account/test';
import EasySwitchStoreProvider from '@proton/activation/src/logic/StoreProvider';
import {
    ApiProvider,
    CacheProvider,
    ConfigProvider,
    EventManagerProvider,
    ModalsChildren,
    ModalsProvider,
    NotificationsContext,
} from '@proton/components';
import { FeatureCode } from '@proton/features';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import createApi from '@proton/shared/lib/api/createApi';
import { APPS } from '@proton/shared/lib/constants';
import type { MailSettings, ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { getFeatureFlagsState } from '@proton/testing';

import fakeCache from './fakeCache';
import { setupStore } from './protonStore';

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
const api = createApi({ config });

export const EasySwitchTestProviders = ({ children }: { children: JSX.Element | (JSX.Element | null)[] | null }) => (
    <ConfigProvider config={config}>
        <NotificationsContext.Provider value={notificationsManager}>
            <ModalsProvider>
                <ApiProvider api={api}>
                    <EventManagerProvider eventManager={eventManager}>
                        <CacheProvider cache={fakeCache.instance}>
                            <ModalsChildren />
                            <Router history={history}>
                                <EasySwitchStoreProvider>{children}</EasySwitchStoreProvider>
                            </Router>
                        </CacheProvider>
                    </EventManagerProvider>
                </ApiProvider>
            </ModalsProvider>
        </NotificationsContext.Provider>
    </ConfigProvider>
);

const getStoreWrapper = (preloadedState?: any) => {
    const store = setupStore({
        preloadedState: {
            user: getModelState({ UsedSpace: 10, MaxSpace: 100 } as UserModel),
            addresses: getModelState([]),
            mailSettings: getModelState({} as MailSettings),
            categories: getModelState([]),
            features: getFeatureFlagsState([[FeatureCode.EasySwitch, true]]),
            calendars: getModelState([]),
            ...preloadedState,
        },
    });

    function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
        return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
    }

    return { Wrapper, store };
};

export const easySwitchRender = (ui: ReactElement) => {
    fakeCache.setBase();

    const { Wrapper } = getStoreWrapper();

    const result = originalRender(
        <Wrapper>
            <EasySwitchTestProviders>{ui}</EasySwitchTestProviders>
        </Wrapper>
    );

    return result;
};

const easySwitchHookWrapper = ({ children }: { children: any }) => {
    const { Wrapper } = getStoreWrapper();
    return (
        <Wrapper>
            <EasySwitchTestProviders>{children}</EasySwitchTestProviders>
        </Wrapper>
    );
};

export const easySwitchHookRender = (hook: any) => renderHook(() => hook(), { wrapper: easySwitchHookWrapper });
