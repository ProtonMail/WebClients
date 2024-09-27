import type { ComponentType } from 'react';

import ApiContext from '@proton/components/containers/api/apiContext';
import type { Props as AuthenticationProviderProps } from '@proton/components/containers/authentication/Provider';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import { CacheProvider } from '@proton/components/containers/cache/Provider';
import ConfigProvider from '@proton/components/containers/config/Provider';
import EventManagerContext from '@proton/components/containers/eventManager/context';
import ModalsContext from '@proton/components/containers/modals/modalsContext';
import NotificationsProvider from '@proton/components/containers/notifications/Provider';
import { PaymentSwitcherContext } from '@proton/components/payments/client-extensions/useChargebeeContext';
import { CLIENT_TYPES } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';

import { apiMock } from '../api';
import { mockCache } from '../cache';
import { mockEventManager } from '../event-manager';
import { mockModals } from '../mockModals';

export const withNotifications =
    () =>
    <T extends {}>(Component: ComponentType<T>) =>
    (props: T & JSX.IntrinsicAttributes) => {
        return (
            <NotificationsProvider>
                <Component {...props} />
            </NotificationsProvider>
        );
    };

export const withDeprecatedModals =
    (value = mockModals) =>
    <T extends {}>(Component: ComponentType<T>) =>
    (props: T & JSX.IntrinsicAttributes) => {
        return (
            <ModalsContext.Provider value={value}>
                <Component {...props} />
            </ModalsContext.Provider>
        );
    };

export const withCache =
    (cache = mockCache) =>
    <T extends {}>(Component: ComponentType<T>) =>
    (props: T & JSX.IntrinsicAttributes) => {
        return (
            <CacheProvider cache={cache}>
                <Component {...props} />
            </CacheProvider>
        );
    };

export const withApi =
    (api = apiMock) =>
    <T extends {}>(Component: ComponentType<T>) =>
    (props: T & JSX.IntrinsicAttributes) => {
        return (
            <ApiContext.Provider value={api}>
                <Component {...props} />
            </ApiContext.Provider>
        );
    };

export const withEventManager =
    (eventManager = mockEventManager) =>
    <T extends {}>(Component: ComponentType<T>) =>
    (props: T & JSX.IntrinsicAttributes) => {
        return (
            <EventManagerContext.Provider value={eventManager}>
                <Component {...props} />
            </EventManagerContext.Provider>
        );
    };

export const defaultProtonConfig: ProtonConfig = {
    CLIENT_TYPE: CLIENT_TYPES.MAIL,
    CLIENT_SECRET: 'secret',
    APP_VERSION: '1.0.0',
    APP_NAME: 'proton-account',
    API_URL: 'https://proton.me/api',
    LOCALES: {},
    DATE_VERSION: '2020-01-01',
    COMMIT: 'b8a9c0d1e2f3a4b5c6d4e8f9a0b2c2d3e4f5a6b7',
    BRANCH: 'main',
    SENTRY_DSN: '',
    VERSION_PATH: '/version.json',
};

export const withConfig =
    (config: ProtonConfig = defaultProtonConfig) =>
    <T extends {}>(Component: ComponentType<T>) =>
    (props: T & JSX.IntrinsicAttributes) => {
        return (
            <ConfigProvider config={config}>
                <Component {...props} />
            </ConfigProvider>
        );
    };

export const withAuthentication =
    (store: AuthenticationProviderProps['store'] = { UID: 'uid-123' } as any) =>
    <T extends {}>(Component: ComponentType<T>) =>
    (props: T & JSX.IntrinsicAttributes) => {
        return (
            <AuthenticationProvider store={store}>
                <Component {...props} />
            </AuthenticationProvider>
        );
    };

export const withPaymentContext =
    (enableChargebee: ChargebeeEnabled = ChargebeeEnabled.INHOUSE_FORCED) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function PaymentContextHoc(props: T & JSX.IntrinsicAttributes) {
            return (
                <PaymentSwitcherContext.Provider
                    value={{
                        enableChargebeeRef: {
                            current: enableChargebee,
                        },
                        calledKillSwitch: 'not-called',
                        setCalledKillSwitch: () => {},
                    }}
                >
                    <Component {...props} />
                </PaymentSwitcherContext.Provider>
            );
        };
