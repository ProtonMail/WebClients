import { noop } from 'proton-shared/lib/helpers/function';

type ApiMock = {
    [url: string]: (...arg: any[]) => any;
};

export const apiMocks: ApiMock = {};

export const api = jest.fn<Promise<any>, any>(async (args: any) => {
    if (apiMocks[args.url]) {
        return apiMocks[args.url](args);
    }
    // console.log('api', args);
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
