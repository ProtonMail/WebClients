import { noop } from 'proton-shared/lib/helpers/function';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

type ApiMockHandler = (...arg: any[]) => any;

type ApiMockEntry = {
    method?: HttpMethod;
    handler: (...arg: any[]) => any;
};

type ApiMock = { [url: string]: ApiMockEntry[] | undefined };

export const apiMocks: ApiMock = {};

export const api = jest.fn<Promise<any>, any>(async (args: any) => {
    const entry = apiMocks[args.url]?.find((entry) => entry.method === undefined || entry.method === args.method);
    if (entry) {
        return entry.handler(args);
    }
    console.log('api', args, apiMocks);
    return {};
});

export const addApiMock = (url: string, handler: ApiMockHandler, method?: HttpMethod) => {
    const newEntry = { method, handler };
    if (!apiMocks[url]) {
        apiMocks[url] = [newEntry];
    } else {
        apiMocks[url] = apiMocks[url]?.filter((entry) => entry.method !== newEntry.method).concat([newEntry]);
    }
};

export const addApiResolver = (url: string, method?: HttpMethod) => {
    let resolveLastPromise: (result: any) => void = noop;
    const resolve = (value: any) => resolveLastPromise(value);
    addApiMock(
        url,
        () =>
            new Promise((resolve) => {
                resolveLastPromise = resolve;
            }),
        method
    );
    return resolve;
};

export const clearApiMocks = () => {
    Object.keys(apiMocks).forEach((key) => delete apiMocks[key]);
};
