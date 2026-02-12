import type { ComponentType } from 'react';
import { Router } from 'react-router';

import { createMemoryHistory } from 'history';

import { getModelState } from '@proton/account/test';
import ApiContext from '@proton/components/containers/api/apiContext';
import type { Props as AuthenticationProviderProps } from '@proton/components/containers/authentication/Provider';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import { CacheProvider } from '@proton/components/containers/cache/Provider';
import ConfigProvider from '@proton/components/containers/config/Provider';
import EventManagerContext from '@proton/components/containers/eventManager/context';
import ModalsContext from '@proton/components/containers/modals/modalsContext';
import NotificationsProvider from '@proton/components/containers/notifications/Provider';
import { FREE_PLAN, type Plan } from '@proton/payments';
import { PaymentsContextProvider } from '@proton/payments/ui';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { CLIENT_TYPES } from '@proton/shared/lib/constants';
import type {
    ApiEnvironmentConfig,
    CachedOrganizationKey,
    ProtonConfig,
    UserModel,
} from '@proton/shared/lib/interfaces';
import { defaultVPNServersCountData as mockDefaultVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';
import { buildUser } from '@proton/testing/builders';

import { apiMock } from '../api';
import { mockCache } from '../cache';
import { mockEventManager } from '../event-manager';
import { getOrganizationState, getPaymentStatusState, getSubscriptionState } from '../initialReduxState';
import { mockModals } from '../mockModals';
import { type RootState, setupStore } from './store';

export const withNotifications =
    () =>
    <T extends {}>(Component: ComponentType<T>) =>
        function NotificationsProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <NotificationsProvider>
                    <Component {...props} />
                </NotificationsProvider>
            );
        };

export const withDeprecatedModals =
    (value = mockModals) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function DeprecatedModalsProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <ModalsContext.Provider value={value}>
                    <Component {...props} />
                </ModalsContext.Provider>
            );
        };

export const withCache =
    (cache = mockCache) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function CacheProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <CacheProvider cache={cache}>
                    <Component {...props} />
                </CacheProvider>
            );
        };

export const withApi =
    (api = apiMock) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function ApiProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <ApiContext.Provider value={api}>
                    <Component {...props} />
                </ApiContext.Provider>
            );
        };

export const withEventManager =
    (eventManager = mockEventManager) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function EventManagerProviderHOC(props: T & JSX.IntrinsicAttributes) {
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
    SSO_URL: '',
    VERSION_PATH: '/version.json',
    LOGICAL_SCSS: true,
};

export const withConfig =
    (config: ProtonConfig = defaultProtonConfig) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function ConfigProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <ConfigProvider config={config}>
                    <Component {...props} />
                </ConfigProvider>
            );
        };

export const withAuthentication =
    (store: AuthenticationProviderProps['store'] = { UID: 'uid-123' } as any) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function AuthenticationProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <AuthenticationProvider store={store}>
                    <Component {...props} />
                </AuthenticationProvider>
            );
        };

export const withPaymentContext =
    () =>
    <T extends {}>(Component: ComponentType<T>) =>
        function PaymentContextHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <PaymentsContextProvider>
                    <Component {...props} />
                </PaymentsContextProvider>
            );
        };

type ReduxModelOverrides = Partial<{
    user: UserModel;
    plans: Plan[];
}>;

export type WithReduxStoreProps = {
    preloadedState?: Partial<RootState>;
    store?: ReturnType<typeof setupStore>;
} & ReduxModelOverrides;

export const getPreloadedState = (
    stateOverrides: Partial<RootState> = {},
    modelOverrides: ReduxModelOverrides = {}
) => ({
    user: getModelState(modelOverrides.user ?? buildUser()),
    addresses: getModelState([]),
    addressKeys: {},
    contacts: getModelState([]),
    categories: getModelState([]),
    contactEmails: getModelState([]),
    subscription: getSubscriptionState(),
    paymentStatus: getPaymentStatusState({
        CountryCode: 'CH',
        VendorStates: {
            Card: true,
            Paypal: true,
            Apple: true,
            Cash: true,
            Bitcoin: true,
            Google: true,
        },
    }),
    organization: getOrganizationState(),
    organizationKey: getModelState({} as CachedOrganizationKey),
    userInvitations: getModelState([]),
    plans: getModelState({ plans: modelOverrides.plans ?? [], freePlan: FREE_PLAN }),
    features: {},
    importerConfig: getModelState({} as ApiEnvironmentConfig),
    vpnServersCount: getModelState(mockDefaultVPNServersCountData),
    ...stateOverrides,
});

export const withReduxStore =
    (props: WithReduxStoreProps = {}) =>
    <T extends {}>(Component: ComponentType<T>) => {
        const store =
            props.store ??
            setupStore({
                preloadedState: getPreloadedState(props.preloadedState, props),
            });

        const ReduxStoreHoc = (props: T & JSX.IntrinsicAttributes) => {
            return (
                <ProtonStoreProvider store={store}>
                    <Component {...props} />
                </ProtonStoreProvider>
            );
        };

        ReduxStoreHoc.displayName = `withReduxStore(${Component.displayName || Component.name})`;

        return ReduxStoreHoc;
    };

export const withMemoryRouter =
    () =>
    <T extends {}>(Component: ComponentType<T>) => {
        const history = createMemoryHistory();

        const MemoryRouterHoc = (props: T & JSX.IntrinsicAttributes) => {
            return (
                <Router history={history}>
                    <Component {...props} />
                </Router>
            );
        };

        MemoryRouterHoc.displayName = `withMemoryRouter(${Component.displayName || Component.name})`;

        return MemoryRouterHoc;
    };
