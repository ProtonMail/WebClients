import { noop } from 'proton-shared/lib/helpers/function';

type ApiMockHandler = (...arg: any[]) => any;

type ApiMock = { [url: string]: ApiMockHandler };

export const apiMocks: ApiMock = {};

export const api = jest.fn<Promise<any>, any>(async (args: any) => {
    if (apiMocks[args.url]) {
        return await apiMocks[args.url](args);
    }
    console.log('api', args, apiMocks);
    return {};
});

export const addApiMock = (url: string, handler: ApiMockHandler) => {
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
