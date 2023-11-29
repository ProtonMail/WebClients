import { PropsWithChildren, ReactElement, ReactNode, useRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Route, Router } from 'react-router';

import {
    RenderResult as OriginalRenderResult,
    RenderOptions,
    act,
    render as originalRender,
} from '@testing-library/react';
import { act as actHook, renderHook as originalRenderHook } from '@testing-library/react-hooks';
import { MemoryHistory, createMemoryHistory } from 'history';

import { getModelState } from '@proton/account/test';
import {
    CacheProvider,
    CalendarModelEventManagerProvider,
    EventModelListener,
    FeatureCode,
    ModalsChildren,
    ModalsProvider,
    PrivateAuthenticationStore,
} from '@proton/components';
import SpotlightProvider from '@proton/components/components/spotlight/Provider';
import ApiContext from '@proton/components/containers/api/apiContext';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import ConfigProvider from '@proton/components/containers/config/Provider';
import { DrawerProvider } from '@proton/components/hooks/drawer/useDrawer';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { APPS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import {
    ApiEnvironmentConfig,
    CachedOrganizationKey,
    DecryptedKey,
    Organization,
    ProtonConfig,
    SubscriptionModel,
    UserModel,
    UserSettings,
} from '@proton/shared/lib/interfaces';
import { DEFAULT_MAILSETTINGS, DELAY_IN_SECONDS, PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';
import { ConversationCountsModel, MessageCountsModel } from '@proton/shared/lib/models';
import { registerFeatureFlagsApiMock } from '@proton/testing/lib/features';

import { CheckAllRefProvider } from 'proton-mail/containers/CheckAllRefProvider';
import QuickSettingsTestProvider from 'proton-mail/helpers/test/quick-settings';

import { LabelActionsContextProvider } from '../../components/sidebar/EditLabelContext';
import { MAIN_ROUTE_PATH } from '../../constants';
import { ComposeProvider } from '../../containers/ComposeProvider';
import EncryptedSearchProvider from '../../containers/EncryptedSearchProvider';
import { MailboxContainerContextProvider } from '../../containers/mailbox/MailboxContainerProvider';
import ChecklistsProvider from '../../containers/onboardingChecklist/provider/ChecklistsProvider';
import { MailContentRefProvider } from '../../hooks/useClickMailContent';
import { store, useSetReduxThunkExtraArgs } from '../../logic/store';
import { MailState, extendStore, setupStore } from '../../store/store';
import { api, getFeatureFlags, mockDomApi } from './api';
import { minimalCache, mockCache } from './cache';
import NotificationsTestProvider from './notifications';

interface RenderResult extends OriginalRenderResult {
    rerender: (ui: React.ReactElement) => Promise<void>;
}

export const authentication = {
    getUID: jest.fn(() => 'uid'),
    getLocalID: jest.fn(),
    getPassword: jest.fn(),
    onLogout: jest.fn(),
} as unknown as PrivateAuthenticationStore;

let history: MemoryHistory;
export const getHistory = () => history;
export const resetHistory = () => {
    history = createMemoryHistory({ initialEntries: ['/inbox'] });
};
resetHistory();

export const config = {
    APP_NAME: APPS.PROTONMAIL,
    APP_VERSION: 'test-version',
    DATE_VERSION: 'test-date-version',
} as ProtonConfig;

export const onCompose = jest.fn();

interface Props {
    children: ReactNode;
}

export const ReduxProviderWrapper = ({ children }: Props) => {
    useSetReduxThunkExtraArgs();

    return <ReduxProvider store={store}>{children}</ReduxProvider>;
};

const TestProvider = ({ children }: Props) => {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <ConfigProvider config={config}>
            <ApiContext.Provider value={api}>
                <NotificationsTestProvider>
                    <ModalsProvider>
                        <AuthenticationProvider store={authentication}>
                            <CalendarModelEventManagerProvider>
                                <CacheProvider cache={mockCache}>
                                    <QuickSettingsTestProvider>
                                        <SpotlightProvider>
                                            <DrawerProvider>
                                                <ModalsChildren />
                                                <EventModelListener
                                                    models={[ConversationCountsModel, MessageCountsModel]}
                                                />
                                                <ReduxProviderWrapper>
                                                    <MailContentRefProvider mailContentRef={contentRef}>
                                                        <ChecklistsProvider>
                                                            <MailboxContainerContextProvider
                                                                isResizing={false}
                                                                containerRef={contentRef}
                                                                elementID={undefined}
                                                            >
                                                                <ComposeProvider onCompose={onCompose}>
                                                                    <CheckAllRefProvider>
                                                                        <Router history={history}>
                                                                            <Route path={MAIN_ROUTE_PATH}>
                                                                                <EncryptedSearchProvider>
                                                                                    <LabelActionsContextProvider>
                                                                                        {children}
                                                                                    </LabelActionsContextProvider>
                                                                                </EncryptedSearchProvider>
                                                                            </Route>
                                                                        </Router>
                                                                    </CheckAllRefProvider>
                                                                </ComposeProvider>
                                                            </MailboxContainerContextProvider>
                                                        </ChecklistsProvider>
                                                    </MailContentRefProvider>
                                                </ReduxProviderWrapper>
                                            </DrawerProvider>
                                        </SpotlightProvider>
                                    </QuickSettingsTestProvider>
                                </CacheProvider>
                            </CalendarModelEventManagerProvider>
                        </AuthenticationProvider>
                    </ModalsProvider>
                </NotificationsTestProvider>
            </ApiContext.Provider>
        </ConfigProvider>
    );
};

/**
 * Small helper to wait for asynchronous work to be executed
 * Should be avoided as much as possible, but often convenient
 */
export const tick = () => {
    return act(() => Promise.resolve());
};

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    preloadedState?: Partial<MailState>;
}

