import React from 'react';
import { CacheProvider, NotificationsProvider, ModalsProvider, PrivateAuthenticationStore } from 'react-components';
import { render as originalRender, RenderResult, act } from '@testing-library/react';
import { renderHook as originalRenderHook } from '@testing-library/react-hooks';
import ApiContext from 'react-components/containers/api/apiContext';
import { wait } from 'proton-shared/lib/helpers/promise';

import AuthenticationProvider from 'react-components/containers/authentication/Provider';
import MessageProvider from '../../containers/MessageProvider';
import ConversationProvider from '../../containers/ConversationProvider';
import { minimalCache, cache, messageCache, conversationCache } from './cache';
import { api } from './api';

export const authentication = ({
    getUID: jest.fn(),
    getLocalID: jest.fn(),
    getPassword: jest.fn()
} as unknown) as PrivateAuthenticationStore;

interface Props {
    children: JSX.Element;
}

const TestProvider = ({ children }: Props) => {
    return (
        <ApiContext.Provider value={api}>
            <NotificationsProvider>
                <ModalsProvider>
                    <AuthenticationProvider store={authentication}>
                        <CacheProvider cache={cache}>
                            <MessageProvider cache={messageCache}>
                                <ConversationProvider cache={conversationCache}>{children}</ConversationProvider>
                            </MessageProvider>
                        </CacheProvider>
                    </AuthenticationProvider>
                </ModalsProvider>
            </NotificationsProvider>
        </ApiContext.Provider>
    );
};

/**
 * Small helper to wait for asynchronous work to be executed
 * Should be avoided as much as possible, but often convenient
 */
export const tick = () => act(() => wait(0));

export const render = async (component: JSX.Element): Promise<RenderResult> => {
    minimalCache();
    const result = originalRender(<TestProvider>{component}</TestProvider>);
    await tick(); // Should not be necessary, would be better not to use it, but fails without
    return result;
};

export const renderHook = (callback: (props: any) => any) => {
    minimalCache();
    return originalRenderHook<any, any>(callback, { wrapper: TestProvider as any });
};
