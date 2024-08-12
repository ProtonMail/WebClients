import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { useRef } from 'react';
import { Route, Router } from 'react-router';

import type { RenderResult as OriginalRenderResult, RenderOptions } from '@testing-library/react';
import { act, render as originalRender } from '@testing-library/react';
import { act as actHook, renderHook as originalRenderHook } from '@testing-library/react-hooks';
import type { History } from 'history';
import { createMemoryHistory } from 'history';

import { getModelState } from '@proton/account/test';
import { createCalendarModelEventManager } from '@proton/calendar/calendarModelEventManager';
import type { PrivateAuthenticationStore } from '@proton/components';
import { CacheProvider, CalendarModelEventManagerProvider, ModalsChildren, ModalsProvider } from '@proton/components';
import SpotlightProvider from '@proton/components/components/spotlight/Provider';
import ApiContext from '@proton/components/containers/api/apiContext';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import ConfigProvider from '@proton/components/containers/config/Provider';
import { DrawerProvider } from '@proton/components/hooks/drawer/useDrawer';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { APPS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type {
    ApiEnvironmentConfig,
    CachedOrganizationKey,
    DecryptedKey,
    ProtonConfig,
    UserModel,
    UserSettings,
} from '@proton/shared/lib/interfaces';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';
import { DEFAULT_MAILSETTINGS, DELAY_IN_SECONDS, PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';
import { registerFeatureFlagsApiMock } from '@proton/testing/lib/features';
import { getOrganizationState, getSubscriptionState } from '@proton/testing/lib/initialReduxState';

import { ComposerAssistantProvider } from 'proton-mail/components/assistant/provider/ComposerAssistantProvider';
import QuickSettingsTestProvider from 'proton-mail/helpers/test/quick-settings';
import type { AttachmentsState } from 'proton-mail/store/attachments/attachmentsTypes';
import { composersInitialState } from 'proton-mail/store/composers/composersSlice';
import { mailContactsInitialState } from 'proton-mail/store/contacts/contactsSlice';
import type { ConversationsState } from 'proton-mail/store/conversations/conversationsTypes';
import { newElementsState } from 'proton-mail/store/elements/elementsSlice';
import { incomingDefaultsInitialState } from 'proton-mail/store/incomingDefaults/incomingDefaultsSlice';
import { layoutInitialState } from 'proton-mail/store/layout/layoutSlice';
import type { MessagesState } from 'proton-mail/store/messages/messagesTypes';
import { snoozeInitialState } from 'proton-mail/store/snooze/snoozeSlice';

import { LabelActionsContextProvider } from '../../components/sidebar/EditLabelContext';
import { MAIN_ROUTE_PATH } from '../../constants';
import { CheckAllRefProvider } from '../../containers/CheckAllRefProvider';
import { ComposeProvider } from '../../containers/ComposeProvider';
import EncryptedSearchProvider from '../../containers/EncryptedSearchProvider';
import { MailboxContainerContextProvider } from '../../containers/mailbox/MailboxContainerProvider';
import ChecklistsProvider from '../../containers/onboardingChecklist/provider/ChecklistsProvider';
import { MailContentRefProvider } from '../../hooks/useClickMailContent';
import type { MailState, MailStore } from '../../store/store';
import { extendStore, setupStore } from '../../store/store';
import { api, mockDomApi } from './api';
import { mockCache } from './cache';
import NotificationsTestProvider from './notifications';

interface RenderResult extends OriginalRenderResult {
    rerender: (ui: ReactNode) => Promise<void>;
    store: MailStore;
    history: History;
}

export const authentication = {
    getUID: jest.fn(() => 'uid'),
    getLocalID: jest.fn(),
    getPassword: jest.fn(),
    onLogout: jest.fn(),
    mode: '',
} as unknown as PrivateAuthenticationStore;

export const config = {
    APP_NAME: APPS.PROTONMAIL,
    APP_VERSION: 'test-version',
    DATE_VERSION: 'test-date-version',
} as ProtonConfig;

export const onCompose = jest.fn();

interface Props {
    children: ReactNode;
    history: History;
}

const calendarModelEventManager = createCalendarModelEventManager({ api });

const TestProvider = ({ children, history }: Props) => {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <ConfigProvider config={config}>
            <ApiContext.Provider value={api}>
                <NotificationsTestProvider>
                    <ModalsProvider>
                        <AuthenticationProvider store={authentication}>
                            <CalendarModelEventManagerProvider calendarModelEventManager={calendarModelEventManager}>
                                <CacheProvider cache={mockCache}>
                                    <QuickSettingsTestProvider>
                                        <SpotlightProvider>
                                            <DrawerProvider>
                                                <ModalsChildren />
                                                <MailContentRefProvider mailContentRef={contentRef}>
                                                    <ChecklistsProvider>
                                                        <MailboxContainerContextProvider
                                                            isResizing={false}
                                                            containerRef={contentRef}
                                                            elementID={undefined}
                                                        >
                                                            <ComposeProvider onCompose={onCompose}>
                                                                <ComposerAssistantProvider>
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
                                                                </ComposerAssistantProvider>
                                                            </ComposeProvider>
                                                        </MailboxContainerContextProvider>
                                                    </ChecklistsProvider>
                                                </MailContentRefProvider>
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
    onStore?: (store: MailStore) => void;
    initialEntries?: string[];
    initialPath?: string;
}

export const getStoreWrapper = (preloadedState?: ExtendedRenderOptions['preloadedState']) => {
    const store = setupStore({
        preloadedState: {
            user: getModelState({ UsedSpace: 10, MaxSpace: 100, Flags: {} } as UserModel),
            addresses: getModelState([]),
            addressKeys: {},
            userKeys: getModelState([{ publicKey: {}, privateKey: {} } as DecryptedKey]),
            userSettings: getModelState({ Flags: {}, Email: {}, Phone: {}, '2FA': {} } as UserSettings),
            mailSettings: getModelState({
                ...DEFAULT_MAILSETTINGS,
                PMSignature: PM_SIGNATURE.ENABLED,
                DelaySendSeconds: DELAY_IN_SECONDS.NONE,
            }),
            subscription: getSubscriptionState(),
            organization: getOrganizationState(),
            organizationKey: getModelState({} as CachedOrganizationKey),
            userInvitations: getModelState([]),
            contacts: getModelState([]),
            categories: getModelState([]),
            contactEmails: getModelState([]),
            filters: getModelState([]),
            calendars: getModelState([]),
            calendarUserSettings: getModelState({} as CalendarUserSettings),
            holidaysDirectory: getModelState([]),
            importerConfig: getModelState({} as ApiEnvironmentConfig),
            conversationCounts: getModelState([]),
            messageCounts: getModelState([]),
            attachments: {} as AttachmentsState,
            composers: composersInitialState,
            conversations: {} as ConversationsState,
            elements: newElementsState(),
            incomingDefaults: incomingDefaultsInitialState,
            layout: layoutInitialState,
            mailContacts: mailContactsInitialState,
            messages: {} as MessagesState,
            snooze: snoozeInitialState,
            ...preloadedState,
        },
    });
    extendStore({
        authentication: {
            getPassword: () => '',
        } as any,
        api: api as any,
        eventManager: jest.fn() as any,
    });

    function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
        return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
    }

    return { Wrapper, store };
};

export const render = async (
    ui: ReactElement,
    { preloadedState, initialEntries = ['/inbox'], initialPath, onStore, ...renderOptions }: ExtendedRenderOptions = {}
): Promise<RenderResult> => {
    mockDomApi();
    registerFeatureFlagsApiMock();

    const { Wrapper, store } = getStoreWrapper(preloadedState);
    await onStore?.(store);

    const history = createMemoryHistory({ initialEntries });
    if (initialPath) {
        history.push(initialPath);
    }

    const result = originalRender(
        <Wrapper>
            <TestProvider history={history}>{ui}</TestProvider>
        </Wrapper>,
        { ...renderOptions, legacyRoot: true }
    );
    await tick(); // Should not be necessary, would be better not to use it, but fails without

    const rerender = async (ui: ReactNode) => {
        result.rerender(
            <Wrapper>
                <TestProvider history={history}>{ui}</TestProvider>
            </Wrapper>
        );
        await tick(); // Should not be necessary, would be better not to use it, but fails without
    };

    const unmount = () => {
        // Unmounting the component not the whole context
        result.rerender(
            <Wrapper>
                <TestProvider history={history}>{null}</TestProvider>
            </Wrapper>
        );
        return true;
    };

    return { ...result, store, rerender, unmount, history };
};

export const renderHook = async <TProps, TResult>({
    useCallback,
    preloadedState = {},
    init,
}: {
    useCallback: (props: TProps) => TResult;
    preloadedState?: ExtendedRenderOptions['preloadedState'];
    init?: (store: MailStore) => void;
}) => {
    registerFeatureFlagsApiMock();

    const { store, Wrapper } = getStoreWrapper(preloadedState);
    init?.(store);
    const history = createMemoryHistory();

    const HookWrapper = ({ children }: { children?: ReactNode }) => {
        return (
            <Wrapper>
                <TestProvider history={history}>{children}</TestProvider>
            </Wrapper>
        );
    };

    const result = originalRenderHook<TProps, TResult>(useCallback, { wrapper: HookWrapper as any });
    await actHook(() => wait(0));
    return { ...result, store };
};