export const getStoreWrapper = (preloadedState?: ExtendedRenderOptions['preloadedState']) => {
    const store = setupStore({
        preloadedState: {
            user: getModelState({ UsedSpace: 10, MaxSpace: 100, Flags: {} } as UserModel),
            addresses: getModelState([]),
            addressKeys: {},
            userKeys: getModelState([{ publicKey: {}, privateKey: {} } as DecryptedKey]),
            userSettings: getModelState({ Flags: {} } as UserSettings),
            mailSettings: getModelState({
                ...DEFAULT_MAILSETTINGS,
                PMSignature: PM_SIGNATURE.ENABLED,
                DelaySendSeconds: DELAY_IN_SECONDS.NONE,
            }),
            subscription: getModelState({} as SubscriptionModel),
            organization: getModelState({} as Organization),
            organizationKey: getModelState({} as CachedOrganizationKey),
            userInvitations: getModelState([]),
            contacts: getModelState([]),
            categories: getModelState([]),
            contactEmails: getModelState([]),
            filters: getModelState([]),
            importerConfig: getModelState({} as ApiEnvironmentConfig),
            features: getFeatureFlags([[FeatureCode.SLIntegration, true]]),
            ...preloadedState,
        },
    });
    extendStore({ api: api, eventManager: jest.fn() as any });

    function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
        return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
    }

    return { Wrapper, store };
};

export const render = async (
    ui: ReactElement,
    useMinimalCache = true,
    { preloadedState, ...renderOptions }: ExtendedRenderOptions = {}
): Promise<RenderResult> => {
    mockDomApi();
    registerFeatureFlagsApiMock();

    if (useMinimalCache) {
        minimalCache();
    }

    const { Wrapper } = getStoreWrapper(preloadedState);

    const result = originalRender(
        <Wrapper>
            <TestProvider>{ui}</TestProvider>
        </Wrapper>,
        renderOptions
    );
    await tick(); // Should not be necessary, would be better not to use it, but fails without

    const rerender = async (ui: ReactElement) => {
        result.rerender(
            <Wrapper>
                <TestProvider>{ui}</TestProvider>
            </Wrapper>
        );
        await tick(); // Should not be necessary, would be better not to use it, but fails without
    };

    const unmount = () => {
        // Unmounting the component not the whole context
        result.rerender(
            <Wrapper>
                <TestProvider>{null}</TestProvider>
            </Wrapper>
        );
        return true;
    };

    return { ...result, rerender, unmount };
};

export const renderHook = async <TProps, TResult>(
    callback: (props: TProps) => TResult,
    useMinimalCache = true,
    preloadedState: ExtendedRenderOptions['preloadedState'] = {}
) => {
    registerFeatureFlagsApiMock();

    if (useMinimalCache) {
        minimalCache();
    }

    const { Wrapper } = getStoreWrapper(preloadedState);

    function HookWrapper({ children }: PropsWithChildren<{}>): JSX.Element {
        return (
            <Wrapper>
                <TestProvider>{children}</TestProvider>
            </Wrapper>
        );
    }

    const result = originalRenderHook<TProps, TResult>(callback, { wrapper: HookWrapper });
    await actHook(() => wait(0));
    return result;
};
