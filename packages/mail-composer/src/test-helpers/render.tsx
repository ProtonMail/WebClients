import type { ReactElement, ReactNode } from 'react';
import { useRef } from 'react';

import type { RenderOptions, RenderResult } from '@testing-library/react';
import { act, render } from '@testing-library/react';
import { act as actHook, renderHook } from '@testing-library/react-hooks/dom';

import { getModelState } from '@proton/account/testing/getModelState';
import { ApiContext } from '@proton/app-context/apiContext';
import SpotlightProvider from '@proton/components/components/spotlight/Provider';
import type { PrivateAuthenticationStore } from '@proton/components/containers/app/interface';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import { CacheProvider } from '@proton/components/containers/cache/Provider';
import ConfigProvider from '@proton/components/containers/config/Provider';
import ModalsChildren from '@proton/components/containers/modals/Children';
import ModalsProvider from '@proton/components/containers/modals/Provider';
import { mockCache } from '@proton/components/testing/cache';
import { withNotifications } from '@proton/components/testing/with-notifications';
import { registerFeatureFlagsApiMock } from '@proton/features/testing/features';
import { mailContactsInitialState } from '@proton/mail-message/store/contacts/contactsInitialState';
import { ProtonStoreProvider } from '@proton/redux-shared-store/sharedProvider';
import { APPS } from '@proton/shared/lib/constants';
import type { DecryptedKey } from '@proton/shared/lib/interfaces/Key';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';
import { DEFAULT_MAIL_SETTINGS, DELAY_IN_SECONDS, PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';
import { apiMock } from '@proton/test-api/api';

import { ComposerAssistantProvider } from '../components/assistant/provider/ComposerAssistantProvider';
import { ComposeProvider } from '../containers/ComposeProvider';
import { ComposerHostProvider } from '../hooks/composer/useComposerHost';
import { MailContentRefProvider } from '../hooks/useClickMailContent';
import { ComposerMessageHostProvider } from '../host/composerMessageHost';
import { composersInitialState } from '../store/composers/composersSlice';
import './helpers';
import { composerTestHost, composerTestMessageHost } from './messageHost';
import type { ComposerTestState, ComposerTestStore } from './store';
import { composerTestThunkArguments, setupComposerTestStore } from './store';

export interface ComposerTestRenderOptions extends Omit<RenderOptions, 'queries'> {
    preloadedState?: Partial<ComposerTestState>;
    onStore?: (store: ComposerTestStore) => void;
}

const onCompose = async () => {};

const config = { APP_NAME: APPS.PROTONMAIL, APP_VERSION: 'test-version' } as ProtonConfig;

const authentication = {
    getUID: jest.fn(() => 'uid'),
    getLocalID: jest.fn(),
    getPassword: jest.fn(() => ''),
    getPersistent: jest.fn(() => false),
    onLogout: jest.fn(),
    mode: '',
} as unknown as PrivateAuthenticationStore;

const NotificationsProvider = withNotifications()(({ children }: { children: ReactNode }) => <>{children}</>);

const ComposerTestProviders = ({ children }: { children: ReactNode }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <ConfigProvider config={config}>
            <ApiContext.Provider value={apiMock}>
                <NotificationsProvider>
                    <ModalsProvider>
                        <AuthenticationProvider store={authentication}>
                            <CacheProvider cache={mockCache}>
                                <SpotlightProvider>
                                    <ModalsChildren />
                                    <MailContentRefProvider mailContentRef={contentRef}>
                                        <ComposeProvider onCompose={onCompose}>
                                            <ComposerAssistantProvider>
                                                <ComposerMessageHostProvider host={composerTestMessageHost}>
                                                    <ComposerHostProvider value={composerTestHost}>
                                                        {children}
                                                    </ComposerHostProvider>
                                                </ComposerMessageHostProvider>
                                            </ComposerAssistantProvider>
                                        </ComposeProvider>
                                    </MailContentRefProvider>
                                </SpotlightProvider>
                            </CacheProvider>
                        </AuthenticationProvider>
                    </ModalsProvider>
                </NotificationsProvider>
            </ApiContext.Provider>
        </ConfigProvider>
    );
};

const createStore = (preloadedState: Partial<ComposerTestState> = {}) => {
    Object.assign(composerTestThunkArguments, { config, authentication, eventManager: { getEventID: jest.fn() } });

    return setupComposerTestStore({
        preloadedState: {
            user: getModelState({ UsedSpace: 10, MaxSpace: 100, Flags: {} } as UserModel),
            addresses: getModelState([]),
            addressKeys: {},
            userKeys: getModelState([{ publicKey: {}, privateKey: {} } as DecryptedKey]),
            userSettings: getModelState({ Flags: {}, Email: {}, Phone: {}, '2FA': {} } as UserSettings),
            mailSettings: getModelState({
                ...DEFAULT_MAIL_SETTINGS,
                PMSignature: PM_SIGNATURE.ENABLED,
                DelaySendSeconds: DELAY_IN_SECONDS.NONE,
            }),
            contacts: getModelState([]),
            contactEmails: getModelState([]),
            categories: getModelState([]),
            composers: composersInitialState,
            mailContacts: mailContactsInitialState,
            ...preloadedState,
        },
    });
};

/** Waits for the effects scheduled by the first render. */
export const tick = () => act(() => Promise.resolve());

export const composerTestRender = async (
    ui: ReactElement,
    { preloadedState, onStore, ...renderOptions }: ComposerTestRenderOptions = {}
): Promise<
    Omit<RenderResult, 'rerender'> & { store: ComposerTestStore; rerender: (ui: ReactNode) => Promise<void> }
> => {
    registerFeatureFlagsApiMock();
    const store = createStore(preloadedState);
    onStore?.(store);

    const withProviders = (node: ReactNode) => (
        <ProtonStoreProvider store={store}>
            <ComposerTestProviders>{node}</ComposerTestProviders>
        </ProtonStoreProvider>
    );

    const result = render(withProviders(ui), renderOptions);
    await tick();

    const rerender = async (node: ReactNode) => {
        result.rerender(withProviders(node));
        await tick();
    };

    return { ...result, store, rerender };
};

export const composerTestRenderHook = async <TProps, TResult>(
    useHook: (props: TProps) => TResult,
    { preloadedState, onStore }: Pick<ComposerTestRenderOptions, 'preloadedState' | 'onStore'> = {}
) => {
    registerFeatureFlagsApiMock();
    const store = createStore(preloadedState);
    onStore?.(store);

    const wrapper = ({ children }: { children?: ReactNode }) => (
        <ProtonStoreProvider store={store}>
            <ComposerTestProviders>{children}</ComposerTestProviders>
        </ProtonStoreProvider>
    );

    const result = renderHook<TProps, TResult>(useHook, { wrapper: wrapper as any });
    await actHook(() => Promise.resolve());

    return { ...result, store };
};
