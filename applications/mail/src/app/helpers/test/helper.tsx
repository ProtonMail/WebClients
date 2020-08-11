import React from 'react';
import {
    CacheProvider,
    NotificationsProvider,
    ModalsProvider,
    useEventManager,
    PrivateAuthenticationStore
} from 'react-components';
import { render as originalRender, RenderResult, act } from '@testing-library/react';
import { renderHook as originalRenderHook } from '@testing-library/react-hooks';
import ApiContext from 'react-components/containers/api/apiContext';
import createCache from 'proton-shared/lib/helpers/cache';
import { wait } from 'proton-shared/lib/helpers/promise';
import { STATUS } from 'proton-shared/lib/models/cache';
import { noop } from 'proton-shared/lib/helpers/function';

import AuthenticationProvider from 'react-components/containers/authentication/Provider';
import MessageProvider from '../../containers/MessageProvider';
import ConversationProvider from '../../containers/ConversationProvider';
import { Event } from '../../models/event';
import { MessageExtended } from '../../models/message';
import { ConversationResult } from '../../hooks/useConversation';
import { ELEMENTS_CACHE_KEY } from '../../hooks/useElementsCache';

type ApiMock = {
    [url: string]: (...arg: any[]) => any;
};

export const apiMocks: ApiMock = {};

export const authentication = ({
    getUID: jest.fn(),
    getLocalID: jest.fn(),
    getPassword: jest.fn()
} as unknown) as PrivateAuthenticationStore;

export const api = jest.fn<Promise<any>, any>(async (args: any) => {
    if (apiMocks[args.url]) {
        return apiMocks[args.url](args);
    }

    return {};
});

export const addApiMock = (url: string, handler: (...arg: any[]) => any) => {
    apiMocks[url] = handler;
};

export const addApiResolver = (url: string) => {
    let resolveLastPromise: (result: any) => void = noop;
    const resolve = (value: any) => resolveLastPromise(value);
    apiMocks[url] = () =>
        new Promise((resolve) => {
            resolveLastPromise = resolve;
        });
    return resolve;
};

export const clearApiMocks = () => {
    Object.keys(apiMocks).forEach((key) => delete apiMocks[key]);
};

export const cache = createCache();
export const messageCache = createCache<string, MessageExtended>();
export const conversationCache = createCache<string, ConversationResult>();

export const addToCache = (key: string, value: any) => {
    cache.set(key, { status: STATUS.RESOLVED, value });
};

export const clearCache = () => cache.clear();

export const minimalCache = () => {
    addToCache('User', {});
    addToCache('Addresses', []);
    addToCache('MailSettings', {});
    addToCache('ContactEmails', []);
    cache.set(ELEMENTS_CACHE_KEY, { elements: {}, params: { sort: {} }, pages: [], page: {}, updatedElements: [] });
};

export const eventManagerListeners: ((...args: any[]) => any)[] = [];

export const clearAll = () => {
    api.mockClear();
    clearApiMocks();
    clearCache();
    messageCache.clear();
    conversationCache.clear();
    cache.delete(ELEMENTS_CACHE_KEY);
    eventManagerListeners.splice(0, eventManagerListeners.length);
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

((useEventManager as any).subscribe as jest.Mock).mockImplementation((listener) => {
    eventManagerListeners.push(listener);
});

export const triggerEvent = (event: Event) => {
    eventManagerListeners.forEach((listener) => listener(event));
};
