import noop from '@proton/utils/noop';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

export type ApiMockHandler = (...arg: any[]) => any;

type ApiMockEntry = {
    method?: HttpMethod;
    handler: (...arg: any[]) => any;
};

type ApiMock = { [url: string]: ApiMockEntry[] | undefined };

export const apiMocksMap: ApiMock = {};

let logging = false;
export const enableMockApiLogging = () => (logging = true);
export const disableMockApiLogging = () => (logging = false);

export const apiMock = jest.fn<Promise<any>, any>(async (args: any) => {
    const entryKey = Object.keys(apiMocksMap).find((path) => {
        return args.url === path;
    });
    const entry = apiMocksMap[entryKey || '']?.find(
        (entry) => entry.method === undefined || entry.method === args.method
    );
    if (entry) {
        if (logging) {
            console.log('apiMock', args);
            console.log('apiMock entry', entry);
        }
        const result = entry.handler({ ...args });
        if (logging) {
            console.log('apiMock result', result);
        }
        return result;
    }
    return {};
});

export const addApiMock = (url: string, handler: ApiMockHandler, method?: HttpMethod) => {
    const newEntry = { method, handler };
    if (!apiMocksMap[url]) {
        apiMocksMap[url] = [newEntry];
    } else {
        apiMocksMap[url] = apiMocksMap[url]?.filter((entry) => entry.method !== newEntry.method).concat([newEntry]);
    }
};

export const addApiResolver = (url: string, method?: HttpMethod) => {
    let resolveLastPromise: (result: any) => void = noop;
    let rejectLastPromise: (result: any) => void = noop;

    const resolve = (value: any) => resolveLastPromise(value);
    const reject = (value: any) => rejectLastPromise(value);

    const promise = new Promise((resolve, reject) => {
        resolveLastPromise = resolve;
        rejectLastPromise = reject;
    });
    addApiMock(url, () => promise, method);
    return { resolve, reject };
};

export const clearApiMocks = () => {
    Object.keys(apiMocksMap).forEach((key) => delete apiMocksMap[key]);
};
