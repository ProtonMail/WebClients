import React from 'react';
import { CacheProvider, NotificationsProvider, ModalsProvider } from 'react-components';
import { render as originalRender, act, RenderResult } from '@testing-library/react';
import ApiContext from 'react-components/containers/api/apiContext';
import createCache from 'proton-shared/lib/helpers/cache';
import { wait } from 'proton-shared/lib/helpers/promise';
import { STATUS } from 'proton-shared/lib/models/cache';

type ApiMock = {
    [url: string]: (...arg: any[]) => any;
};

export const apiMocks: ApiMock = {};

export const api = jest.fn<Promise<any>, any>(async (args: any) => {
    // console.log('mocked api', ...args);

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

export const addToCache = (key: string, value: any) => {
    cache.set(key, { status: STATUS.RESOLVED, value });
};

export const clearCache = () => cache.reset();

export const clearAll = () => {
    clearApiMocks();
    clearCache();
};

interface Props {
    children: JSX.Element;
}

const TestProvider = ({ children }: Props) => {
    return (
        <ApiContext.Provider value={api}>
            <CacheProvider cache={cache}>
                <NotificationsProvider>
                    <ModalsProvider>{children}</ModalsProvider>
                </NotificationsProvider>
            </CacheProvider>
        </ApiContext.Provider>
    );
};

export const render = async (component: JSX.Element): Promise<RenderResult> => {
    addToCache('User', {});
    const result = originalRender(<TestProvider>{component}</TestProvider>);
    await act(() => wait(0));
    return result;
};
