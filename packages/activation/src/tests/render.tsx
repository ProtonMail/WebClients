import type { JSX, PropsWithChildren, ReactElement } from 'react';
import { Router } from 'react-router';

import { render as originalRender } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { vi } from 'vitest';

import { getModelState } from '@proton/account/testing/getModelState';
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext';
import ApiProvider from '@proton/components/containers/api/ApiProvider';
import { CacheProvider } from '@proton/components/containers/cache/Provider';
import ConfigProvider from '@proton/components/containers/config/Provider';
import EventManagerProvider from '@proton/components/containers/eventManager/EventManagerProvider';
import ModalsChildren from '@proton/components/containers/modals/Children';
import ModalsProvider from '@proton/components/containers/modals/Provider';
import { getFeatureFlagsState } from '@proton/features/testing/vitest/features';
import { ProtonStoreProvider } from '@proton/redux-shared-store/sharedProvider';
import createApi from '@proton/shared/lib/api/createApi';
import { APPS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';

import EasySwitchStoreProvider from '../logic/StoreProvider';
import fakeCache from './fakeCache';
import { setupStore } from './protonStore';

/**
 * Mocks
 */
vi.mock('@proton/components/hooks/useEventManager', () => {
    const subscribe = vi.fn();
    const call = vi.fn();
    const stop = vi.fn();
    const start = vi.fn();

    const result = () => {
        return { subscribe, call, stop, start };
    };

    result.subscribe = subscribe;
    result.call = call;
    result.stop = stop;
    result.start = start;

    return { default: result };
});

vi.mock('../hooks/useBYOEFeatureStatus', () => {
    return { default: vi.fn(() => [false, false] as const) };
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

const history = createMemoryHistory();
const api = createApi({ config });

const EasySwitchTestProviders = ({ children }: { children: JSX.Element | (JSX.Element | null)[] | null }) => (
    <ConfigProvider config={config}>
        <NotificationsContext.Provider value={notificationsManager}>
            <ModalsProvider>
                <Router history={history}>
                    <ApiProvider api={api}>
                        <EventManagerProvider eventManager={eventManager}>
                            <CacheProvider cache={fakeCache.instance}>
                                <ModalsChildren />
                                <EasySwitchStoreProvider>{children}</EasySwitchStoreProvider>
                            </CacheProvider>
                        </EventManagerProvider>
                    </ApiProvider>
                </Router>
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
            features: getFeatureFlagsState([]),
            calendars: getModelState([]),
            ...preloadedState,
        },
    });

    function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
        return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
    }

    return { Wrapper, store };
};

export const easySwitchRender = (ui: ReactElement, preloadedState?: any) => {
    fakeCache.setBase();

    const { Wrapper } = getStoreWrapper(preloadedState);

    const result = originalRender(
        <Wrapper>
            <EasySwitchTestProviders>{ui}</EasySwitchTestProviders>
        </Wrapper>
    );

    return result;
};
