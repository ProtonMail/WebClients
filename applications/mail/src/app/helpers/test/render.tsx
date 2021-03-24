import React, { ReactElement } from 'react';
import {
    CacheProvider,
    NotificationsProvider,
    ModalsProvider,
    PrivateAuthenticationStore,
    ModalsChildren,
} from 'react-components';
import { MemoryRouter } from 'react-router';
import { render as originalRender, RenderResult as OriginalRenderResult, act } from '@testing-library/react';
import { renderHook as originalRenderHook } from '@testing-library/react-hooks';
import ApiContext from 'react-components/containers/api/apiContext';
import ConfigProvider from 'react-components/containers/config/Provider';
import { wait } from 'proton-shared/lib/helpers/promise';
import { ProtonConfig } from 'proton-shared/lib/interfaces';
import AuthenticationProvider from 'react-components/containers/authentication/Provider';
import MessageProvider from '../../containers/MessageProvider';
import ConversationProvider from '../../containers/ConversationProvider';
import { minimalCache, cache, messageCache, conversationCache, attachmentsCache, contactCache } from './cache';
import { api } from './api';
import AttachmentProvider from '../../containers/AttachmentProvider';
import ContactProvider from '../../containers/ContactProvider';

interface RenderResult extends OriginalRenderResult {
    rerender: (ui: React.ReactElement) => Promise<void>;
}

export const authentication = ({
    getUID: jest.fn(),
    getLocalID: jest.fn(),
    getPassword: jest.fn(),
} as unknown) as PrivateAuthenticationStore;

interface Props {
    children: JSX.Element;
}

export const config = {} as ProtonConfig;

const TestProvider = ({ children }: Props) => {
    return (
        <ConfigProvider config={config}>
            <ApiContext.Provider value={api}>
                <NotificationsProvider>
                    <ModalsProvider>
                        <AuthenticationProvider store={authentication}>
                            <CacheProvider cache={cache}>
                                <ModalsChildren />
                                <MessageProvider cache={messageCache}>
                                    <ConversationProvider cache={conversationCache}>
                                        <AttachmentProvider cache={attachmentsCache}>
                                            <ContactProvider cache={contactCache}>
                                                <MemoryRouter initialEntries={['/inbox']}>{children}</MemoryRouter>
                                            </ContactProvider>
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
