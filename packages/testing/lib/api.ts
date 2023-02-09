import noop from '@proton/utils/noop';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

type ApiMockHandler = (...arg: any[]) => any;

type ApiMockEntry = {
    method?: HttpMethod;
    handler: (...arg: any[]) => any;
};

type ApiMock = { [url: string]: ApiMockEntry[] | undefined };

const apiMocks: ApiMock = {};

export const apiMock = jest.fn<Promise<any>, any>(async (args: any) => {
    const entryKey = Object.keys(apiMocks).find((path) => {
        return args.url === path;
    });
    const entry = apiMocks[entryKey || '']?.find((entry) => entry.method === undefined || entry.method === args.method);
    if (entry) {
        return entry.handler({ ...args });
    }
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
    const promise = new Promise((resolve) => {
        resolveLastPromise = resolve;
    });
    addApiMock(url, () => promise, method);
    return resolve;
};

export const clearApiMocks = () => {
    Object.keys(apiMocks).forEach((key) => delete apiMocks[key]);
};
