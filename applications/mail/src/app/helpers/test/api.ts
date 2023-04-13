import { FeatureCode } from '@proton/components';
import { addApiMock, addApiResolver, apiMock, apiMocksMap, clearApiMocks } from '@proton/testing';

/**
 * Export for backward compatibility in the tests. It can be gradually migrated to use @proton/testing package directly
 * in the tests.
 */
export { addApiMock, addApiResolver, clearApiMocks, apiMock as api, apiMocksMap as apiMocks };

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
    Object.keys(featureFlags).forEach((key) => delete apiMocksMap[key]);
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
    // https://github.com/nickcolley/jest-axe/issues/147#issuecomment-758804533
    const { getComputedStyle } = window;
    window.getComputedStyle = (elt) => getComputedStyle(elt);
    window.ResizeObserver = jest.fn(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
};
