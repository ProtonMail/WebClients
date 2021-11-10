import { ReactElement, ReactNode, useRef } from 'react';
import * as React from 'react';
import {
    CacheProvider,
    ModalsProvider,
    PrivateAuthenticationStore,
    ModalsChildren,
    EventModelListener,
} from '@proton/components';
import { Router } from 'react-router';
import { createMemoryHistory, MemoryHistory } from 'history';
import { render as originalRender, RenderResult as OriginalRenderResult, act } from '@testing-library/react';
import { renderHook as originalRenderHook, act as actHook } from '@testing-library/react-hooks';
import ApiContext from '@proton/components/containers/api/apiContext';
import ConfigProvider from '@proton/components/containers/config/Provider';
import { wait } from '@proton/shared/lib/helpers/promise';
import { APPS } from '@proton/shared/lib/constants';
import { ProtonConfig } from '@proton/shared/lib/interfaces';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import FeaturesProvider from '@proton/components/containers/features/FeaturesProvider';
import { ConversationCountsModel, MessageCountsModel } from '@proton/shared/lib/models';
import { Provider as ReduxProvider } from 'react-redux';
import MessageProvider from '../../containers/MessageProvider';
import ConversationProvider from '../../containers/ConversationProvider';
import { minimalCache, cache, messageCache, conversationCache, attachmentsCache, contactCache } from './cache';
import { api, registerFeatureFlagsApiMock, registerMinimalFlags } from './api';
import AttachmentProvider from '../../containers/AttachmentProvider';
import ContactProvider from '../../containers/ContactProvider';
import EncryptedSearchProvider from '../../containers/EncryptedSearchProvider';
import { MailContentRefProvider } from '../../hooks/useClickMailContent';
import { ComposeProvider } from '../../containers/ComposeProvider';
import NotificationsTestProvider from './notifications';
import { store } from '../../logic/store';

interface RenderResult extends OriginalRenderResult {
    rerender: (ui: React.ReactElement) => Promise<void>;
}

export const authentication = {
    getUID: jest.fn(),
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
    APP_VERSION_DISPLAY: 'test-version-display',
    DATE_VERSION: 'test-date-version',
} as ProtonConfig;

const mockDomApi = () => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.URL.createObjectURL = jest.fn();
    // https://github.com/nickcolley/jest-axe/issues/147#issuecomment-758804533
    const { getComputedStyle } = window;
    window.getComputedStyle = (elt) => getComputedStyle(elt);
};

interface Props {
    children: ReactNode;
}

const TestProvider = ({ children }: Props) => {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <ConfigProvider config={config}>
            <ApiContext.Provider value={api}>
                <NotificationsTestProvider>
                    <ModalsProvider>
                        <AuthenticationProvider store={authentication}>
                            <CacheProvider cache={cache}>
                                <ModalsChildren />
                                <EventModelListener models={[ConversationCountsModel, MessageCountsModel]} />
                                <ReduxProvider store={store}>
                                    <MessageProvider cache={messageCache}>
                                        <ConversationProvider cache={conversationCache}>
                                            <AttachmentProvider cache={attachmentsCache}>
                                                <FeaturesProvider>
                                                    <ContactProvider cache={contactCache}>
                                                        <MailContentRefProvider mailContentRef={contentRef}>
                                                            <ComposeProvider onCompose={jest.fn()}>
                                                                <Router history={history}>
                                                                    <EncryptedSearchProvider>
                                                                        {children}
                                                                    </EncryptedSearchProvider>
                                                                </Router>
                                                            </ComposeProvider>
                                                        </MailContentRefProvider>
                                                    </ContactProvider>
                                                </FeaturesProvider>
                                            </AttachmentProvider>
                                        </ConversationProvider>
                                    </MessageProvider>
                                </ReduxProvider>
                            </CacheProvider>
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
export const tick = () => act(() => wait(0));

export const render = async (ui: ReactElement, useMinimalCache = true): Promise<RenderResult> => {
    mockDomApi();
    registerFeatureFlagsApiMock();

    if (useMinimalCache) {
        minimalCache();
        registerMinimalFlags();
    }

    const result = originalRender(<TestProvider>{ui}</TestProvider>);
    await tick(); // Should not be necessary, would be better not to use it, but fails without

    const rerender = async (ui: ReactElement) => {
        result.rerender(<TestProvider>{ui}</TestProvider>);
        await tick(); // Should not be necessary, would be better not to use it, but fails without
    };

    const unmount = () => {
        // Unmounting the component not the whole context
        result.rerender(<TestProvider>{null}</TestProvider>);
        return true;
    };

    return { ...result, rerender, unmount };
};

export const renderHook = async (callback: (props: any) => any, useMinimalCache = true) => {
    registerFeatureFlagsApiMock();

    if (useMinimalCache) {
        minimalCache();
        registerMinimalFlags();
    }

    const result = originalRenderHook<any, any>(callback, { wrapper: TestProvider as any });
    await actHook(() => wait(0));
    return result;
};
