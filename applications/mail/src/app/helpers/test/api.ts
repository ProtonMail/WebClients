import { matchPath } from 'react-router';
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
    let matchData: ReturnType<typeof matchPath> = {} as any;
    const entryKey = Object.keys(apiMocks).find((path) => {
        // react-router has nothing to do with this logic but the helper is quite useful here
        matchData = matchPath(args.url, { path, exact: true });
        return matchData !== null;
    });
    const entry = apiMocks[entryKey || '']?.find((entry) => entry.method === undefined || entry.method === args.method);
    if (entry) {
        return entry.handler({ ...matchData, ...args });
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

export const featureFlags: { [code: string]: any } = {};

export const defaultFeatureFlagValue = {
    Code: '',
    Type: 'boolean',
    Global: false,
    DefaultValue: false,
    Value: false,
    UpdateTime: 1616511553,
    Writable: true,
};

export const setFeatureFlags = (featureCode: string, value: boolean) => {
    featureFlags[featureCode] = {
        ...defaultFeatureFlagValue,
        Code: featureCode,
        Value: value,
    };
};

export const clearFeatureFlags = () => {
    Object.keys(featureFlags).forEach((key) => delete apiMocks[key]);
};

export const registerFeatureFlagsApiMock = () => {
    addApiMock(
        'core/v4/features/:feature',
        (args) => {
            const { feature } = args.params;
            return {
                Feature: featureFlags[feature] ? featureFlags[feature] : { ...defaultFeatureFlagValue, Code: feature },
            };
        },
        'get'
    );
};
