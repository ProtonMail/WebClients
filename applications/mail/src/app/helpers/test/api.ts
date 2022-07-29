import { matchPath } from 'react-router';

import { FeatureCode } from '@proton/components';
import noop from '@proton/utils/noop';

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
    const promise = new Promise((resolve) => {
        resolveLastPromise = resolve;
    });
    addApiMock(url, () => promise, method);
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
        'core/v4/features',
        (args) => {
            const { Code } = args.params;
            const features: string[] = Code.split(',');
            return {
                Features: features.map((code) =>
                    featureFlags[code] ? featureFlags[code] : { ...defaultFeatureFlagValue, Code: code }
                ),
            };
        },
        'get'
    );
};

export const registerMinimalFlags = () => {
    setFeatureFlags(FeatureCode.SpotlightEncryptedSearch, false);
};

export const parseFormData = (data: any) => {
    const result: any = {};

    const createStructure = (resultContext: any, name: string, left: string, value: any) => {
        if (!resultContext[name]) {
            resultContext[name] = {};
        }
        if (left === '') {
            resultContext[name] = value;
        } else {
            const [, newName, newLeft] = /^\[([^[]+)\](.*)/.exec(left) || [];
            createStructure(resultContext[name], newName, newLeft, value);
        }
    };

    Object.entries(data).forEach(([key, value]) => {
        const [, name, left] = /^([^[]+)(.*)/.exec(key) || [];
        createStructure(result, name, left, value);
    });

    return result;
};

export const mockDomApi = () => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.URL.createObjectURL = jest.fn();
    // https://github.com/nickcolley/jest-axe/issues/147#issuecomment-758804533
    const { getComputedStyle } = window;
    window.getComputedStyle = (elt) => getComputedStyle(elt);
    window.ResizeObserver = jest.fn(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
};
