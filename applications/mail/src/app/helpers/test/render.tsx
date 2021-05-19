import React, { ReactElement, useRef } from 'react';
import {
    CacheProvider,
    NotificationsProvider,
    ModalsProvider,
    PrivateAuthenticationStore,
    ModalsChildren,
    EventModelListener,
} from 'react-components';
import { Router } from 'react-router';
import { createMemoryHistory, MemoryHistory } from 'history';
import { render as originalRender, RenderResult as OriginalRenderResult, act } from '@testing-library/react';
import { renderHook as originalRenderHook } from '@testing-library/react-hooks';
import ApiContext from 'react-components/containers/api/apiContext';
import ConfigProvider from 'react-components/containers/config/Provider';
import { wait } from 'proton-shared/lib/helpers/promise';
import { APPS } from 'proton-shared/lib/constants';
import { ProtonConfig } from 'proton-shared/lib/interfaces';
import AuthenticationProvider from 'react-components/containers/authentication/Provider';
import FeaturesProvider from 'react-components/containers/features/FeaturesProvider';
import { ConversationCountsModel, MessageCountsModel } from 'proton-shared/lib/models';
import MessageProvider from '../../containers/MessageProvider';
import ConversationProvider from '../../containers/ConversationProvider';
import { minimalCache, cache, messageCache, conversationCache, attachmentsCache, contactCache } from './cache';
import { api } from './api';
import AttachmentProvider from '../../containers/AttachmentProvider';
import ContactProvider from '../../containers/ContactProvider';
import EncryptedSearchProvider from '../../containers/EncryptedSearchProvider';
import { MailContentRefProvider } from '../../hooks/useClickMailContent';

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

interface Props {
    children: JSX.Element;
}

export const config = {
    APP_NAME: APPS.PROTONMAIL,
    APP_VERSION: 'test-version',
    APP_VERSION_DISPLAY: 'test-version-display',
    DATE_VERSION: 'test-date-version',
} as ProtonConfig;

const mockDomApi = () => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.URL.createObjectURL = jest.fn();
};

const TestProvider = ({ children }: Props) => {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <ConfigProvider config={config}>
            <ApiContext.Provider value={api}>
                <NotificationsProvider>
                    <ModalsProvider>
                        <AuthenticationProvider store={authentication}>
                            <CacheProvider cache={cache}>
                                <ModalsChildren />
                                <EventModelListener models={[ConversationCountsModel, MessageCountsModel]} />
                                <MessageProvider cache={messageCache}>
                                    <ConversationProvider cache={conversationCache}>
                                        <AttachmentProvider cache={attachmentsCache}>
                                            <FeaturesProvider>
                                                <ContactProvider cache={contactCache}>
                                                    <MailContentRefProvider mailContentRef={contentRef}>
                                                        <Router history={history}>
                                                            <EncryptedSearchProvider>
                                                                {children}
                                                            </EncryptedSearchProvider>
                                                        </Router>
                                                    </MailContentRefProvider>
                                                </ContactProvider>
                                            </FeaturesProvider>
                                        </AttachmentProvider>
                                    </ConversationProvider>
                                </MessageProvider>
                            </CacheProvider>
                        </AuthenticationProvider>
                    </ModalsProvider>
                </NotificationsProvider>
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

    if (useMinimalCache) {
        minimalCache();
    }

    const result = originalRender(<TestProvider>{ui}</TestProvider>);
    await tick(); // Should not be necessary, would be better not to use it, but fails without

    const rerender = async (ui: ReactElement) => {
        result.rerender(<TestProvider>{ui}</TestProvider>);
        await tick(); // Should not be necessary, would be better not to use it, but fails without
    };

    return { ...result, rerender };
};

export const renderHook = (callback: (props: any) => any, useMinimalCache = true) => {
    if (useMinimalCache) {
        minimalCache();
    }
    return originalRenderHook<any, any>(callback, { wrapper: TestProvider as any });
};
