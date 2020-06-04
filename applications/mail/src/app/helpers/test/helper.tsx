import React from 'react';
import { CacheProvider, NotificationsProvider, ModalsProvider } from 'react-components';
import { render as originalRender, act, RenderResult } from '@testing-library/react';
import { renderHook as originalRenderHook } from '@testing-library/react-hooks';
import ApiContext from 'react-components/containers/api/apiContext';
import createCache from 'proton-shared/lib/helpers/cache';
import { wait } from 'proton-shared/lib/helpers/promise';
import { STATUS } from 'proton-shared/lib/models/cache';
import AuthenticationProvider from 'react-components/containers/authentication/Provider';
import MessageProvider, { MessageCache } from '../../containers/MessageProvider';
import ConversationProvider, { ConversationCache } from '../../containers/ConversationProvider';

type ApiMock = {
    [url: string]: (...arg: any[]) => any;
};

export const apiMocks: ApiMock = {};

export const authentication = {
    getPassword: jest.fn()
};

export const api = jest.fn<Promise<any>, any>(async (args: any) => {
    if (apiMocks[args.url]) {
        return apiMocks[args.url](args);
    }

    return {};
});

export const addApiMock = (url: string, handler: (...arg: any[]) => any) => {
    apiMocks[url] = handler;
};

export const clearApiMocks = () => {
    Object.keys(apiMocks).forEach((key) => delete apiMocks[key]);
};

export const cache = createCache();
export const messageCache = createCache() as MessageCache;
export const conversationCache = createCache() as ConversationCache;

export const addToCache = (key: string, value: any) => {
    cache.set(key, { status: STATUS.RESOLVED, value });
};

export const clearCache = () => cache.reset();

export const minimalCache = () => {
    addToCache('User', {});
    addToCache('Addresses', []);
};

export const clearAll = () => {
    clearApiMocks();
    clearCache();
    messageCache.reset();
    conversationCache.reset();
};

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
