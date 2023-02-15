import noop from '@proton/utils/noop';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

type ApiMockHandler = (...arg: any[]) => any;

type ApiMockEntry = {
    method?: HttpMethod;
    handler: (...arg: any[]) => any;
};

type ApiMock = { [url: string]: ApiMockEntry[] | undefined };

const apiMocks: ApiMock = {};

const apiMock = jest.fn<Promise<any>, any>(async (args: any) => {
    const entryKey = Object.keys(apiMocks).find((path) => {
        return args.url === path;
    });
    const entry = apiMocks[entryKey || '']?.find((entry) => entry.method === undefined || entry.method === args.method);
    if (entry) {
        return entry.handler({ ...args });
    }
    return {};
});

const addApiMock = (url: string, handler: ApiMockHandler, method?: HttpMethod) => {
    const newEntry = { method, handler };
    if (!apiMocks[url]) {
        apiMocks[url] = [newEntry];
    } else {
        apiMocks[url] = apiMocks[url]?.filter((entry) => entry.method !== newEntry.method).concat([newEntry]);
    }
};

const addApiResolver = (url: string, method?: HttpMethod) => {
    let resolveLastPromise: (result: any) => void = noop;
    const resolve = (value: any) => resolveLastPromise(value);
    const promise = new Promise((resolve) => {
        resolveLastPromise = resolve;
    });
    addApiMock(url, () => promise, method);
    return resolve;
};

const clearApiMocks = () => {
    Object.keys(apiMocks).forEach((key) => delete apiMocks[key]);
};

const featureFlags: { [code: string]: any } = {};

const defaultFeatureFlagValue = {
    Code: '',
    Type: 'boolean',
    Global: false,
    DefaultValue: false,
    Value: false,
    UpdateTime: 1616511553,
    Writable: true,
};

const addFeatureFlag = (featureCode: string, value: boolean) => {
    featureFlags[featureCode] = {
        ...defaultFeatureFlagValue,
        Code: featureCode,
        Value: value,
    };
};

const clearFeatureFlags = () => {
    Object.keys(featureFlags).forEach((key) => delete apiMocks[key]);
};

const registerFeatureFlagsApiMock = () => {
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

export default {
    apiMock,
    addApiMock,
    addApiResolver,
    clearApiMocks,
    clearFeatureFlags,
    registerFeatureFlagsApiMock,
    addFeatureFlag,
};
